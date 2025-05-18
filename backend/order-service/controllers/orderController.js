const Order = require('../models/Order');
const axios = require('axios');

// @desc    Create new order
// @route   POST /orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            userId
        } = req.body;

        // Simple validation
        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items'
            });
        }

        // Format order items to match the schema
        const formattedOrderItems = orderItems.map(item => ({
            productId: item.productId,
            name: item.productName || 'Product',
            quantity: item.quantity,
            price: item.price
        }));

        // Update product stock for each item in the order
        try {
            for (const item of orderItems) {
                const response = await axios.put(
                    `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002'}/products/${item.productId}/stock`,
                    {
                        quantity: -item.quantity // Negative value to decrease stock
                    }
                );

                // If product stock update fails
                if (!response.data.success) {
                    return res.status(400).json({
                        success: false,
                        message: `Failed to update stock for product ${item.productId}: ${response.data.message}`
                    });
                }
            }
        } catch (error) {
            console.error('Error updating product stock:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update product stock'
            });
        }

        // Update user's phone number if provided in the shipping address
        if (userId && shippingAddress && shippingAddress.phone) {
            try {
                const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
                const updatePhoneResponse = await axios.put(
                    `${userServiceUrl}/users/${userId}/phone`,
                    { phone: shippingAddress.phone }
                );

                if (updatePhoneResponse.data.success) {
                    console.log(`Successfully updated phone number for user ${userId}`);
                } else {
                    console.warn(`Failed to update phone for user ${userId}: ${updatePhoneResponse.data.message}`);
                }
            } catch (error) {
                // Log the error but don't stop the order creation
                console.error(`Error updating phone for user ${userId}:`, error.message);
            }
        }

        const order = await Order.create({
            orderItems: formattedOrderItems,
            userId,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        console.log(`Fetching order with ID: ${req.params.id}`);
        const order = await Order.findById(req.params.id);

        if (!order) {
            console.log(`Order not found with ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log(`Order found: ${order._id}`);

        // Fetch user information if userId exists
        let userInfo = null;
        if (order.userId) {
            try {
                const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
                const userResponse = await axios.get(
                    `${userServiceUrl}/admin/users/${order.userId}`
                );

                if (userResponse.data.success && userResponse.data.user) {
                    userInfo = userResponse.data.user;
                    console.log(`Found user info for order: ${JSON.stringify(userInfo)}`);
                }
            } catch (userError) {
                console.error(`Error fetching user info for order ${order._id}:`, userError);
                // Continue without user info if there's an error
            }
        }

        res.status(200).json({
            success: true,
            order: order,
            userInfo: userInfo
        });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order to paid
// @route   PUT /orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.isPaid = true;
        order.paidAt = Date.now();

        // Store comprehensive payment information
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            updateTime: req.body.updateTime || new Date().toISOString(),
            emailAddress: req.body.emailAddress || order.shippingAddress?.email,
            paymentMethod: req.body.paymentMethod || order.paymentMethod,
            // Additional payment details
            gatewayReference: req.body.gatewayReference,
            bankCode: req.body.bankCode,
            cardType: req.body.cardType,
            last4: req.body.last4 || req.body.cardLast4,
            cardBrand: req.body.cardBrand,
            // Full response storage
            paymentDetails: req.body
        };

        const updatedOrder = await order.save();

        // Also store in payment service if there's additional data
        try {
            // Optional: Notify payment service about the successful payment update
            // This could be used if we want to sync payment status both ways
            const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';
            await axios.post(`${paymentServiceUrl}/payments/sync`, {
                orderId: order._id,
                status: 'completed',
                paymentDetails: order.paymentResult
            }).catch(err => console.log('Payment sync optional, continuing...'));
        } catch (error) {
            // This is optional, so don't prevent order update if it fails
            console.warn('Could not sync with payment service:', error.message);
        }

        res.status(200).json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order to paid:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order to delivered
// @route   PUT /orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'delivered';

        const updatedOrder = await order.save();

        res.status(200).json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get logged in user orders
// @route   GET /orders/user/:userId
// @access  Private
exports.getUserOrders = async (req, res) => {
    try {
        console.log(`Fetching orders for user: ${req.params.userId}`);
        const orders = await Order.find({ userId: req.params.userId });
        console.log(`Found ${orders.length} orders for user ${req.params.userId}`);

        res.status(200).json({
            success: true,
            message: "User orders retrieved successfully",
            result: { orders }, // Include in result for backward compatibility
            orders  // Also include at top level for newer frontend code
        });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.params.userId}:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all orders
// @route   GET /orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // If order is being cancelled and was not delivered, restore product stock
        if (status === 'cancelled' && !order.isDelivered && order.orderItems && order.orderItems.length > 0) {
            try {
                console.log(`Restoring stock for cancelled order ${order._id}`);

                for (const item of order.orderItems) {
                    const response = await axios.put(
                        `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002'}/products/${item.productId}/stock`,
                        {
                            quantity: item.quantity // Positive value to increase stock back
                        }
                    );

                    if (!response.data.success) {
                        console.error(`Failed to restore stock for product ${item.productId}: ${response.data.message}`);
                        // Continue with other items even if one fails
                    } else {
                        console.log(`Successfully restored ${item.quantity} units to product ${item.productId}`);
                    }
                }
            } catch (error) {
                console.error('Error restoring product stock:', error);
                // Continue with order status update even if stock restoration fails
            }
        }

        order.status = status;

        // If order is delivered, update isDelivered flag
        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();

        res.status(200).json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create checkout session
