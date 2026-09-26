const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryController');

router.get('/', c.getAllDeliveries);
router.get('/:id', c.getDeliveryById);
router.post('/', c.createDelivery);
router.put('/:id', c.updateDelivery);
router.delete('/:id', c.deleteDelivery);
router.post('/:id/validate', c.validateDelivery);

module.exports = router;
