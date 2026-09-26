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

const getDeliveryWithItems = async (client, deliveryId) => {
  const deliveryResult = await client.query('SELECT * FROM deliveries WHERE id = $1', [
    deliveryId,
  ]);
  if (deliveryResult.rows.length === 0) {
    throw new ApiError(404, 'Delivery not found');
  }

  const itemsResult = await client.query(
    `SELECT di.*, p.name AS product_name, p.sku
     FROM delivery_items di
     JOIN products p ON p.id = di.product_id
     WHERE di.delivery_id = $1`,
    [deliveryId]
  );

  return { ...deliveryResult.rows[0], items: itemsResult.rows };
};

/**
 * GET /api/deliveries
 */
const getAllDeliveries = asyncHandler(async (req, res) => {
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
    `SELECT * FROM deliveries ${whereClause} ORDER BY created_at DESC`,
    params
  );

  res.status(200).json({ success: true, message: 'Deliveries fetched successfully', data: result.rows });
});

/**
 * GET /api/deliveries/:id
 */
const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await getDeliveryWithItems(db, req.params.id);
  res.status(200).json({ success: true, message: 'Delivery fetched successfully', data: delivery });
});

/**
 * POST /api/deliveries
 * Creates a delivery order in DRAFT status. Stock is NOT changed yet.
 */
const createDelivery = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { customerName, warehouseId, locationId, reference, items } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const deliveryResult = await client.query(
      `INSERT INTO deliveries (customer_name, warehouse_id, location_id, reference, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING *`,
      [customerName, warehouseId, locationId || null, reference || null, req.user.id]
    );
    const delivery = deliveryResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO delivery_items (delivery_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [delivery.id, item.productId, item.quantity]
      );
    }

    await client.query('COMMIT');

    const full = await getDeliveryWithItems(db, delivery.id);
    res.status(201).json({ success: true, message: 'Delivery created successfully', data: full });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/deliveries/:id
 */
const updateDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customerName, reference, status } = req.body;

  const existing = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Delivery not found');
  }
  const current = existing.rows[0];

  if (current.status === 'done' || current.status === 'canceled') {
    throw new ApiError(400, `Cannot update a delivery that is already ${current.status}`);
  }

  const allowedStatuses = ['draft', 'waiting', 'ready', 'canceled'];
  if (status && !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const result = await db.query(
    `UPDATE deliveries SET customer_name = $1, reference = $2, status = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [
      customerName ?? current.customer_name,
      reference ?? current.reference,
      status ?? current.status,
      id,
    ]
  );

  res.status(200).json({ success: true, message: 'Delivery updated successfully', data: result.rows[0] });
});

/**
 * DELETE /api/deliveries/:id
 */
const deleteDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query('SELECT status FROM deliveries WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Delivery not found');
  }
  if (existing.rows[0].status === 'done') {
    throw new ApiError(400, 'Cannot delete a delivery that has already been completed');
  }

  await db.query('DELETE FROM deliveries WHERE id = $1', [id]);

  res.status(200).json({ success: true, message: 'Delivery deleted successfully', data: {} });
});

/**
 * POST /api/deliveries/:id/validate
 *
 * BEGIN
 *  -> verify delivery exists and is not already done/canceled
 *  -> for each item: decrease stock (never below 0), write ledger entry
 *  -> mark delivery as DONE
 * COMMIT (or ROLLBACK entirely on any failure, e.g. insufficient stock)
 */
const validateDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const deliveryResult = await client.query(
      'SELECT * FROM deliveries WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (deliveryResult.rows.length === 0) {
      throw new ApiError(404, 'Delivery not found');
    }
    const delivery = deliveryResult.rows[0];

    if (delivery.status === 'done') {
      throw new ApiError(400, 'Delivery has already been validated');
    }
    if (delivery.status === 'canceled') {
      throw new ApiError(400, 'Cannot validate a canceled delivery');
    }

    const itemsResult = await client.query('SELECT * FROM delivery_items WHERE delivery_id = $1', [
      id,
    ]);
    if (itemsResult.rows.length === 0) {
      throw new ApiError(400, 'Delivery has no items to ship');
    }

    for (const item of itemsResult.rows) {
      // decreaseStock throws (and the whole transaction rolls back) if
      // this would take stock negative.
      const { previousStock, newStock } = await stockService.decreaseStock(client, {
        productId: item.product_id,
        warehouseId: delivery.warehouse_id,
        locationId: delivery.location_id,
        quantity: Number(item.quantity),
      });

      await stockService.recordLedgerEntry(client, {
        productId: item.product_id,
        movementType: 'DELIVERY',
        quantity: Number(item.quantity),
        sourceWarehouseId: delivery.warehouse_id,
        sourceLocationId: delivery.location_id,
        referenceType: 'DELIVERY',
        referenceId: delivery.id,
        previousStock,
        newStock,
        userId: req.user.id,
      });
    }

    const updated = await client.query(
      `UPDATE deliveries SET status = 'done', validated_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Delivery validated and stock updated successfully',
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
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  validateDelivery,
};
