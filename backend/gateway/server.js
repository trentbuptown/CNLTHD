const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN']
}));

// Enhanced logging
app.use(morgan(':date[iso] :method :url :status :response-time ms - :res[content-length]'));
app.use(express.json());

// Log request bodies for debugging
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`Request body: ${JSON.stringify(req.body)}`);
    }
    next();
});

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

// CSRF Token endpoint
app.get('/api/csrf-token', (req, res) => {
    // Generate a simple token or use a constant one for demonstration
    const csrfToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    res.json({
        success: true,
        message: 'CSRF token generated',
        result: csrfToken
    });
});

// Set up proxies for each service with enhanced options
Object.entries(services).forEach(([service, config]) => {
    app.use(`/api/${service}`, createProxyMiddleware({
        target: config.url,
        changeOrigin: true,
        pathRewrite: config.pathRewrite,
        onProxyReq: (proxyReq, req, res) => {
            // Safe access to req.path with fallback
            const path = req.path || req.url || '';
            console.log(`🔄 Proxying ${req.method} request to: ${config.url}${path.replace(new RegExp(`^/api/${service}`), '')}`);
            // If body is JSON and already parsed, stringify it again
            if (req.body && req.method !== 'GET') {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                // Write body data to request
                proxyReq.write(bodyData);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            const statusColor = proxyRes.statusCode < 400 ? '\x1b[32m' : '\x1b[31m'; // green or red
            console.log(`${statusColor}✓\x1b[0m Response from ${req.method} ${req.path}: Status ${proxyRes.statusCode}`);
            // Log the first part of the response
            let responseBody = '';
            const originalWrite = res.write;
            const originalEnd = res.end;

            res.write = function (chunk) {
                responseBody += chunk.toString('utf8');
                return originalWrite.apply(res, arguments);
            };

            res.end = function (chunk) {
                if (chunk) {
                    responseBody += chunk.toString('utf8');
                }
                if (proxyRes.statusCode >= 400) {
                    console.log(`⚠️ Error response: ${responseBody.substring(0, 500)}...`);
                } else {
                    console.log(`✅ Response body sample (${service}): ${responseBody.substring(0, 200)}...`);
                }
                originalEnd.apply(res, arguments);
            };
        },
        timeout: 60000, // 60 seconds timeout
        proxyTimeout: 60000
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

// Special endpoint for order stats to avoid route conflicts
app.get('/api/orders/stats', async (req, res) => {
    try {
        console.log('Proxying order stats request to system-stats endpoint');
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
        const axios = require('axios');
        const response = await axios.get(`${orderServiceUrl}/system-stats`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order statistics',
            error: error.message
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        success: false,
        message: 'Gateway Error',
        error: err.message
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway running on port ${PORT} (0.0.0.0)`);
}); 