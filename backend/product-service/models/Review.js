const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required']
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    userName: {
        type: String,
        required: [true, 'User name is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple reviews by same user for same product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 