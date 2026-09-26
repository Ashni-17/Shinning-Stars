const { validationResult } = require('express-validator');
const db = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');
const stockService = require('../services/stockService');

const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

const getReceiptWithItems = async (client, receiptId) => {
  const receiptResult = await client.query('SELECT * FROM receipts WHERE id = $1', [receiptId]);
  if (receiptResult.rows.length === 0) {
    throw new ApiError(404, 'Receipt not found');
  }

  const itemsResult = await client.query(
    `SELECT ri.*, p.name AS product_name, p.sku
     FROM receipt_items ri
     JOIN products p ON p.id = ri.product_id
     WHERE ri.receipt_id = $1`,
    [receiptId]
  );

  return { ...receiptResult.rows[0], items: itemsResult.rows };
};

/**
 * GET /api/receipts
 */
const getAllReceipts = asyncHandler(async (req, res) => {
  const { status, warehouseId } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (warehouseId) {
    params.push(warehouseId);
    conditions.push(`warehouse_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM receipts ${whereClause} ORDER BY created_at DESC`,
    params
  );

  res.status(200).json({ success: true, message: 'Receipts fetched successfully', data: result.rows });
});

/**
 * GET /api/receipts/:id
 */
const getReceiptById = asyncHandler(async (req, res) => {
  const receipt = await getReceiptWithItems(db, req.params.id);
  res.status(200).json({ success: true, message: 'Receipt fetched successfully', data: receipt });
});

/**
 * POST /api/receipts
 * Creates a receipt in DRAFT status. Stock is NOT changed yet - that
 * only happens when the receipt is validated.
 */
const createReceipt = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { supplierName, warehouseId, locationId, reference, items } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const receiptResult = await client.query(
      `INSERT INTO receipts (supplier_name, warehouse_id, location_id, reference, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING *`,
      [supplierName, warehouseId, locationId || null, reference || null, req.user.id]
    );
    const receipt = receiptResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO receipt_items (receipt_id, product_id, expected_quantity, received_quantity)
         VALUES ($1, $2, $3, $3)`,
        [receipt.id, item.productId, item.quantity]
      );
    }

    await client.query('COMMIT');

    const full = await getReceiptWithItems(db, receipt.id);
    res.status(201).json({ success: true, message: 'Receipt created successfully', data: full });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/receipts/:id
 * Only allowed while the receipt is still in draft/waiting status.
 */
const updateReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { supplierName, reference, status } = req.body;

  const existing = await db.query('SELECT * FROM receipts WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Receipt not found');
  }
  const current = existing.rows[0];

  if (current.status === 'done' || current.status === 'canceled') {
    throw new ApiError(400, `Cannot update a receipt that is already ${current.status}`);
  }

  const allowedStatuses = ['draft', 'waiting', 'ready', 'canceled'];
  if (status && !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const result = await db.query(
    `UPDATE receipts SET supplier_name = $1, reference = $2, status = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [
      supplierName ?? current.supplier_name,
      reference ?? current.reference,
      status ?? current.status,
      id,
    ]
  );

  res.status(200).json({ success: true, message: 'Receipt updated successfully', data: result.rows[0] });
});

/**
 * DELETE /api/receipts/:id
 * Only allowed for receipts that have not yet been validated.
 */
const deleteReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query('SELECT status FROM receipts WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Receipt not found');
  }
  if (existing.rows[0].status === 'done') {
    throw new ApiError(400, 'Cannot delete a receipt that has already been completed');
  }

  await db.query('DELETE FROM receipts WHERE id = $1', [id]);

  res.status(200).json({ success: true, message: 'Receipt deleted successfully', data: {} });
});

/**
 * POST /api/receipts/:id/validate
 *
 * BEGIN
 *  -> verify receipt exists and is not already done/canceled
 *  -> for each item: increase stock, write ledger entry
 *  -> mark receipt as DONE
 * COMMIT (or ROLLBACK entirely on any failure)
 */
const validateReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const receiptResult = await client.query('SELECT * FROM receipts WHERE id = $1 FOR UPDATE', [
      id,
    ]);
    if (receiptResult.rows.length === 0) {
      throw new ApiError(404, 'Receipt not found');
    }
    const receipt = receiptResult.rows[0];

    if (receipt.status === 'done') {
      throw new ApiError(400, 'Receipt has already been validated');
    }
    if (receipt.status === 'canceled') {
      throw new ApiError(400, 'Cannot validate a canceled receipt');
    }

    const itemsResult = await client.query('SELECT * FROM receipt_items WHERE receipt_id = $1', [
      id,
    ]);
    if (itemsResult.rows.length === 0) {
      throw new ApiError(400, 'Receipt has no items to receive');
    }

    for (const item of itemsResult.rows) {
      const { previousStock, newStock } = await stockService.increaseStock(client, {
        productId: item.product_id,
        warehouseId: receipt.warehouse_id,
        locationId: receipt.location_id,
        quantity: Number(item.received_quantity),
      });

      await stockService.recordLedgerEntry(client, {
        productId: item.product_id,
        movementType: 'RECEIPT',
        quantity: Number(item.received_quantity),
        destinationWarehouseId: receipt.warehouse_id,
        destinationLocationId: receipt.location_id,
        referenceType: 'RECEIPT',
        referenceId: receipt.id,
        previousStock,
        newStock,
        userId: req.user.id,
      });
    }

    const updated = await client.query(
      `UPDATE receipts SET status = 'done', validated_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Receipt validated and stock updated successfully',
      data: updated.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  validateReceipt,
};
