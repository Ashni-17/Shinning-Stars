const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await db.query(`
      SELECT
        COUNT(*)::int AS total_products,
        COUNT(*) FILTER (
          WHERE COALESCE(stock.total_stock, 0) > 0
            AND COALESCE(stock.total_stock, 0) <= p.reorder_level
        )::int AS low_stock,
        COUNT(*) FILTER (
          WHERE COALESCE(stock.total_stock, 0) = 0
        )::int AS out_of_stock
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS total_stock
        FROM stock
        GROUP BY product_id
      ) stock ON stock.product_id = p.id
    `);

    const receipts = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM receipts
      WHERE status NOT IN ('Done', 'Canceled')
    `);

    const deliveries = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM deliveries
      WHERE status NOT IN ('Done', 'Canceled')
    `);

    const transfers = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM transfers
      WHERE status NOT IN ('Done', 'Canceled')
    `);

    res.json({
      success: true,
      data: {
        totalProducts: products.rows[0].total_products,
        lowStock: products.rows[0].low_stock,
        outOfStock: products.rows[0].out_of_stock,
        pendingReceipts: receipts.rows[0].count,
        pendingDeliveries: deliveries.rows[0].count,
        scheduledTransfers: transfers.rows[0].count
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
