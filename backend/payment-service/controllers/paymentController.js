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
        const {
            amount,
            orderId,
            userId,
            currency = 'usd',
            customerInfo = {},
            paymentMethod = 'credit_card'
        } = req.body;

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

        // Create a new payment record with expanded information
        const payment = await Payment.create({
            orderId,
            userId,
            amount,
            currency,
            method: paymentMethod,
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            customerInfo: {
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: {
                    street: customerInfo.address,
                    city: customerInfo.city,
                    state: customerInfo.state || '',
                    postalCode: customerInfo.postalCode,
                    country: customerInfo.country
                }
            },
            paymentDetails: paymentIntent
        });

        res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            payment
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
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
        const {
            paymentIntentId,
            paymentMethodId,
            cardDetails = {},
            additionalInfo = {}
        } = req.body;

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

        // Update payment status and additional information
        payment.status = confirmedIntent.status === 'succeeded' ? 'completed' : 'failed';
        payment.transactionId = `tx_${Date.now()}`;
        payment.gatewayReference = confirmedIntent.id;
        payment.paymentResponseCode = confirmedIntent.status;
        payment.paymentResponseMessage = confirmedIntent.status === 'succeeded' ? 'Payment succeeded' : 'Payment failed';

        // Save card details if provided (masked for security)
        if (cardDetails.number) {
            payment.cardDetails = {
                last4: cardDetails.number.slice(-4),
                brand: cardDetails.brand || 'Unknown',
                expiryMonth: cardDetails.expiryMonth || 0,
                expiryYear: cardDetails.expiryYear || 0
            };
        }

        // Store the full response in paymentDetails
        payment.paymentDetails = {
            ...payment.paymentDetails,
            ...confirmedIntent,
            ...additionalInfo
        };

        await payment.save();

        // If payment is successful, update the order status
        if (payment.status === 'completed') {
            try {
                // Send request to order service to update order payment status
                // Include more comprehensive payment details
                await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/orders/${payment.orderId}/pay`, {
                    id: payment.transactionId,
                    status: payment.status,
                    updateTime: new Date().toISOString(),
                    emailAddress: payment.customerInfo?.email || additionalInfo.email || 'customer@example.com',
                    paymentMethod: payment.method,
                    gatewayReference: payment.gatewayReference,
                    last4: payment.cardDetails?.last4,
                    cardBrand: payment.cardDetails?.brand
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
        console.error('Error confirming payment:', error);
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

// @desc    Sync payment information from order service
// @route   POST /payments/sync
// @access  Private
exports.syncPayment = async (req, res) => {
    try {
        const { orderId, status, paymentDetails } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: 'orderId and status are required'
            });
        }

        // Find existing payment by orderId
        let payment = await Payment.findOne({ orderId });

        if (payment) {
            // Update existing payment
            payment.status = status;
            if (paymentDetails) {
                if (paymentDetails.id) payment.transactionId = paymentDetails.id;
                if (paymentDetails.gatewayReference) payment.gatewayReference = paymentDetails.gatewayReference;
                if (paymentDetails.paymentMethod) payment.method = paymentDetails.paymentMethod;

                // Card details
                if (paymentDetails.last4 || paymentDetails.cardBrand) {
                    payment.cardDetails = {
                        ...payment.cardDetails || {},
                        last4: paymentDetails.last4,
                        brand: paymentDetails.cardBrand
                    };
                }

                // Store full payment details
                payment.paymentDetails = {
                    ...(payment.paymentDetails || {}),
                    ...paymentDetails,
                    syncedAt: new Date().toISOString()
                };
            }

            await payment.save();

            return res.status(200).json({
                success: true,
                message: 'Payment updated successfully',
                payment
            });
        } else {
            // Try to get order information to create a new payment
            try {
                const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
                const orderResponse = await axios.get(`${orderServiceUrl}/orders/${orderId}`);

                if (orderResponse.data && orderResponse.data.success && orderResponse.data.order) {
                    const orderData = orderResponse.data.order;

                    // Create new payment with available information
                    payment = new Payment({
                        orderId,
                        userId: orderData.userId,
                        amount: orderData.totalPrice,
                        currency: 'USD', // Default, can be overridden by paymentDetails
                        method: paymentDetails?.paymentMethod || orderData.paymentMethod || 'unknown',
                        status,
                        transactionId: paymentDetails?.id || `sync_${Date.now()}`,
                        gatewayReference: paymentDetails?.gatewayReference,
                        paymentResponseCode: paymentDetails?.responseCode || '00',
                        paymentResponseMessage: paymentDetails?.responseMessage || 'Payment synced',
                        paymentDetails: {
                            ...paymentDetails,
                            syncedAt: new Date().toISOString()
                        }
                    });

                    await payment.save();

                    return res.status(201).json({
                        success: true,
                        message: 'Payment created successfully',
                        payment
                    });
                } else {
                    throw new Error('Could not get order information');
                }
            } catch (orderError) {
                console.error('Error getting order info for payment sync:', orderError);

                // Create a minimal payment record since we couldn't get order details
                payment = new Payment({
                    orderId,
                    amount: paymentDetails?.amount || 0,
                    currency: paymentDetails?.currency || 'USD',
                    method: paymentDetails?.paymentMethod || 'unknown',
                    status,
                    transactionId: paymentDetails?.id || `sync_${Date.now()}`,
                    gatewayReference: paymentDetails?.gatewayReference,
                    paymentDetails: {
                        ...paymentDetails,
                        syncedAt: new Date().toISOString(),
                        syncError: 'Could not get full order information'
                    }
                });

                await payment.save();

                return res.status(201).json({
                    success: true,
                    message: 'Minimal payment record created',
                    payment
                });
            }
        }
    } catch (error) {
        console.error('Error syncing payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete payments by order ID
// @route   DELETE /payments/order/:orderId
// @access  Private/Admin
exports.deletePaymentsByOrderId = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Find and delete all payments associated with this order
        const result = await Payment.deleteMany({ orderId });

        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} payment records for order ${orderId}`);
            return res.status(200).json({
                success: true,
                message: `Successfully deleted ${result.deletedCount} payment records`,
                deletedCount: result.deletedCount
            });
        } else {
            console.log(`No payment records found for order ${orderId}`);
            return res.status(200).json({
                success: true,
                message: 'No payment records found for this order',
                deletedCount: 0
            });
        }
    } catch (error) {
        console.error(`Error deleting payments for order ${req.params.orderId}:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 