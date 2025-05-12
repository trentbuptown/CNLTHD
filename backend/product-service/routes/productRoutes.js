const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/category/:category', productController.getProductsByCategory);

// Admin routes (these would typically be protected)
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;