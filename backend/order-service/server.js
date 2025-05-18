const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Special system stats endpoint that won't conflict with other routes
app.get('/system-stats', async (req, res) => {
    try {
        const Order = require('./models/Order');

        // Get total count of all orders without filtering
        const count = await Order.countDocuments();

        // Calculate total revenue from all orders
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);

        const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        console.log(`Stats calculated: ${count} orders, ${revenue} revenue`);

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
});

// Routes
app.use('/', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'order-service' });
});

// Set port and start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Order service running on port ${PORT}`);
});