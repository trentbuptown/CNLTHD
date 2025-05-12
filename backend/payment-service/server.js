const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'payment-service' });
});

// Set port and start server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
}); 