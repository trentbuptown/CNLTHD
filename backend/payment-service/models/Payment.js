const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'usd'
    },
    method: {
        type: String,
        required: true,
        enum: ['credit_card', 'paypal', 'bank_transfer', 'vnpay', 'cod']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    paymentIntentId: {
        type: String
    },
    customerInfo: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            postalCode: { type: String },
            country: { type: String }
        }
    },
    cardDetails: {
        last4: { type: String },
        brand: { type: String },
        expiryMonth: { type: Number },
        expiryYear: { type: Number }
    },
    bankDetails: {
        bankName: { type: String },
        accountType: { type: String },
        transactionReference: { type: String }
    },
    paymentResponseCode: { type: String },
    paymentResponseMessage: { type: String },
    gatewayReference: { type: String },
    gatewayResponse: { type: Object },
    paymentDetails: {
        type: Object
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 