const express = require('express');
const router = express.Router();
const c = require('../controllers/warehouseController');

router.get('/', c.getAllWarehouses);
router.get('/:id', c.getWarehouseById);
router.post('/', c.createWarehouse);
router.put('/:id', c.updateWarehouse);
router.delete('/:id', c.deleteWarehouse);

module.exports = router;
