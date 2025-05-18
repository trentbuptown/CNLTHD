import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { Badge, Button, Card, Col, ListGroup, Row, Table, Modal } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../services/api';
import { CURRENCY_SYMBOL, DEFAULT_IMAGE_URL } from '../../../helper/settings';
import Link from 'next/link';
import { ArrowLeft, Clipboard, Trash } from 'react-bootstrap-icons';
import Image from 'next/image';
import { Orders } from '../../../services/order.service';

// Define Order interface to fix typing issues
interface Order {
    _id?: string;
    status?: string;
    orderItems?: any[];
    totalPrice?: number;
    shippingAddress?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        country?: string;
    };
    userId?: string;
    isPaid?: boolean;
    paidAt?: string;
    paymentMethod?: string;
    createdAt?: string;
    paymentInfo?: {
        paymentId?: string;
        paymentStatus?: string;
        paymentAmount?: number;
        paymentMethod?: string;
        createdAt?: string;
    };
    paymentResult?: { id?: string; status?: string; updateTime?: string; emailAddress?: string; gatewayReference?: string; last4?: string; cardBrand?: string; };
}

// Define UserInfo interface
interface UserInfo {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    active?: boolean;
    createdAt?: string;
}

const AdminOrderDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const { addToast } = useToasts();
    const [order, setOrder] = useState<Order | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const baseUrl = getBaseUrl();
            const url = `${baseUrl}/api/orders/${id}`;

            console.log('Fetching order details from:', url);

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('_digi_auth_token')}`
                }
            });

            console.log('Order details response:', response.data);

            if (response.data && response.data.success) {
                // Handle the data structure from the backend
                const orderData = response.data.order || response.data.result || {};
                setOrder(orderData);

                // Store user info if available
                if (response.data.userInfo) {
                    setUserInfo(response.data.userInfo);
                    console.log('User info received:', response.data.userInfo);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to fetch order details');
            }
        } catch (error: any) {
            console.error('Error fetching order details:', error);
            setError(error.message || 'An error occurred while fetching the order details');
            addToast('Failed to load order details. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (status: string) => {
        try {
            setUpdateStatusLoading(true);

            if (typeof id !== 'string') {
                throw new Error('Invalid order ID');
            }

            const response = await Orders.updateOrderStatus(id, status);

            if (response && response.success) {
                setOrder((prev: Order | null) => prev ? ({ ...prev, status }) : null);
                addToast('Order status updated successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response?.message || 'Failed to update order status');
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            addToast(error.message || 'Failed to update order status', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setUpdateStatusLoading(false);
        }
    };

    const getStatusBadgeVariant = (status: string | undefined) => {
        if (!status) return 'secondary';

        switch (status.toLowerCase()) {
            case 'pending': return 'warning';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        if (!id) return;

        try {
            setDeleteLoading(true);
            const response = await Orders.deleteOrder(id.toString());

            if (response.success) {
                addToast('Order deleted successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });

                // Navigate back to orders page after deletion
                setTimeout(() => {
                    router.push('/admin/orders');
                }, 1000);
            } else {
                throw new Error(response.message || 'Failed to delete order');
            }
        } catch (error: any) {
            console.error('Error deleting order:', error);
            addToast(error.message || 'Failed to delete order. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <AdminLayout title={`Order Details: ${id}`}>
            <div className="mb-4">
                <Link href="/admin/orders" className="btn btn-outline-secondary">
                    <span>
                        <ArrowLeft className="me-1" /> Back to Orders
                    </span>
                </Link>

                <Button
                    variant="outline-danger"
                    className="ms-2"
                    onClick={handleDeleteClick}
                >
                    <Trash className="me-1" /> Delete Order
                </Button>
            </div>

            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <Button
                                variant="outline-secondary"
                                className="me-2"
                                onClick={() => router.push('/admin/orders')}
                            >
                                <ArrowLeft />
                            </Button>
                            <h5 className="mb-0">Order Details {order?._id && `- ${order._id}`}</h5>
                        </div>

                        {order && !loading && (
                            <Badge bg={getStatusBadgeVariant(order.status)} className="p-2">
                                {order.status?.toUpperCase() || 'PENDING'}
                            </Badge>
                        )}
                    </div>
                </Card.Header>

                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading order details...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : order ? (
                        <>
                            <Row>
                                <Col md={8}>
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Order Items</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Price</th>
                                                        <th>Quantity</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.orderItems && order.orderItems.length > 0 ? (
                                                        order.orderItems.map((item: any, index: number) => (
                                                            <tr key={item._id || item.productId || index}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="me-3" style={{ width: '50px', height: '50px', position: 'relative' }}>
                                                                            <img
                                                                                src={item.image || DEFAULT_IMAGE_URL}
                                                                                alt={item.name}
                                                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                                onError={(e: any) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src = DEFAULT_IMAGE_URL;
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <p className="mb-0 fw-bold">{item.name}</p>
                                                                            <small>SKU: {item.productId?.substring(0, 8)}...</small>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>{CURRENCY_SYMBOL}{item.price}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>{CURRENCY_SYMBOL}{(item.price * item.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="text-center">No items in this order</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={3} className="text-end fw-bold">Total Amount:</td>
                                                        <td className="fw-bold">{CURRENCY_SYMBOL}{order.totalPrice?.toFixed(2) || '0.00'}</td>
                                                    </tr>
                                                </tfoot>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={4}>
                                    {/* Order Summary */}
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Order Summary</h6>
                                        </Card.Header>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item>
                                                <div className="d-flex justify-content-between">
                                                    <span>Order ID:</span>
                                                    <span>{order._id}</span>
                                                </div>
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <div className="d-flex justify-content-between">
                                                    <span>Date:</span>
                                                    <span>{formatDate(order.createdAt)}</span>
                                                </div>
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <div className="d-flex justify-content-between">
                                                    <span>Payment Method:</span>
                                                    <span>{order.paymentMethod || 'Not specified'}</span>
                                                </div>
                                            </ListGroup.Item>
                                            <ListGroup.Item>                                                <div className="d-flex justify-content-between">                                                    <span>Payment Status:</span>                                                    <Badge bg={order.isPaid || (order.paymentInfo && order.paymentInfo.paymentStatus === 'success') || (order.paymentResult && (order.paymentResult.status === 'completed' || order.paymentResult.status === 'success')) ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>                                                        {order.isPaid || (order.paymentInfo && order.paymentInfo.paymentStatus === 'success') || (order.paymentResult && (order.paymentResult.status === 'completed' || order.paymentResult.status === 'success')) ? 'PAID' : order.status === 'cancelled' ? 'CANCELLED' : 'PENDING'}                                                    </Badge>                                                </div>                                            </ListGroup.Item>                                            {/* Payment ID from either source */}                                            {(order.paymentInfo?.paymentId || order.paymentResult?.id) && (<ListGroup.Item>                                                    <div className="d-flex justify-content-between">                                                        <span>Payment ID:</span>                                                        <span>{order.paymentResult?.id || order.paymentInfo?.paymentId}</span>                                                    </div>                                                </ListGroup.Item>)}                                            {/* Transaction Reference */}                                            {order.paymentResult?.gatewayReference && (<ListGroup.Item>                                                    <div className="d-flex justify-content-between">                                                        <span>Transaction Reference:</span>                                                        <span>{order.paymentResult.gatewayReference}</span>                                                    </div>                                                </ListGroup.Item>)}                                            {/* Payment card info if available */}                                            {(order.paymentResult?.last4 || order.paymentResult?.cardBrand) && (<ListGroup.Item>                                                    <div className="d-flex justify-content-between">                                                        <span>Card Details:</span>                                                        <span>                                                            {order.paymentResult.cardBrand && `${order.paymentResult.cardBrand} `}                                                            {order.paymentResult.last4 && `****${order.paymentResult.last4}`}                                                        </span>                                                    </div>                                                </ListGroup.Item>)}                                            {/* Show payment date */}                                            {(order.isPaid && order.paidAt) || (order.paymentInfo && order.paymentInfo.createdAt) || (order.paymentResult && order.paymentResult.updateTime) ? (<ListGroup.Item>                                                    <div className="d-flex justify-content-between">                                                        <span>Paid On:</span>                                                        <span>{formatDate(order.paidAt || order.paymentResult?.updateTime || order.paymentInfo?.createdAt)}</span>                                                    </div>                                                </ListGroup.Item>) : null}
                                            <ListGroup.Item>
                                                <div className="d-flex justify-content-between">
                                                    <span>Total Amount:</span>
                                                    <span className="fw-bold">
                                                        {CURRENCY_SYMBOL}{order.totalPrice?.toFixed(2) || '0.00'}
                                                    </span>
                                                </div>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card>

                                    {/* Customer Information */}
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Customer Information</h6>
                                        </Card.Header>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item>
                                                <div className="mb-1 fw-bold">Contact Information</div>
                                                <div>{order.shippingAddress?.name || 'Customer name not provided'}</div>
                                                <div>Email: {order.shippingAddress?.email || 'Not provided'}</div>
                                                <div>Phone: {order.shippingAddress?.phone || 'Not provided'}</div>
                                            </ListGroup.Item>
                                            {userInfo && (
                                                <ListGroup.Item>
                                                    <div className="mb-1 fw-bold">User Account Details</div>
                                                    <div>Name: {userInfo.name}</div>
                                                    <div>Email: {userInfo.email}</div>
                                                    <div>Phone: {userInfo.phone || 'Not provided'}</div>
                                                    <div>User Type: {userInfo.role}</div>
                                                    <div>Account Status: {userInfo.active ? 'Active' : 'Inactive'}</div>
                                                    <div>Account Created: {new Date(userInfo.createdAt || '').toLocaleDateString()}</div>
                                                </ListGroup.Item>
                                            )}
                                            <ListGroup.Item>
                                                <div className="mb-1 fw-bold">Shipping Address</div>
                                                <div>{order.shippingAddress?.address || 'Not provided'}</div>
                                                <div>
                                                    {order.shippingAddress?.city && `${order.shippingAddress.city}, `}
                                                    {order.shippingAddress?.postalCode || 'No postal code'}
                                                </div>
                                                <div>{order.shippingAddress?.country || 'No country specified'}</div>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card>

                                    {/* Order Status */}
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">Update Order Status</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="d-grid gap-2">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => updateOrderStatus('pending')}
                                                    disabled={order.status === 'pending' || updateStatusLoading}
                                                >
                                                    Pending
                                                </Button>
                                                <Button
                                                    variant="outline-info"
                                                    onClick={() => updateOrderStatus('processing')}
                                                    disabled={order.status === 'processing' || updateStatusLoading}
                                                >
                                                    Processing
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => updateOrderStatus('shipped')}
                                                    disabled={order.status === 'shipped' || updateStatusLoading}
                                                >
                                                    Shipped
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    onClick={() => updateOrderStatus('delivered')}
                                                    disabled={order.status === 'delivered' || updateStatusLoading}
                                                >
                                                    Delivered
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    onClick={() => updateOrderStatus('cancelled')}
                                                    disabled={order.status === 'cancelled' || updateStatusLoading}
                                                >
                                                    Cancelled
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <div className="alert alert-warning">Order not found</div>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this order? This action cannot be undone.
                    {id && (
                        <div className="mt-2 alert alert-warning">
                            Order ID: {typeof id === 'string' ? id.substring(0, 8) : ''}...
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleDeleteCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteConfirm}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete Order'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
};

export default AdminOrderDetail; 