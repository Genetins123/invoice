const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth'); 

// All routes are protected and require a valid JWT token

// POST /api/products - Create Product (Owned by logged-in user)
router.post('/', protect, productController.createProduct);

// GET /api/products - Read ALL Products (Owned by logged-in user)
router.get('/', protect, productController.getProducts);

// GET /api/products/:id - Read ONE Product (Must be owned by logged-in user)
router.get('/:id', protect, productController.getProductById);

// PUT /api/products/:id - Update Product (Must be owned by logged-in user)
router.put('/:id', protect, productController.updateProduct); 

// DELETE /api/products/:id - Delete Product (Must be owned by logged-in user)
router.delete('/:id', protect, productController.deleteProduct);


module.exports = router;