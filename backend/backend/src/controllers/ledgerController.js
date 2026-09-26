const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');

const LEDGER_SELECT = `
  SELECT sl.*, p.name AS product_name, p.sku,
         sw.name AS source_warehouse_name, sl_loc.name AS source_location_name,
         dw.name AS destination_warehouse_name, dl_loc.name AS destination_location_name,
         u.name AS created_by_name
  FROM stock_ledger sl
  JOIN products p ON p.id = sl.product_id
  LEFT JOIN warehouses sw ON sw.id = sl.source_warehouse_id
  LEFT JOIN locations sl_loc ON sl_loc.id = sl.source_location_id
  LEFT JOIN warehouses dw ON dw.id = sl.destination_warehouse_id
  LEFT JOIN locations dl_loc ON dl_loc.id = sl.destination_location_id
  LEFT JOIN users u ON u.id = sl.created_by
`;

/**
 * GET /api/ledger
 * Supports optional filters: ?movementType=, ?warehouseId=, ?from=, ?to=
 */
const getLedger = asyncHandler(async (req, res) => {
  const { movementType, warehouseId, from, to } = req.query;
  const conditions = [];
  const params = [];

  if (movementType) {
    params.push(movementType);
    conditions.push(`sl.movement_type = $${params.length}`);
  }
  if (warehouseId) {
    params.push(warehouseId);
    conditions.push(
      `(sl.source_warehouse_id = $${params.length} OR sl.destination_warehouse_id = $${params.length})`
    );
  }
  if (from) {
    params.push(from);
    conditions.push(`sl.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`sl.created_at <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `${LEDGER_SELECT} ${whereClause} ORDER BY sl.created_at DESC LIMIT 500`,
    params
  );

  res.status(200).json({
    success: true,
    message: 'Stock ledger fetched successfully',
    data: result.rows,
  });
});

/**
 * GET /api/ledger/:productId
 */
const getLedgerByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const result = await db.query(
    `${LEDGER_SELECT} WHERE sl.product_id = $1 ORDER BY sl.created_at DESC`,
    [productId]
  );

  res.status(200).json({
    success: true,
    message: 'Product ledger fetched successfully',
    data: result.rows,
  });
});

module.exports = { getLedger, getLedgerByProduct };
