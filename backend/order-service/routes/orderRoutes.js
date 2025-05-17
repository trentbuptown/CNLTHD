const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/user/:userId', orderController.getUserOrders);
router.put('/orders/:id/pay', orderController.updateOrderToPaid);
router.put('/orders/:id/deliver', orderController.updateOrderToDelivered);
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Add root path to redirect to /orders endpoint
router.get('/', (req, res) => {
    // Just forward the request to the /orders endpoint
    orderController.getOrders(req, res);
});

module.exports = router; 