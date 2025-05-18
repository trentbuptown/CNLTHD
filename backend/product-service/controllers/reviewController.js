const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Add a review
// @route   POST /products/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
    try {
        const { rating, comment, userId, userName } = req.body;
        const productId = req.params.id;

        // Validate input
        if (!rating || !comment || !userId || !userName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: rating, comment, userId, userName'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Create the review
        const review = await Review.create({
            userId,
            userName,
            productId,
            rating,
            comment
        });

        // Update product's average rating and review count
        const reviews = await Review.find({ productId });
        const totalReviews = reviews.length;

        const avgRating = reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;

        await Product.findByIdAndUpdate(productId, {
            avgRating: Number(avgRating.toFixed(1)),
            reviewCount: totalReviews
        });

        res.status(201).json({
            success: true,
            review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all reviews for a product
// @route   GET /products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.id;

        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get a review by ID
// @route   GET /products/:productId/reviews/:id
// @access  Public
exports.getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update a review
// @route   PUT /products/:productId/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { id, productId } = req.params;
        const { userId } = req.body; // This should come from authenticated user

        // Validate input
        if (!rating && !comment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one field to update'
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if review exists and belongs to user
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews'
            });
        }

        // Update the review
        const updatedReview = await Review.findByIdAndUpdate(
            id,
            { rating, comment },
            { new: true, runValidators: true }
        );

        // Update product's average rating
        const reviews = await Review.find({ productId });
        const totalReviews = reviews.length;

        const avgRating = reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;

        await Product.findByIdAndUpdate(productId, {
            avgRating: Number(avgRating.toFixed(1))
        });

        res.status(200).json({
            success: true,
            review: updatedReview
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a review
// @route   DELETE /products/:productId/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const { id, productId } = req.params;
        const { userId } = req.body; // This should come from authenticated user

        // Check if review exists and belongs to user
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        await review.remove();

        // Update product's average rating and review count
        const reviews = await Review.find({ productId });
        const totalReviews = reviews.length;

        let avgRating = 0;
        if (totalReviews > 0) {
            avgRating = reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;
        }

        await Product.findByIdAndUpdate(productId, {
            avgRating: Number(avgRating.toFixed(1)),
            reviewCount: totalReviews
        });

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 