const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/', productRoutes);

// Set port and start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Product service running on port ${PORT} (0.0.0.0)`);
}); 