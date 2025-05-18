import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Card, Row, Col, Alert, Button } from 'react-bootstrap';
import { GraphUp, BarChart, People, CurrencyDollar, Box, CheckCircle, XCircle } from 'react-bootstrap-icons';
import axios from 'axios';
import { getBaseUrl } from '../../services/api';
import Link from 'next/link';
import { CURRENCY_SYMBOL } from '../../helper/settings';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: []
    });
    const [serviceStatus, setServiceStatus] = useState({
        gateway: false,
        users: false,
        products: false,
        orders: false,
        payments: false,
        checking: false
    });

    const fetchDashboardStats = async () => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('_digi_auth_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch user stats
            let userCount = 0;
            try {
                const userResponse = await axios.get(`${baseUrl}/api/users/count`, { headers: headers as any });
                if (userResponse.data && userResponse.data.success) {
                    userCount = userResponse.data.count || 0;
                }
            } catch (error) {
                console.error('Failed to fetch user count', error);
                // Use 0 as default value if API fails
                userCount = 0;
            }

            // Fetch product stats
            let productCount = 0;
            try {
                const productResponse = await axios.get(`${baseUrl}/api/products/count`, { headers: headers as any });
                if (productResponse.data && productResponse.data.success) {
                    productCount = productResponse.data.count || 0;
                }
            } catch (error) {
                console.error('Failed to fetch product count', error);
                // Use 0 as default value if API fails
                productCount = 0;
            }

            // Fetch order stats
            let orderCount = 0;
            let revenue = 0;
            try {
                const orderResponse = await axios.get(`${baseUrl}/api/orders/stats`, { headers: headers as any });
                if (orderResponse.data && orderResponse.data.success) {
                    orderCount = orderResponse.data.count || 0;
                    revenue = orderResponse.data.revenue || 0;
                }
            } catch (error) {
                console.error('Failed to fetch order stats', error);
                // Use 0 as default values if API fails
                orderCount = 0;
                revenue = 0;
            }

            setStats({
                totalUsers: userCount,
                totalProducts: productCount,
                totalOrders: orderCount,
                totalRevenue: revenue,
                recentOrders: []
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
            // Use zeros as fallback
            setStats({
                totalUsers: 0,
                totalProducts: 0,
                totalOrders: 0,
                totalRevenue: 0,
                recentOrders: []
            });
        }
    };

    const checkServiceStatus = async () => {
        setServiceStatus(prev => ({ ...prev, checking: true }));

        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('_digi_auth_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Check gateway
            try {
                await axios.get(`${baseUrl}/api/csrf-token`, { headers: headers as any, timeout: 2000 });
                setServiceStatus(prev => ({ ...prev, gateway: true }));
            } catch (e) {
                console.error('Gateway service check failed:', e);
                setServiceStatus(prev => ({ ...prev, gateway: false }));
            }

            // Check user service
            try {
                await axios.get(`${baseUrl}/api/users/health`, { headers: headers as any, timeout: 2000 });
                setServiceStatus(prev => ({ ...prev, users: true }));
            } catch (e) {
                console.error('User service check failed:', e);
                setServiceStatus(prev => ({ ...prev, users: false }));
            }

            // Check product service
            try {
                await axios.get(`${baseUrl}/api/products/health`, { headers: headers as any, timeout: 2000 });
                setServiceStatus(prev => ({ ...prev, products: true }));
            } catch (e) {
                console.error('Product service check failed:', e);
                setServiceStatus(prev => ({ ...prev, products: false }));
            }

            // Check order service
            try {
                await axios.get(`${baseUrl}/api/orders/health`, { headers: headers as any, timeout: 2000 });
                setServiceStatus(prev => ({ ...prev, orders: true }));
            } catch (e) {
                console.error('Order service check failed:', e);
                setServiceStatus(prev => ({ ...prev, orders: false }));
            }

            // Check payment service
            try {
                await axios.get(`${baseUrl}/api/payments/health`, { headers: headers as any, timeout: 2000 });
                setServiceStatus(prev => ({ ...prev, payments: true }));
            } catch (e) {
                console.error('Payment service check failed:', e);
                setServiceStatus(prev => ({ ...prev, payments: false }));
            }
        } catch (error) {
            console.error('Service status check failed:', error);
        } finally {
            setServiceStatus(prev => ({ ...prev, checking: false }));
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        checkServiceStatus();
    }, []);

    return (
        <AdminLayout title="Dashboard">
            {/* Service Status Alert */}
            <Alert variant="info" className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>Backend Service Status</h5>
                        <p className="mb-0">
                            Make sure all backend microservices are running for the admin panel to work.
                            <br />
                            <small className="text-muted">
                                You can run <code>npm run start:services</code> in the root directory to start all services.
                            </small>
                        </p>
                    </div>
                    <div>
                        <Button
                            variant="outline-primary"
                            onClick={checkServiceStatus}
                            disabled={serviceStatus.checking}
                        >
                            {serviceStatus.checking ? 'Checking...' : 'Check Services'}
                        </Button>
                        {' '}
                        <Link href="/admin/connection-test">
                            <Button variant="outline-secondary">Detailed Status</Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-3">
                    <Row>
                        <Col md={2} xs={6} className="mb-2">
                            <div className="d-flex align-items-center">
                                {serviceStatus.gateway ?
                                    <CheckCircle className="text-success me-2" /> :
                                    <XCircle className="text-danger me-2" />}
                                <span>API Gateway</span>
                            </div>
                        </Col>
                        <Col md={2} xs={6} className="mb-2">
                            <div className="d-flex align-items-center">
                                {serviceStatus.users ?
                                    <CheckCircle className="text-success me-2" /> :
                                    <XCircle className="text-danger me-2" />}
                                <span>User Service</span>
                            </div>
                        </Col>
                        <Col md={2} xs={6} className="mb-2">
                            <div className="d-flex align-items-center">
                                {serviceStatus.products ?
                                    <CheckCircle className="text-success me-2" /> :
                                    <XCircle className="text-danger me-2" />}
                                <span>Product Service</span>
                            </div>
                        </Col>
                        <Col md={2} xs={6} className="mb-2">
                            <div className="d-flex align-items-center">
                                {serviceStatus.orders ?
                                    <CheckCircle className="text-success me-2" /> :
                                    <XCircle className="text-danger me-2" />}
                                <span>Order Service</span>
                            </div>
                        </Col>
                        <Col md={2} xs={6} className="mb-2">
                            <div className="d-flex align-items-center">
                                {serviceStatus.payments ?
                                    <CheckCircle className="text-success me-2" /> :
                                    <XCircle className="text-danger me-2" />}
                                <span>Payment Service</span>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Alert>

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="rounded-circle p-3 bg-primary text-white me-3">
                                <People size={24} />
                            </div>
                            <div>
                                <h6 className="mb-0">Total Users</h6>
                                <h3 className="mb-0">{stats.totalUsers}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="rounded-circle p-3 bg-success text-white me-3">
                                <Box size={24} />
                            </div>
                            <div>
                                <h6 className="mb-0">Total Products</h6>
                                <h3 className="mb-0">{stats.totalProducts}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="rounded-circle p-3 bg-warning text-white me-3">
                                <BarChart size={24} />
                            </div>
                            <div>
                                <h6 className="mb-0">Total Orders</h6>
                                <h3 className="mb-0">{stats.totalOrders}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="rounded-circle p-3 bg-danger text-white me-3">
                                <CurrencyDollar size={24} />
                            </div>
                            <div>
                                <h6 className="mb-0">Total Revenue</h6>
                                <h3 className="mb-0">{CURRENCY_SYMBOL}{stats.totalRevenue}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Additional Dashboard Widgets */}
            <Row>
                <Col md={8}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="card-title mb-0">Sales Overview</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center p-5 text-muted">
                                <GraphUp size={48} />
                                <p className="mt-3">Sales chart will be displayed here</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="card-title mb-0">Quick Actions</h5>
                        </Card.Header>
                        <Card.Body>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">
                                    <Link href="/admin/products">
                                        <a className="text-decoration-none">Add New Product</a>
                                    </Link>
                                </li>
                                <li className="list-group-item">
                                    <Link href="/admin/orders">
                                        <a className="text-decoration-none">View Recent Orders</a>
                                    </Link>
                                </li>
                                <li className="list-group-item">
                                    <Link href="/admin/users">
                                        <a className="text-decoration-none">Manage Users</a>
                                    </Link>
                                </li>
                                <li className="list-group-item">
                                    <Link href="/admin/connection-test">
                                        <a className="text-decoration-none">System Settings</a>
                                    </Link>
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
};

export default AdminDashboard; 