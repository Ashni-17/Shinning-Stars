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

const getAdjustmentWithItems = async (client, adjustmentId) => {
  const adjustmentResult = await client.query('SELECT * FROM adjustments WHERE id = $1', [
    adjustmentId,
  ]);
  if (adjustmentResult.rows.length === 0) {
    throw new ApiError(404, 'Adjustment not found');
  }

  const itemsResult = await client.query(
    `SELECT ai.*, p.name AS product_name, p.sku
     FROM adjustment_items ai
     JOIN products p ON p.id = ai.product_id
     WHERE ai.adjustment_id = $1`,
    [adjustmentId]
  );

  return { ...adjustmentResult.rows[0], items: itemsResult.rows };
};

/**
 * GET /api/adjustments
 */
const getAllAdjustments = asyncHandler(async (req, res) => {
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
    `SELECT * FROM adjustments ${whereClause} ORDER BY created_at DESC`,
    params
  );

  res.status(200).json({ success: true, message: 'Adjustments fetched successfully', data: result.rows });
});

/**
 * GET /api/adjustments/:id
 */
const getAdjustmentById = asyncHandler(async (req, res) => {
  const adjustment = await getAdjustmentWithItems(db, req.params.id);
  res.status(200).json({ success: true, message: 'Adjustment fetched successfully', data: adjustment });
});

/**
 * POST /api/adjustments
 * Records the physical count for each product. Stock is not changed
 * until the adjustment is validated.
 */
const createAdjustment = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { warehouseId, locationId, reason, items } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const adjustmentResult = await client.query(
      `INSERT INTO adjustments (warehouse_id, location_id, reason, status, created_by)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING *`,
      [warehouseId, locationId || null, reason, req.user.id]
    );
    const adjustment = adjustmentResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO adjustment_items (adjustment_id, product_id, counted_quantity)
         VALUES ($1, $2, $3)`,
        [adjustment.id, item.productId, item.countedQuantity]
      );
    }

    await client.query('COMMIT');

    const full = await getAdjustmentWithItems(db, adjustment.id);
    res.status(201).json({ success: true, message: 'Adjustment created successfully', data: full });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * POST /api/adjustments/:id/validate
 *
 * BEGIN
 *  -> verify adjustment exists and is not already done/canceled
 *  -> for each item: set stock to the counted quantity, write ledger
 *     entry with the signed delta (system stock - physical count)
 *  -> mark adjustment as DONE
 * COMMIT (or ROLLBACK entirely on any failure)
 */
const validateAdjustment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const adjustmentResult = await client.query(
      'SELECT * FROM adjustments WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (adjustmentResult.rows.length === 0) {
      throw new ApiError(404, 'Adjustment not found');
    }
    const adjustment = adjustmentResult.rows[0];

    if (adjustment.status === 'done') {
      throw new ApiError(400, 'Adjustment has already been validated');
    }
    if (adjustment.status === 'canceled') {
      throw new ApiError(400, 'Cannot validate a canceled adjustment');
    }

    const itemsResult = await client.query(
      'SELECT * FROM adjustment_items WHERE adjustment_id = $1',
      [id]
    );
    if (itemsResult.rows.length === 0) {
      throw new ApiError(400, 'Adjustment has no items to reconcile');
    }

    for (const item of itemsResult.rows) {
      const { previousStock, newStock, delta } = await stockService.setStock(client, {
        productId: item.product_id,
        warehouseId: adjustment.warehouse_id,
        locationId: adjustment.location_id,
        countedQuantity: Number(item.counted_quantity),
      });

      if (delta !== 0) {
        await stockService.recordLedgerEntry(client, {
          productId: item.product_id,
          movementType: 'ADJUSTMENT',
          quantity: delta,
          sourceWarehouseId: delta < 0 ? adjustment.warehouse_id : null,
          sourceLocationId: delta < 0 ? adjustment.location_id : null,
          destinationWarehouseId: delta > 0 ? adjustment.warehouse_id : null,
          destinationLocationId: delta > 0 ? adjustment.location_id : null,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustment.id,
          previousStock,
          newStock,
          userId: req.user.id,
        });
      }
    }

    const updated = await client.query(
      `UPDATE adjustments SET status = 'done', validated_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Adjustment validated and stock updated successfully',
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
  getAllAdjustments,
  getAdjustmentById,
  createAdjustment,
  validateAdjustment,
};
