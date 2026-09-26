const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// Safe fallback to prevent undefined route crash
router.get('/', warehouseController.getWarehouses || warehouseController.getAllWarehouses || ((req, res) => res.json({ message: "Warehouses route" })));

module.exports = router;
