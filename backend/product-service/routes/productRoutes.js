const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');

// Root route - important for gateway integration
router.get('/', productController.getProducts);

// Public routes
router.get('/products', productController.getProducts);
router.get('/products/category/:category', productController.getProductsByCategory);

// Health check endpoint - placed before ID routes to avoid conflict
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'product-service' });
});

// Statistics endpoints
router.get('/count', productController.getProductCount);
router.get('/products/count', productController.getProductCount);

// Product by ID routes - must come after specific routes
router.get('/products/:id', productController.getProductById);
// Add a root route to get product by ID - critical for API gateway forwarding
router.get('/:id', productController.getProductById);

// Review routes
router.post('/products/:id/reviews', reviewController.addReview);
router.get('/products/:id/reviews', reviewController.getProductReviews);
router.get('/products/:productId/reviews/:id', reviewController.getReviewById);
router.put('/products/:productId/reviews/:id', reviewController.updateReview);
router.delete('/products/:productId/reviews/:id', reviewController.deleteReview);

// Root level review routes for API gateway
router.post('/:id/reviews', reviewController.addReview);
router.get('/:id/reviews', reviewController.getProductReviews);
router.get('/:productId/reviews/:id', reviewController.getReviewById);
router.put('/:productId/reviews/:id', reviewController.updateReview);
router.delete('/:productId/reviews/:id', reviewController.deleteReview);

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

// Stock update routes
router.put('/products/:id/stock', productController.updateProductStock);
router.put('/:id/stock', productController.updateProductStock);

module.exports = router;