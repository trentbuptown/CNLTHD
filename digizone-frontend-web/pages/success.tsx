import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import Link from 'next/link';
import axios from 'axios';
import { getBaseUrl } from '../services/api';
import { CURRENCY_SYMBOL } from '../helper/settings';

interface OrderDetails {
    _id: string;
    totalPrice: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    shippingAddress: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        email: string;
        phone: string;
    };
}

const Success = () => {
    const router = useRouter();
    const { order_id } = router.query;
    const { addToast } = useToasts();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderDetails | null>(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!router.isReady || !order_id) return;

            try {
                setLoading(true);
                const baseUrl = getBaseUrl();
                const response = await axios.get(`${baseUrl}/api/orders/${order_id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('_digi_auth_token')}`
                    }
                });

                if (response.data && response.data.success) {
                    setOrder(response.data.order || response.data.result);
                } else {
                    addToast('Failed to load order details', {
                        appearance: 'error',
                        autoDismiss: true
                    });
                }
            } catch (error: any) {
                addToast(error.message || 'Error loading order details', {
                    appearance: 'error',
                    autoDismiss: true
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [router.isReady, order_id, addToast]);

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading order details...</p>
            </Container>
        );
    }

    if (!order) {
        return (
            <Container className="my-5 text-center">
                <Card>
                    <Card.Body>
                        <h2>Order not found</h2>
                        <p>We couldn't find the order you're looking for.</p>
                        <Link href="/">
                            <Button variant="primary">Return to Homepage</Button>
                        </Link>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header as="h4" className="text-center">
                            Order Placed Successfully
                        </Card.Header>
                        <Card.Body className="text-center">
                            <div className="mb-4">
                                <span className="display-1 text-success">✓</span>
                            </div>
                            <h3>Thank you for your order!</h3>

                            <div className="my-4">
                                <p><strong>Order ID:</strong> {order._id}</p>
                                <p><strong>Amount:</strong> {CURRENCY_SYMBOL}{order.totalPrice?.toFixed(2)}</p>
                                <p><strong>Payment Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
                                <p><strong>Shipping Address:</strong></p>
                                <p>
                                    {order.shippingAddress.name}<br />
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                                    {order.shippingAddress.country}
                                </p>
                            </div>

                            {order.paymentMethod === 'cod' && (
                                <div className="alert alert-info">
                                    <p>
                                        <strong>Payment Instructions:</strong> Please have the exact amount ready for delivery.
                                        Our delivery personnel will collect the payment when delivering your package.
                                    </p>
                                </div>
                            )}

                            <p>Your order has been confirmed and will be processed soon.</p>

                            <div className="mt-4">
                                <Link href="/my-account">
                                    <Button variant="outline-primary" className="me-3">
                                        View Orders
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="primary">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Success; 