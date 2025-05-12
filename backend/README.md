# DigiZone Microservices Backend

This is a microservice architecture for DigiZone backend. It consists of several independent services that work together to provide a complete e-commerce solution.

## Services

- **API Gateway (Port 3000)**: Main entry point for all client requests, handles routing to the appropriate service
- **User Service (Port 3001)**: Manages user authentication, registration, and profile management
- **Product Service (Port 3002)**: Handles product catalog, categories, and inventory
- **Order Service (Port 3003)**: Manages orders, shipping, and order status
- **Payment Service (Port 3004)**: Processes payments and maintains payment records

## Database

The microservices use MongoDB Atlas as their database with the following connection:
```
mongodb+srv://cnlthd:2003@microservice.qvhvt9f.mongodb.net/
```

Each service uses a separate database to ensure data isolation:
- User Service: `digizone-users`
- Product Service: `digizone-products`
- Order Service: `digizone-orders`
- Payment Service: `digizone-payments`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

### Installation

#### Normal Installation

1. Clone the repository
2. Install dependencies for all services:

```
npm run setup
```

#### Docker Installation

1. Make sure Docker and Docker Compose are installed on your system
2. Navigate to the backend directory
3. Run the Docker startup script:

On Linux/Mac:
```
./start-docker.sh
```

On Windows:
```
start-docker.bat
```

Or directly:
```
docker-compose up --build
```

### Running the Services

#### Running Locally

You can start all services at once:

```
npm start
```

Or start individual services:

```
npm run start:gateway
npm run start:user
npm run start:product
npm run start:order
npm run start:payment
```

#### Running with Docker

All services will start automatically with the Docker Compose command.
You can access the services at the same ports as in local development:
- Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- Payment Service: http://localhost:3004

## API Endpoints

### Gateway

- `GET /health` - Health check for the gateway
- `GET /` - Information about available endpoints

### User Service

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Authenticate user
- `GET /api/users/profile` - Get user profile (requires authentication)
- `PUT /api/users/profile` - Update user profile (requires authentication)
- `GET /api/users/admin/users` - Get all users (admin only)

### Product Service

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)

### Order Service

- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get a specific order
- `GET /api/orders/user/:userId` - Get orders for a specific user
- `PUT /api/orders/:id/pay` - Update order to paid
- `PUT /api/orders/:id/deliver` - Update order to delivered (admin only)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Payment Service

- `POST /api/payments/create-payment-intent` - Create a payment intent
- `POST /api/payments/confirm-payment` - Confirm a payment
- `GET /api/payments` - Get all payments (admin only)
- `GET /api/payments/user/:userId` - Get payments for a specific user
- `GET /api/payments/:id` - Get a specific payment

## Architecture

The DigiZone microservices use an API Gateway pattern where all client requests go through a central gateway that routes them to the appropriate service. This allows for better security, monitoring, and scaling of individual services.

## Authentication

Authentication is handled by the User Service, which issues JWT tokens. These tokens should be included in the Authorization header of requests to protected endpoints:

```
Authorization: Bearer <token>
```