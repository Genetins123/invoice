const express = require('express');
const router = express.Router();
// Path relative to the routes file
const productController = require('../controllers/productController'); 

// --- Product CRUD Routes ---

// GET /api/products - Read All Products
router.get('/', productController.getProducts);

// POST /api/products - Create New Product
router.post('/', productController.createProduct);

// GET /api/products/:id - Read Single Product
router.get('/:id', productController.getProductById);

// PUT /api/products/:id - Update Existing Product
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Delete Product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
