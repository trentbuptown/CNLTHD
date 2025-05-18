import React, { useEffect, useState } from 'react';
import { Card, Container, Button, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import { getBaseUrl } from '../../services/api';
import { Clipboard, ArrowRepeat } from 'react-bootstrap-icons';
import Link from 'next/link';

interface ServiceStatus {
    name: string;
    endpoint: string;
    status: 'checking' | 'success' | 'error';
    responseTime?: number;
    error?: string;
    responseData?: any;
}

const ConnectionTest = () => {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Gateway', endpoint: '/api/csrf-token', status: 'checking' },
        { name: 'User Service', endpoint: '/api/users/health', status: 'checking' },
        { name: 'Product Service', endpoint: '/api/products/health', status: 'checking' },
        { name: 'Order Service', endpoint: '/api/orders/health', status: 'checking' },
        { name: 'Payment Service', endpoint: '/api/payments/health', status: 'checking' },
    ]);
    const [authorization, setAuthorization] = useState({
        token: '',
        headers: {},
        loggedIn: false
    });

    useEffect(() => {
        // Verify user authentication
        const token = localStorage.getItem('_digi_auth_token');
        const userStr = localStorage.getItem('_digi_user');
        let loggedIn = false;
        let user = null;

        try {
            if (token && userStr) {
                user = JSON.parse(userStr);
                loggedIn = Boolean(user && Object.keys(user).length > 0);

                // Update headers in axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            setAuthorization({
                token: token || '',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                loggedIn
            });

            console.log('Auth check:', { loggedIn, token: token?.substring(0, 10), user });
        } catch (error) {
            console.error('Error parsing user data:', error);
        }

        checkAllServices();
    }, []);

    const checkService = async (index: number) => {
        const service = services[index];
        const updatedServices = [...services];
        updatedServices[index] = { ...service, status: 'checking' };
        setServices(updatedServices);

        try {
            const baseUrl = getBaseUrl();
            const startTime = Date.now();

            const token = localStorage.getItem('_digi_auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            console.log(`Testing connection to ${service.name}: ${baseUrl}${service.endpoint}`);
            console.log('Using headers:', headers);

            const response = await axios.get(`${baseUrl}${service.endpoint}`, {
                headers: headers as any,
                timeout: 5000 // 5 second timeout
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            updatedServices[index] = {
                ...service,
                status: 'success',
                responseTime,
                responseData: response.data
            };

        } catch (error: any) {
            console.error(`Error connecting to ${service.name}:`, error);

            updatedServices[index] = {
                ...service,
                status: 'error',
                error: error.message,
                responseData: error.response?.data
            };
        }

        setServices(updatedServices);
    };

    const checkAllServices = () => {
        services.forEach((_, index) => {
            setTimeout(() => checkService(index), index * 800); // Staggered checks
        });
    };

    // Custom ping endpoint for services that don't have one
    const pingService = async (name: string, url: string) => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('_digi_auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            console.log(`Manual ping to ${name}: ${baseUrl}${url}`);

            // Use appropriate endpoints for health checks
            let pingUrl = url;
            if (name === 'Gateway') {
                pingUrl = '/api/csrf-token';
            } else if (name === 'User Service') {
                pingUrl = '/api/users/health';
            } else if (name === 'Product Service') {
                pingUrl = '/api/products/health';
            } else if (name === 'Order Service') {
                pingUrl = '/api/orders/health';
            } else if (name === 'Payment Service') {
                pingUrl = '/api/payments/health';
            }

            // Use type assertion for headers
            await axios.get(`${baseUrl}${pingUrl}`, {
                headers: headers as any,
                timeout: 3000
            });

            alert(`${name} responded successfully!`);
        } catch (error) {
            console.error(`Error pinging ${name}:`, error);
            alert(`Failed to connect to ${name}. See console for details.`);
        }
    };

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Microservice Connection Test</h2>
                <div>
                    <Button
                        variant="primary"
                        className="me-2"
                        onClick={checkAllServices}
                    >
                        <ArrowRepeat className="me-1" /> Retest All
                    </Button>
                    <Link href="/admin">
                        <Button variant="secondary">Back to Admin</Button>
                    </Link>
                </div>
            </div>

            <Card className="mb-4">
                <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">Authentication Status</h5>
                </Card.Header>
                <Card.Body>
                    <div className="mb-3">
                        <strong>Authentication:</strong> {" "}
                        <Badge bg={authorization.loggedIn ? "success" : "danger"}>
                            {authorization.loggedIn ? "Logged In" : "Not Logged In"}
                        </Badge>
                    </div>
                    {authorization.token && (
                        <div className="mb-3">
                            <strong>Token:</strong> <code className="ms-2">{authorization.token.substring(0, 15)}...</code>
                        </div>
                    )}
                    <div>
                        <strong>Headers: </strong>
                        <pre className="bg-light p-2 rounded mt-1">
                            {JSON.stringify(authorization.headers, null, 2)}
                        </pre>
                    </div>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Microservice Status</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Endpoint</th>
                                <th>Status</th>
                                <th>Response Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service, index) => (
                                <tr key={service.name}>
                                    <td><strong>{service.name}</strong></td>
                                    <td><code>{service.endpoint}</code></td>
                                    <td>
                                        {service.status === 'checking' && (
                                            <Badge bg="info">Checking...</Badge>
                                        )}
                                        {service.status === 'success' && (
                                            <Badge bg="success">Connected</Badge>
                                        )}
                                        {service.status === 'error' && (
                                            <Badge bg="danger">Failed</Badge>
                                        )}
                                    </td>
                                    <td>
                                        {service.responseTime && `${service.responseTime}ms`}
                                    </td>
                                    <td>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => checkService(index)}
                                        >
                                            Test
                                        </Button>
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            className="ms-2"
                                            onClick={() => pingService(service.name, service.endpoint)}
                                        >
                                            Ping
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Header className="bg-secondary text-white">
                    <h5 className="mb-0">Response Details</h5>
                </Card.Header>
                <Card.Body>
                    <div className="accordion">
                        {services.map((service, index) => (
                            <div className="accordion-item" key={service.name}>
                                <h2 className="accordion-header">
                                    <button
                                        className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse${index}`}
                                    >
                                        {service.name} {" "}
                                        {service.status === 'success' && <Badge bg="success" className="ms-2">Success</Badge>}
                                        {service.status === 'error' && <Badge bg="danger" className="ms-2">Error</Badge>}
                                    </button>
                                </h2>
                                <div
                                    id={`collapse${index}`}
                                    className="accordion-collapse collapse"
                                >
                                    <div className="accordion-body">
                                        {service.error ? (
                                            <div className="alert alert-danger">
                                                <strong>Error:</strong> {service.error}
                                            </div>
                                        ) : service.responseData ? (
                                            <pre className="bg-light p-3 rounded">
                                                {JSON.stringify(service.responseData, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="text-muted">No response data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header className="bg-warning">
                    <h5 className="mb-0">Backend Server Configuration</h5>
                </Card.Header>
                <Card.Body>
                    <p>
                        <strong>Connection Info:</strong> Make sure all microservices are running on their expected ports.
                    </p>
                    <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Gateway/API
                            <code>http://localhost:3000</code>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            User Service
                            <code>http://localhost:3001</code>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Product Service
                            <code>http://localhost:3002</code>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Order Service
                            <code>http://localhost:3003</code>
                        </li>
                        <li className="list-group-item d-flex justify-content-between align-items-center">
                            Payment Service
                            <code>http://localhost:3004</code>
                        </li>
                    </ul>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ConnectionTest; 