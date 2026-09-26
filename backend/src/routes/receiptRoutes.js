const express = require('express');
const router = express.Router();
const c = require('../controllers/receiptController');

router.get('/', c.getAllReceipts);
router.get('/:id', c.getReceiptById);
router.post('/', c.createReceipt);
router.put('/:id', c.updateReceipt);
router.delete('/:id', c.deleteReceipt);
router.post('/:id/validate', c.validateReceipt);

module.exports = router;
