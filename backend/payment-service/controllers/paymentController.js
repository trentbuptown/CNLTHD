const Payment = require('../models/Payment');
const axios = require('axios');

// Simulated stripe configuration
// In production, use process.env.STRIPE_SECRET_KEY
const stripe = {
    paymentIntents: {
        create: async (options) => {
            // Simulate payment intent creation
            return {
                id: `pi_${Date.now()}`,
                client_secret: `sk_test_${Date.now()}`,
                status: 'requires_payment_method',
                amount: options.amount
            };
        },
        confirm: async (paymentIntentId, options) => {
            // Simulate payment confirmation
            return {
                id: paymentIntentId,
                status: 'succeeded',
                amount: options.amount
            };
        }
    }
};

// @desc    Create payment intent
// @route   POST /payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, orderId, userId, currency = 'usd' } = req.body;

        if (!amount || !orderId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide amount, orderId, and userId'
            });
        }

        // Create a payment intent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency
        });

        // Create a new payment record
        const payment = await Payment.create({
            orderId,
            userId,
            amount,
            currency,
            method: 'credit_card',
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            paymentDetails: paymentIntent
        });

        res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Confirm payment
// @route   POST /payments/confirm-payment
// @access  Private
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide paymentIntentId'
            });
        }

        // Find the payment by paymentIntentId
        const payment = await Payment.findOne({ paymentIntentId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Confirm payment with Stripe
        const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
            amount: payment.amount
        });

        // Update payment status
        payment.status = confirmedIntent.status === 'succeeded' ? 'completed' : 'failed';
        payment.transactionId = `tx_${Date.now()}`;
        payment.paymentDetails = {
            ...payment.paymentDetails,
            ...confirmedIntent
        };

        await payment.save();

        // If payment is successful, update the order status
        if (payment.status === 'completed') {
            try {
                // Send request to order service to update order payment status
                await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/orders/${payment.orderId}/pay`, {
                    id: payment.transactionId,
                    status: payment.status,
                    updateTime: new Date().toISOString(),
                    emailAddress: 'customer@example.com' // In real app, get from user profile
                });
            } catch (error) {
                console.error('Error updating order payment status:', error.message);
                // Continue anyway, as payment was successful
            }
        }

        res.status(200).json({
            success: true,
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all payments
// @route   GET /payments
// @access  Private/Admin
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get payments by user
// @route   GET /payments/user/:userId
// @access  Private
exports.getUserPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId });

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get payment by ID
// @route   GET /payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 