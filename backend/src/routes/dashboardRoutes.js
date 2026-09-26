const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      pendingReceipts: 0,
      pendingDeliveries: 0
    }
  });
});

module.exports = router;
