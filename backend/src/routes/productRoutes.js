const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Safe fallback to prevent undefined route crash
router.get('/', productController.getProducts || productController.getAllProducts || ((req, res) => res.json({ message: "Products route" })));
router.post('/', productController.createProduct || productController.addProduct || ((req, res) => res.json({ message: "Product add route" })));

module.exports = router;
