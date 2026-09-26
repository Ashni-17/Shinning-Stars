const express = require('express');
const router = express.Router();
const c = require('../controllers/transferController');

router.get('/', c.getAllTransfers);
router.get('/:id', c.getTransferById);
router.post('/', c.createTransfer);
router.put('/:id', c.updateTransfer);
router.delete('/:id', c.deleteTransfer);
router.post('/:id/validate', c.validateTransfer);

module.exports = router;
