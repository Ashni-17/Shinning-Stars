const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// Safe fallback for receipts
router.get('/', receiptController.getReceipts || receiptController.getAllReceipts || ((req, res) => res.json({ message: "Receipts route" })));

module.exports = router;
