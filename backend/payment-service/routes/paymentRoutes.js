const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payment routes
router.post('/payments/create-payment-intent', paymentController.createPaymentIntent);
router.post('/payments/confirm-payment', paymentController.confirmPayment);
router.get('/payments', paymentController.getPayments);
router.get('/payments/user/:userId', paymentController.getUserPayments);
router.get('/payments/:id', paymentController.getPaymentById);

module.exports = router; 