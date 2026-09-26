const express = require('express');
const router = express.Router();

const {
getAllAdjustments,
getAdjustmentById,
createAdjustment,
validateAdjustment,
} = require('../controllers/adjustmentController');

router.get('/', getAllAdjustments);
router.get('/:id', getAdjustmentById);
router.post('/', createAdjustment);
router.post('/:id/validate', validateAdjustment);

module.exports = router;
