const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'product-service' });
});

// Set port and start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
}); 