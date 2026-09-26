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

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.sku, p.unit_of_measure, p.category_id, c.name AS category_name,
         p.created_at, p.updated_at,
         COALESCE((SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id), 0) AS total_stock
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

/**
 * GET /api/products
 * Supports optional ?q= (name/SKU search) and ?category= (filter).
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }

  if (category) {
    params.push(category);
    conditions.push(`c.name = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `${PRODUCT_SELECT} ${whereClause} ORDER BY p.created_at DESC`,
    params
  );

  res.status(200).json({
    success: true,
    message: 'Products fetched successfully',
    data: result.rows,
  });
});

/**
 * GET /api/products/:id
 * Includes stock availability broken down by warehouse/location.
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const productResult = await db.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
  if (productResult.rows.length === 0) {
    throw new ApiError(404, 'Product not found');
  }

  const stockResult = await db.query(
    `SELECT s.warehouse_id, w.name AS warehouse_name, s.location_id, l.name AS location_name,
            s.quantity
     FROM stock s
     JOIN warehouses w ON w.id = s.warehouse_id
     LEFT JOIN locations l ON l.id = s.location_id
     WHERE s.product_id = $1
     ORDER BY w.name, l.name NULLS FIRST`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: 'Product fetched successfully',
    data: {
      ...productResult.rows[0],
      stockByLocation: stockResult.rows,
    },
  });
});

/**
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { name, sku, categoryId, unitOfMeasure, initialStock, warehouseId, locationId } =
    req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingSku = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      throw new ApiError(409, 'A product with this SKU already exists');
    }

    const productResult = await client.query(
      `INSERT INTO products (name, sku, category_id, unit_of_measure)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, sku, categoryId || null, unitOfMeasure]
    );
    const product = productResult.rows[0];

    if (initialStock && Number(initialStock) > 0) {
      const { newStock, previousStock } = await stockService.increaseStock(client, {
        productId: product.id,
        warehouseId,
        locationId: locationId || null,
        quantity: Number(initialStock),
      });

      await stockService.recordLedgerEntry(client, {
        productId: product.id,
        movementType: 'ADJUSTMENT',
        quantity: Number(initialStock),
        destinationWarehouseId: warehouseId,
        destinationLocationId: locationId || null,
        referenceType: 'PRODUCT_INITIAL_STOCK',
        referenceId: product.id,
        previousStock,
        newStock,
        userId: req.user.id,
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { id } = req.params;
  const { name, sku, categoryId, unitOfMeasure } = req.body;

  const existing = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Product not found');
  }
  const current = existing.rows[0];

  const result = await db.query(
    `UPDATE products
     SET name = $1, sku = $2, category_id = $3, unit_of_measure = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      name ?? current.name,
      sku ?? current.sku,
      categoryId !== undefined ? categoryId : current.category_id,
      unitOfMeasure ?? current.unit_of_measure,
      id,
    ]
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: result.rows[0],
  });
});

/**
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: {},
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
