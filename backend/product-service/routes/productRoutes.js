const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Root route - important for gateway integration
router.get('/', productController.getProducts);

// Public routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/category/:category', productController.getProductsByCategory);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'product-service' });
});

// Admin routes (these would typically be protected)
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Also add a root post handler for product creation
router.post('/', productController.createProduct);
// Add a root put handler for product updates
router.put('/:id', productController.updateProduct);
// Add a root delete handler for product deletion
router.delete('/:id', productController.deleteProduct);

module.exports = router;