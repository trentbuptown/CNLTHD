import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import { Payments, VNPayResponsePayload } from '../../services/payment.service';
import { CURRENCY_SYMBOL } from '../../helper/settings';
import Link from 'next/link';

const VNPayReturn = () => {
    const router = useRouter();
    const { addToast } = useToasts();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
    const [orderDetails, setOrderDetails] = useState<{
        orderId: string;
        amount: number;
    } | null>(null);

    // Process the payment return once the query params are available
    useEffect(() => {
        const verifyPayment = async () => {
            if (!router.isReady) return;

            try {
                setLoading(true);
                const response: VNPayResponsePayload = await Payments.verifyVnpayReturn(router.query);

                if (response.success && response.paymentSuccess) {
                    setPaymentStatus('success');
                    setOrderDetails({
                        orderId: response.orderId || '',
                        amount: response.amount || 0
                    });

                    addToast('Payment successful!', {
                        appearance: 'success',
                        autoDismiss: true
                    });
                } else {
                    setPaymentStatus('failed');
                    addToast(response.message || 'Payment verification failed', {
                        appearance: 'error',
                        autoDismiss: true
                    });
                }
            } catch (error: any) {
                setPaymentStatus('failed');
                addToast(error.message || 'Error processing payment', {
                    appearance: 'error',
                    autoDismiss: true
                });
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [router.isReady, router.query, addToast]);

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Verifying your payment...</p>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header as="h4" className="text-center">
                            Payment {paymentStatus === 'success' ? 'Successful' : 'Failed'}
                        </Card.Header>
                        <Card.Body className="text-center">
                            {paymentStatus === 'success' ? (
                                <>
                                    <div className="mb-4">
                                        <span className="display-1 text-success">✓</span>
                                    </div>
                                    <h3>Thank you for your payment!</h3>
                                    {orderDetails && (
                                        <div className="my-4">
                                            <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
                                            <p><strong>Amount Paid:</strong> {CURRENCY_SYMBOL}{orderDetails.amount.toFixed(2)}</p>
                                        </div>
                                    )}
                                    <p>Your order has been confirmed and is now being processed.</p>
                                    <div className="mt-4">
                                        <Link href="/my-account/orders">
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
                                </>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <span className="display-1 text-danger">✗</span>
                                    </div>
                                    <h3>Payment Failed</h3>
                                    <p>Your payment could not be processed successfully.</p>
                                    <Alert variant="warning" className="my-4">
                                        If you were charged but received this error, please contact our support team.
                                    </Alert>
                                    <div className="mt-4">
                                        <Link href="/checkout">
                                            <Button variant="outline-primary" className="me-3">
                                                Try Again
                                            </Button>
                                        </Link>
                                        <Link href="/">
                                            <Button variant="primary">
                                                Back to Home
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default VNPayReturn; 