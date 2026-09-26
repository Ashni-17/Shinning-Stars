const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Safe fallback for deliveries
router.get('/', deliveryController.getDeliveries || deliveryController.getAllDeliveries || ((req, res) => res.json({ message: "Deliveries route" })));

module.exports = router;

