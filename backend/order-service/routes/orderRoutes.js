const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/user/:userId', orderController.getUserOrders);
router.get('/orders/stats', orderController.getOrderStats);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/pay', orderController.updateOrderToPaid);
router.put('/orders/:id/deliver', orderController.updateOrderToDelivered);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/cancel', orderController.cancelOrder);
router.delete('/orders/:id', orderController.deleteOrder);

// Add checkout endpoint
router.post('/orders/checkout', orderController.createCheckoutSession);

// Add root-level checkout endpoint to match the gateway's routing
router.post('/checkout', orderController.createCheckoutSession);

// Add root-level order creation endpoint to match the gateway's routing
router.post('/', orderController.createOrder);

// Add root path to redirect to /orders endpoint
router.get('/', (req, res) => {
    // Just forward the request to the /orders endpoint
    orderController.getOrders(req, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'order-service' });
});

// Add root-level user orders route
router.get('/user/:userId', orderController.getUserOrders);

// Add stats endpoint at root level - must be before the /:id route to prevent mismatching
router.get('/stats', orderController.getOrderStats);

// Add root-level individual order route
router.get('/:id', orderController.getOrderById);

// Add root-level order status update route to match the gateway's routing
router.put('/:id/status', orderController.updateOrderStatus);

// Add root-level order cancel route
router.put('/:id/cancel', orderController.cancelOrder);

// Add root-level delete order route
router.delete('/:id', orderController.deleteOrder);

module.exports = router; 