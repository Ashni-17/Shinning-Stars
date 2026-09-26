const { validationResult } = require('express-validator');
const db = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');

const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

/**
 * GET /api/warehouses
 * Returns each warehouse together with its locations (racks, floors, etc.)
 */
const getAllWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await db.query('SELECT * FROM warehouses ORDER BY name');
  const locations = await db.query('SELECT * FROM locations ORDER BY name');

  const data = warehouses.rows.map((wh) => ({
    ...wh,
    locations: locations.rows.filter((loc) => loc.warehouse_id === wh.id),
  }));

  res.status(200).json({
    success: true,
    message: 'Warehouses fetched successfully',
    data,
  });
});

/**
 * GET /api/warehouses/:id
 */
const getWarehouseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const warehouseResult = await db.query('SELECT * FROM warehouses WHERE id = $1', [id]);
  if (warehouseResult.rows.length === 0) {
    throw new ApiError(404, 'Warehouse not found');
  }

  const locationsResult = await db.query(
    'SELECT * FROM locations WHERE warehouse_id = $1 ORDER BY name',
    [id]
  );

  res.status(200).json({
    success: true,
    message: 'Warehouse fetched successfully',
    data: { ...warehouseResult.rows[0], locations: locationsResult.rows },
  });
});

/**
 * POST /api/warehouses
 * Body may optionally include `locations: [{ name }, ...]` to create
 * racks/floors for the warehouse in the same call.
 */
const createWarehouse = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { name, address, locations } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const warehouseResult = await client.query(
      'INSERT INTO warehouses (name, address) VALUES ($1, $2) RETURNING *',
      [name, address || null]
    );
    const warehouse = warehouseResult.rows[0];

    const createdLocations = [];
    if (Array.isArray(locations) && locations.length > 0) {
      for (const loc of locations) {
        const locResult = await client.query(
          'INSERT INTO locations (warehouse_id, name) VALUES ($1, $2) RETURNING *',
          [warehouse.id, loc.name]
        );
        createdLocations.push(locResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { ...warehouse, locations: createdLocations },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/warehouses/:id
 */
const updateWarehouse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  const existing = await db.query('SELECT * FROM warehouses WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Warehouse not found');
  }
  const current = existing.rows[0];

  const result = await db.query(
    `UPDATE warehouses SET name = $1, address = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [name ?? current.name, address ?? current.address, id]
  );

  res.status(200).json({
    success: true,
    message: 'Warehouse updated successfully',
    data: result.rows[0],
  });
});

/**
 * DELETE /api/warehouses/:id
 */
const deleteWarehouse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stockCheck = await db.query(
    'SELECT id FROM stock WHERE warehouse_id = $1 AND quantity > 0 LIMIT 1',
    [id]
  );
  if (stockCheck.rows.length > 0) {
    throw new ApiError(400, 'Cannot delete a warehouse that still holds stock');
  }

  const result = await db.query('DELETE FROM warehouses WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Warehouse not found');
  }

  res.status(200).json({
    success: true,
    message: 'Warehouse deleted successfully',
    data: {},
  });
});

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
