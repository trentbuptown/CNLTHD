const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const vnpayController = require('../controllers/vnpayController');

// Payment routes
router.post('/payments/create-payment-intent', paymentController.createPaymentIntent);
router.post('/payments/confirm-payment', paymentController.confirmPayment);
router.get('/payments', paymentController.getPayments);
router.get('/payments/user/:userId', paymentController.getUserPayments);
router.get('/payments/:id', paymentController.getPaymentById);
router.post('/payments/sync', paymentController.syncPayment);
router.delete('/payments/order/:orderId', paymentController.deletePaymentsByOrderId);
router.post('/payments/link', paymentController.linkPaymentToOrder);

// VNPAY payment routes
router.post('/payments/vnpay/create', vnpayController.createPaymentUrl);
router.get('/payments/vnpay/return', vnpayController.vnpayReturn);
router.post('/payments/vnpay/direct', vnpayController.processDirectPayment);

// Cash on Delivery routes
router.post('/payments/cod/create', vnpayController.createCodPayment);

// Add direct routes for API gateway compatibility
router.post('/vnpay/create', vnpayController.createPaymentUrl);
router.get('/vnpay/return', vnpayController.vnpayReturn);
router.post('/vnpay/direct', vnpayController.processDirectPayment);
router.post('/cod/create', vnpayController.createCodPayment);
router.post('/payments/link', paymentController.linkPaymentToOrder);

module.exports = router; 