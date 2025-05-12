const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Service routes configuration
const services = {
    users: {
        url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
        pathRewrite: { '^/api/users': '' }
    },
    products: {
        url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
        pathRewrite: { '^/api/products': '' }
    },
    orders: {
        url: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
        pathRewrite: { '^/api/orders': '' }
    },
    payments: {
        url: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
        pathRewrite: { '^/api/payments': '' }
    }
};

// Set up proxies for each service
Object.entries(services).forEach(([service, config]) => {
    app.use(`/api/${service}`, createProxyMiddleware({
        target: config.url,
        changeOrigin: true,
        pathRewrite: config.pathRewrite
    }));
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Gateway is running' });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'DigiZone API Gateway',
        endpoints: [
            '/api/users - User service',
            '/api/products - Product service',
            '/api/orders - Order service',
            '/api/payments - Payment service'
        ]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
}); 