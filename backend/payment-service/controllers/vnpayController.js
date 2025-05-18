const crypto = require('crypto');
const querystring = require('querystring');
const axios = require('axios');

// VNPAY Configuration from environment variables
const config = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || "YOUR_MERCHANT_CODE",
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "YOUR_SECRET_KEY",
    vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/vnpay-return",
};

/**
 * Creates a VNPAY payment URL for checkout
 */
exports.createPaymentUrl = async (req, res) => {
    try {
        const { amount, orderId, orderInfo, ipAddr } = req.body;

        if (!amount || !orderId || !orderInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment parameters'
            });
        }

        const date = new Date();
        const createDate = date.getFullYear().toString() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);

        const tmnCode = config.vnp_TmnCode;
        const secretKey = config.vnp_HashSecret;

        // VNPay requires amount in VND with no decimal places
        const vnp_Amount = parseInt(amount * 100); // Convert to VND cents

        const orderType = 'other'; // billpayment, fashion, etc.
        const locale = 'vn'; // vn, en
        const currCode = 'VND';

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = vnp_Amount;
        vnp_Params['vnp_ReturnUrl'] = config.vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr || req.ip || '127.0.0.1';
        vnp_Params['vnp_CreateDate'] = createDate;

        // Sort parameters by field name
        const sortedParams = sortObject(vnp_Params);

        // Create signature
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = config.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

        res.status(200).json({
            success: true,
            paymentUrl
        });
    } catch (error) {
        console.error('Error creating payment URL:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Handles the VNPAY payment return callback
 */
exports.vnpayReturn = async (req, res) => {
    try {
        const vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        // Remove hash from params to verify
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sort params
        const sortedParams = sortObject(vnp_Params);

        // Create signature
        const secretKey = config.vnp_HashSecret;
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

        // Compare signatures
        const paymentSuccess = secureHash === signed && vnp_Params['vnp_ResponseCode'] === '00';
        const orderId = vnp_Params['vnp_TxnRef'];
        const amount = vnp_Params['vnp_Amount'] / 100; // Convert from VND cents back to display amount

        // Create or update payment record in the database
        try {
            const Payment = require('../models/Payment');

            // Try to find existing payment for this order first
            let payment = await Payment.findOne({ orderId });

            if (!payment) {
                // If no payment exists, try to get order info to create a new payment
                const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
                const orderResponse = await axios.get(`${orderServiceUrl}/orders/${orderId}`);

                if (orderResponse.data && orderResponse.data.success && orderResponse.data.order) {
                    const orderData = orderResponse.data.order;
                    const userInfo = orderResponse.data.userInfo || {};

                    // Create new payment record with comprehensive details
                    payment = new Payment({
                        orderId,
                        userId: orderData.userId,
                        amount,
                        currency: 'VND',
                        method: 'vnpay',
                        status: paymentSuccess ? 'completed' : 'failed',
                        transactionId: vnp_Params['vnp_TransactionNo'],
                        gatewayReference: vnp_Params['vnp_TransactionNo'],
                        paymentResponseCode: vnp_Params['vnp_ResponseCode'],
                        paymentResponseMessage: paymentSuccess ? 'Payment successful' : 'Payment failed',
                        customerInfo: {
                            name: orderData.shippingAddress?.name || userInfo.name,
                            email: orderData.shippingAddress?.email || userInfo.email,
                            phone: orderData.shippingAddress?.phone || userInfo.phone,
                            address: {
                                street: orderData.shippingAddress?.address,
                                city: orderData.shippingAddress?.city,
                                postalCode: orderData.shippingAddress?.postalCode,
                                country: orderData.shippingAddress?.country
                            }
                        },
                        bankDetails: {
                            bankName: vnp_Params['vnp_BankCode'] || 'Unknown',
                            transactionReference: vnp_Params['vnp_TransactionNo']
                        },
                        gatewayResponse: vnp_Params,
                        paymentDetails: {
                            ...vnp_Params,
                            paymentDate: new Date().toISOString()
                        }
                    });
                } else {
                    // Create a minimal payment record if order details are unavailable
                    payment = new Payment({
                        orderId,
                        amount,
                        currency: 'VND',
                        method: 'vnpay',
                        status: paymentSuccess ? 'completed' : 'failed',
                        transactionId: vnp_Params['vnp_TransactionNo'],
                        gatewayReference: vnp_Params['vnp_TransactionNo'],
                        paymentResponseCode: vnp_Params['vnp_ResponseCode'],
                        paymentResponseMessage: paymentSuccess ? 'Payment successful' : 'Payment failed',
                        bankDetails: {
                            bankName: vnp_Params['vnp_BankCode'] || 'Unknown',
                            transactionReference: vnp_Params['vnp_TransactionNo']
                        },
                        gatewayResponse: vnp_Params,
                        paymentDetails: {
                            ...vnp_Params,
                            paymentDate: new Date().toISOString()
                        }
                    });
                }
            } else {
                // Update existing payment record
                payment.status = paymentSuccess ? 'completed' : 'failed';
                payment.transactionId = vnp_Params['vnp_TransactionNo'];
                payment.gatewayReference = vnp_Params['vnp_TransactionNo'];
                payment.paymentResponseCode = vnp_Params['vnp_ResponseCode'];
                payment.paymentResponseMessage = paymentSuccess ? 'Payment successful' : 'Payment failed';
                payment.bankDetails = {
                    bankName: vnp_Params['vnp_BankCode'] || 'Unknown',
                    transactionReference: vnp_Params['vnp_TransactionNo']
                };
                payment.gatewayResponse = vnp_Params;
                payment.paymentDetails = {
                    ...payment.paymentDetails,
                    ...vnp_Params,
                    paymentDate: new Date().toISOString()
                };
            }

            // Save the payment record
            await payment.save();
            console.log(`Payment record ${paymentSuccess ? 'successful' : 'failed'} for order ${orderId}: ${payment._id}`);

        } catch (dbError) {
            console.error('Error saving payment information to database:', dbError);
            // Continue with payment process even if DB operations fail
        }

        // Update order payment status via appropriate API
        if (paymentSuccess) {
            try {
                // Notify order service about successful payment
                await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/orders/${orderId}/pay`, {
                    id: vnp_Params['vnp_TransactionNo'],
                    status: 'completed',
                    updateTime: new Date().toISOString(),
                    paymentMethod: 'vnpay',
                    bankCode: vnp_Params['vnp_BankCode'],
                    cardType: vnp_Params['vnp_CardType'],
                    gatewayReference: vnp_Params['vnp_TransactionNo']
                });
            } catch (error) {
                console.error('Error updating order payment status:', error.message);
            }
        }

        // Return result to client
        res.status(200).json({
            success: true,
            paymentSuccess,
            orderId,
            amount,
            message: paymentSuccess ? 'Payment successful' : 'Payment failed',
            responseCode: vnp_Params['vnp_ResponseCode']
        });
    } catch (error) {
        console.error('Error processing payment return:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Processes cash on delivery orders
 */
exports.createCodPayment = async (req, res) => {
    try {
        const { orderId, amount, customerInfo, orderData = {} } = req.body;

        if (!orderId || !amount || !customerInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }

        // Record COD payment in database with comprehensive information
        try {
            const Payment = require('../models/Payment');

            // Check if payment already exists
            let payment = await Payment.findOne({ orderId });

            if (!payment) {
                // Create new comprehensive payment record
                payment = new Payment({
                    orderId,
                    userId: customerInfo.userId || orderData.userId,
                    amount,
                    currency: 'USD',
                    method: 'cod',
                    status: 'pending',
                    transactionId: `cod_${Date.now()}`,
                    gatewayReference: `cod_${orderId}`,
                    paymentResponseCode: '00',
                    paymentResponseMessage: 'COD payment created',
                    customerInfo: {
                        name: customerInfo.name,
                        email: customerInfo.email,
                        phone: customerInfo.phone,
                        address: {
                            street: customerInfo.address,
                            city: customerInfo.city,
                            postalCode: customerInfo.postalCode,
                            country: customerInfo.country
                        }
                    },
                    paymentDetails: {
                        orderId,
                        amount,
                        paymentType: 'Cash on Delivery',
                        paymentDate: new Date().toISOString(),
                        deliveryInstructions: customerInfo.deliveryInstructions || '',
                        preferredDeliveryTime: customerInfo.preferredDeliveryTime || ''
                    }
                });

                await payment.save();
                console.log(`COD payment record created for order ${orderId}: ${payment._id}`);
            }
        } catch (dbError) {
            console.error('Error saving COD payment information:', dbError);
            // Continue with order process even if payment DB operations fail
        }

        // Update order status to "pending"
        try {
            await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/orders/${orderId}/status`, {
                status: 'pending'
            });
        } catch (error) {
            console.error('Error updating order status for COD:', error.message);
        }

        res.status(200).json({
            success: true,
            message: 'Cash on delivery order created successfully',
            orderId,
            paymentId: payment?._id
        });
    } catch (error) {
        console.error('Error creating COD payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Processes a direct payment without redirecting to VNPAY
 * This is a simulated function for demo purposes
 */
exports.processDirectPayment = async (req, res) => {
    try {
        const { orderId, tempId, amount, cardDetails, customerInfo = {} } = req.body;

        if (!amount || !cardDetails) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }

        // If we're processing a payment before creating an order,
        // we'll use a temporary ID and save the payment record without an orderId
        const isPreOrderPayment = tempId === true;

        // Handle different test card scenarios based on the card number
        const cardNumber = cardDetails.cardNumber?.replace(/\s/g, '');

        // NCB - insufficient funds
        if (cardNumber === '9704195798459170488') {
            try {
                // Create failed payment record
                const Payment = require('../models/Payment');
                const payment = new Payment({
                    orderId: isPreOrderPayment ? null : orderId, // No order ID for pre-order payments
                    userId: customerInfo.userId,
                    amount,
                    currency: 'VND',
                    method: 'vnpay',
                    status: 'failed',
                    transactionId: `vnpay_direct_${Date.now()}`,
                    gatewayReference: `err_insufficient_${Date.now()}`,
                    paymentResponseCode: 'INSUFFICIENT_FUNDS',
                    paymentResponseMessage: 'Insufficient funds in account',
                    customerInfo: {
                        name: customerInfo.name,
                        email: customerInfo.email,
                        phone: customerInfo.phone,
                        address: {
                            street: customerInfo.address,
                            city: customerInfo.city,
                            postalCode: customerInfo.postalCode,
                            country: customerInfo.country
                        }
                    },
                    cardDetails: {
                        last4: cardNumber.slice(-4),
                        brand: cardDetails.brand || 'NCB',
                        expiryMonth: parseInt(cardDetails.expiryDate?.split('/')[0]) || 0,
                        expiryYear: parseInt('20' + cardDetails.expiryDate?.split('/')[1]) || 0
                    },
                    paymentDetails: {
                        error: 'INSUFFICIENT_FUNDS',
                        cardType: 'NCB',
                        paymentDate: new Date().toISOString(),
                        errorDescription: 'Insufficient funds in account'
                    }
                });
                await payment.save();
            } catch (dbError) {
                console.error('Error saving failed payment record:', dbError);
            }

            return res.status(400).json({
                success: false,
                message: 'Insufficient funds in account',
                errorCode: 'INSUFFICIENT_FUNDS'
            });
        }

        // Handle other failure scenarios similarly...
        if (cardNumber === '9704192181368742' ||
            cardNumber === '9704193370791314' ||
            cardNumber === '9704194841945513') {

            let errorCode = 'CARD_ERROR';
            let errorMessage = 'Card error';

            if (cardNumber === '9704192181368742') {
                errorCode = 'CARD_NOT_ACTIVATED';
                errorMessage = 'Card is not activated';
            } else if (cardNumber === '9704193370791314') {
                errorCode = 'CARD_LOCKED';
                errorMessage = 'Card is locked';
            } else if (cardNumber === '9704194841945513') {
                errorCode = 'CARD_EXPIRED';
                errorMessage = 'Card has expired';
            }

            try {
                // Create failed payment record
                const Payment = require('../models/Payment');
                const payment = new Payment({
                    orderId: isPreOrderPayment ? null : orderId, // No order ID for pre-order payments
                    userId: customerInfo.userId,
                    amount,
                    currency: 'VND',
                    method: 'vnpay',
                    status: 'failed',
                    transactionId: `vnpay_direct_${Date.now()}`,
                    gatewayReference: `err_${errorCode.toLowerCase()}_${Date.now()}`,
                    paymentResponseCode: errorCode,
                    paymentResponseMessage: errorMessage,
                    customerInfo: {
                        name: customerInfo.name,
                        email: customerInfo.email,
                        phone: customerInfo.phone,
                        address: {
                            street: customerInfo.address,
                            city: customerInfo.city,
                            postalCode: customerInfo.postalCode,
                            country: customerInfo.country
                        }
                    },
                    cardDetails: {
                        last4: cardNumber.slice(-4),
                        brand: cardDetails.brand || 'NCB',
                        expiryMonth: parseInt(cardDetails.expiryDate?.split('/')[0]) || 0,
                        expiryYear: parseInt('20' + cardDetails.expiryDate?.split('/')[1]) || 0
                    },
                    paymentDetails: {
                        error: errorCode,
                        cardType: 'NCB',
                        paymentDate: new Date().toISOString(),
                        errorDescription: errorMessage
                    }
                });
                await payment.save();
            } catch (dbError) {
                console.error('Error saving failed payment record:', dbError);
            }

            return res.status(400).json({
                success: false,
                message: errorMessage,
                errorCode: errorCode
            });
        }

        // Successful payment case
        const transactionId = `vnpay_direct_${Date.now()}`;

        // Create successful payment record in database
        let paymentRecord;
        try {
            const Payment = require('../models/Payment');
            paymentRecord = new Payment({
                orderId: isPreOrderPayment ? null : orderId, // No order ID for pre-order payments
                userId: customerInfo.userId,
                amount,
                currency: 'VND',
                method: 'vnpay',
                // Always set status to 'completed' for successful payments, even for pre-order payments
                // This ensures payment is recognized as successful immediately
                status: 'completed',
                transactionId,
                gatewayReference: transactionId,
                paymentResponseCode: '00',
                paymentResponseMessage: isPreOrderPayment ?
                    'Payment successful, waiting for order creation' :
                    'Payment successful',
                customerInfo: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: {
                        street: customerInfo.address,
                        city: customerInfo.city,
                        postalCode: customerInfo.postalCode,
                        country: customerInfo.country
                    }
                },
                cardDetails: {
                    last4: cardNumber.slice(-4),
                    brand: cardDetails.brand || (cardNumber.startsWith('97') ? 'NCB' : 'Unknown'),
                    expiryMonth: parseInt(cardDetails.expiryDate?.split('/')[0]) || 0,
                    expiryYear: parseInt('20' + cardDetails.expiryDate?.split('/')[1]) || 0
                },
                bankDetails: {
                    bankName: 'NCB',
                    accountType: 'Credit Card',
                    transactionReference: transactionId
                },
                paymentDetails: {
                    cardType: 'Credit Card',
                    paymentDate: new Date().toISOString(),
                    authCode: Math.floor(100000 + Math.random() * 900000).toString(),
                    is3DS: cardNumber === '4456530000001096' ||
                        cardNumber === '5200000000001096' ||
                        cardNumber === '3337000000200004',
                    isPreOrderPayment: isPreOrderPayment, // Add this flag for better tracking
                    preOrderTime: isPreOrderPayment ? new Date().toISOString() : null
                }
            });

            await paymentRecord.save();
            console.log(`Direct payment record created with status '${paymentRecord.status}'${isPreOrderPayment ? ' (pre-order)' : ` for order ${orderId}`}: ${paymentRecord._id}`);
            console.log(`Payment Transaction ID: ${transactionId}`); // Log transaction ID for tracking
        } catch (dbError) {
            console.error('Error saving payment record:', dbError);
            // Continue with payment process even if DB operations fail
        }

        // Only update order if this is not a pre-order payment
        if (!isPreOrderPayment) {
            try {
                console.log('Updating order status for order:', orderId);
                await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/orders/${orderId}/pay`, {
                    id: transactionId,
                    status: 'completed',
                    updateTime: new Date().toISOString(),
                    paymentMethod: 'vnpay',
                    cardType: 'Credit Card',
                    cardLast4: cardNumber ? cardNumber.slice(-4) : undefined,
                    cardBrand: cardDetails.brand || (cardNumber && cardNumber.startsWith('97') ? 'NCB' : 'Unknown'),
                    gatewayReference: transactionId
                });
            } catch (error) {
                console.error('Error updating order payment status:', error.message);
                // Continue anyway as payment was successful
            }
        }

        // Successful response
        return res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            transactionId,
            paymentId: paymentRecord?._id,
            orderId: orderId || null,
            was3DS: cardNumber === '4456530000001096' ||
                cardNumber === '5200000000001096' ||
                cardNumber === '3337000000200004'
        });
    } catch (error) {
        console.error('Error processing direct payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Sort object by key
 * @param obj
 * @returns {{}|*}
 */
function sortObject(obj) {
    if (!obj) return {};
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
} 