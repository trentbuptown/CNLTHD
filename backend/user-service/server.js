const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN']
}));

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Log request body for debugging
    if (req.method === 'POST') {
        console.log('Request body:', JSON.stringify(req.body));
    }
    // Add response logging
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
        return originalSend.call(this, body);
    };
    next();
});

// Routes
app.use('/', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
});

// Set port and start server
const PORT = process.env.PORT || 3001;
// Binding to 0.0.0.0 makes the server accessible from any IP address
app.listen(PORT, '0.0.0.0', () => {
    console.log(`User service running on port ${PORT} (0.0.0.0)`);
}); 