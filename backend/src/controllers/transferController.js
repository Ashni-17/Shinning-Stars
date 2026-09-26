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

const getTransferWithItems = async (client, transferId) => {
  const transferResult = await client.query('SELECT * FROM transfers WHERE id = $1', [
    transferId,
  ]);
  if (transferResult.rows.length === 0) {
    throw new ApiError(404, 'Transfer not found');
  }

  const itemsResult = await client.query(
    `SELECT ti.*, p.name AS product_name, p.sku
     FROM transfer_items ti
     JOIN products p ON p.id = ti.product_id
     WHERE ti.transfer_id = $1`,
    [transferId]
  );

  return { ...transferResult.rows[0], items: itemsResult.rows };
};

/**
 * GET /api/transfers
 */
const getAllTransfers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM transfers ${whereClause} ORDER BY created_at DESC`,
    params
  );

  res.status(200).json({ success: true, message: 'Transfers fetched successfully', data: result.rows });
});

/**
 * GET /api/transfers/:id
 */
const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await getTransferWithItems(db, req.params.id);
  res.status(200).json({ success: true, message: 'Transfer fetched successfully', data: transfer });
});

/**
 * POST /api/transfers
 * Creates a transfer in DRAFT status. Stock only moves on validation.
 */
const createTransfer = asyncHandler(async (req, res) => {
  checkValidation(req);
  const {
    sourceWarehouseId,
    sourceLocationId,
    destinationWarehouseId,
    destinationLocationId,
    reference,
    items,
  } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const transferResult = await client.query(
      `INSERT INTO transfers
        (source_warehouse_id, source_location_id, destination_warehouse_id, destination_location_id,
         reference, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)
       RETURNING *`,
      [
        sourceWarehouseId,
        sourceLocationId || null,
        destinationWarehouseId,
        destinationLocationId || null,
        reference || null,
        req.user.id,
      ]
    );
    const transfer = transferResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [transfer.id, item.productId, item.quantity]
      );
    }

    await client.query('COMMIT');

    const full = await getTransferWithItems(db, transfer.id);
    res.status(201).json({ success: true, message: 'Transfer created successfully', data: full });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/transfers/:id
 */
const updateTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reference, status } = req.body;

  const existing = await db.query('SELECT * FROM transfers WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Transfer not found');
  }
  const current = existing.rows[0];

  if (current.status === 'done' || current.status === 'canceled') {
    throw new ApiError(400, `Cannot update a transfer that is already ${current.status}`);
  }

  const allowedStatuses = ['draft', 'waiting', 'ready', 'canceled'];
  if (status && !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const result = await db.query(
    `UPDATE transfers SET reference = $1, status = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [reference ?? current.reference, status ?? current.status, id]
  );

  res.status(200).json({ success: true, message: 'Transfer updated successfully', data: result.rows[0] });
});

/**
 * DELETE /api/transfers/:id
 */
const deleteTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query('SELECT status FROM transfers WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Transfer not found');
  }
  if (existing.rows[0].status === 'done') {
    throw new ApiError(400, 'Cannot delete a transfer that has already been completed');
  }

  await db.query('DELETE FROM transfers WHERE id = $1', [id]);

  res.status(200).json({ success: true, message: 'Transfer deleted successfully', data: {} });
});

/**
 * POST /api/transfers/:id/validate
 *
 * BEGIN
 *  -> verify transfer exists and is not already done/canceled
 *  -> for each item: decrease stock at source (never below 0),
 *     increase stock at destination, write ONE ledger entry per item
 *     capturing both source and destination
 *  -> mark transfer as DONE
 * COMMIT (or ROLLBACK entirely on any failure)
 *
 * Total company-wide stock for each product is unchanged by a transfer;
 * only its location changes.
 */
const validateTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const transferResult = await client.query('SELECT * FROM transfers WHERE id = $1 FOR UPDATE', [
      id,
    ]);
    if (transferResult.rows.length === 0) {
      throw new ApiError(404, 'Transfer not found');
    }
    const transfer = transferResult.rows[0];

    if (transfer.status === 'done') {
      throw new ApiError(400, 'Transfer has already been validated');
    }
    if (transfer.status === 'canceled') {
      throw new ApiError(400, 'Cannot validate a canceled transfer');
    }

    const itemsResult = await client.query('SELECT * FROM transfer_items WHERE transfer_id = $1', [
      id,
    ]);
    if (itemsResult.rows.length === 0) {
      throw new ApiError(400, 'Transfer has no items to move');
    }

    for (const item of itemsResult.rows) {
      const quantity = Number(item.quantity);

      const { previousStock: sourcePrevious, newStock: sourceNew } =
        await stockService.decreaseStock(client, {
          productId: item.product_id,
          warehouseId: transfer.source_warehouse_id,
          locationId: transfer.source_location_id,
          quantity,
        });

      await stockService.increaseStock(client, {
        productId: item.product_id,
        warehouseId: transfer.destination_warehouse_id,
        locationId: transfer.destination_location_id,
        quantity,
      });

      // One ledger row per item captures both sides of the move (source
      // and destination warehouse/location); previous/new stock refer to
      // the source location, since that is the leg that could fail
      // (insufficient stock) and therefore anchors the transaction.
      await stockService.recordLedgerEntry(client, {
        productId: item.product_id,
        movementType: 'TRANSFER',
        quantity,
        sourceWarehouseId: transfer.source_warehouse_id,
        sourceLocationId: transfer.source_location_id,
        destinationWarehouseId: transfer.destination_warehouse_id,
        destinationLocationId: transfer.destination_location_id,
        referenceType: 'TRANSFER',
        referenceId: transfer.id,
        previousStock: sourcePrevious,
        newStock: sourceNew,
        userId: req.user.id,
      });
    }

    const updated = await client.query(
      `UPDATE transfers SET status = 'done', validated_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Transfer validated and stock updated successfully',
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
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  validateTransfer,
};