// @route   POST /orders/checkout
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    try {
        const { checkoutDetails } = req.body;

        if (!checkoutDetails || !Array.isArray(checkoutDetails) || checkoutDetails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in cart'
            });
        }

        console.log('Creating checkout session for:', JSON.stringify(checkoutDetails));

        // Calculate total price from items
        const totalPrice = checkoutDetails.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // For a real app, we would integrate with a payment service like Stripe here
        // For now, we'll create a mock checkout session URL

        try {
            // In a real implementation, we would call the payment service to create a checkout session
            // const paymentServiceResponse = await axios.post('http://payment-service:3004/api/checkout', {
            //     items: checkoutDetails,
            //     totalAmount: totalPrice
            // });

            // Mock successful response
            const checkoutSessionUrl = `/checkout?session=${Date.now()}`;

            // Return the URL to redirect to
            return res.status(200).json({
                success: true,
                message: 'Checkout session created',
                result: checkoutSessionUrl
            });
        } catch (paymentError) {
            console.error('Payment service error:', paymentError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment session'
            });
        }
    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete an order
// @route   DELETE /orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Restore product stock if order is not delivered
        if (!order.isDelivered && order.orderItems && order.orderItems.length > 0) {
            try {
                console.log(`Restoring stock for deleted order ${order._id}`);

                for (const item of order.orderItems) {
                    const response = await axios.put(
                        `${process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002'}/products/${item.productId}/stock`,
                        {
                            quantity: item.quantity // Positive value to increase stock back
                        }
                    );

                    if (!response.data.success) {
                        console.error(`Failed to restore stock for product ${item.productId}: ${response.data.message}`);
                        // Continue with other items even if one fails
                    } else {
                        console.log(`Successfully restored ${item.quantity} units to product ${item.productId}`);
                    }
                }
            } catch (error) {
                console.error('Error restoring product stock:', error);
                // Continue with order deletion even if stock restoration fails
            }
        }

        // Delete related payment records
        try {
            console.log(`Deleting payment records for order ${order._id}`);
            const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';
            const deletePaymentResponse = await axios.delete(
                `${paymentServiceUrl}/payments/order/${order._id}`
            );

            if (deletePaymentResponse.data.success) {
                console.log(`Successfully deleted ${deletePaymentResponse.data.deletedCount} payment records for order ${order._id}`);
            } else {
                console.warn(`Failed to delete payment records for order ${order._id}`);
            }
        } catch (error) {
            console.error(`Error deleting payment records for order ${order._id}:`, error.message);
            // Continue with order deletion even if payment deletion fails
        }

        await Order.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order statistics (count and revenue)
// @route   GET /orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
    try {
        // Get total count of orders
        const count = await Order.countDocuments();

        // Calculate total revenue from all orders
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);

        const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            count,
            revenue
        });
    } catch (error) {
        console.error('Error getting order statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 