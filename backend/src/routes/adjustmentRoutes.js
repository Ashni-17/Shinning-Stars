const express = require('express');
const router = express.Router();
const c = require('../controllers/adjustmentController');

router.get('/', c.getAllAdjustments);
router.get('/:id', c.getAdjustmentById);
router.post('/', c.createAdjustment);
router.post('/:id/validate', c.validateAdjustment);

module.exports = router;
