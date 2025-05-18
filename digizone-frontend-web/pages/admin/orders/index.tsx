import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { Button, Card, Table, Form, InputGroup, Dropdown, DropdownButton, Badge, Modal } from 'react-bootstrap';
import { Search, Eye, Trash } from 'react-bootstrap-icons';
import Link from 'next/link';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../services/api';
import { Orders } from '../../../services/order.service';
import { CURRENCY_SYMBOL } from '../../../helper/settings';

// Update the interface to match the actual structure returned from the backend
interface Order {
    _id: string;
    userId: string;
    orderItems: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: string;
    totalPrice: number;
    status: string;
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
    paymentInfo?: {
        paymentId?: string;
        paymentStatus?: string;
        paymentAmount?: number;
        paymentMethod?: string;
    };
}

const AdminOrders = () => {
    const { addToast } = useToasts();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchOrders = async (status: string = '') => {
        setLoading(true);
        try {
            const baseUrl = getBaseUrl();
            const url = status
                ? `${baseUrl}/api/orders?status=${status}`
                : `${baseUrl}/api/orders`;

            console.log('Fetching orders from:', url);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('_digi_auth_token')}`
                }
            });
            console.log('Orders API response:', response.data);

            if (response.data && response.data.success) {
                // Handle the data structure from the backend
                const ordersData = response.data.orders || response.data.result || [];
                setOrders(ordersData);
                console.log('Orders data set:', ordersData);
            } else {
                throw new Error(response.data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            addToast('Failed to load orders. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const baseUrl = getBaseUrl();
            const response = await axios.put(`${baseUrl}/api/orders/${orderId}/status`, { status });

            if (response.data && response.data.success) {
                // Update the order status in the local state
                setOrders(prevOrders => prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: status } : order
                ));

                addToast('Order status updated successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response.data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            addToast('Failed to update order status. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        }
    };

    useEffect(() => {
        fetchOrders(statusFilter);
    }, [statusFilter]);

    const getStatusBadgeVariant = (status: string) => {
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

    // Update filter function with null checks and using actual properties
    const filteredOrders = orders.filter(order => {
        if (!searchTerm.trim()) return true;

        const search = searchTerm.toLowerCase();

        // Safe property access with optional chaining and fallbacks
        const orderId = order._id?.toLowerCase() || '';
        const email = order.shippingAddress?.email?.toLowerCase() || '';
        const name = order.shippingAddress?.name?.toLowerCase() || '';

        return orderId.includes(search) ||
            email.includes(search) ||
            name.includes(search);
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const handleDeleteClick = (orderId: string) => {
        setOrderToDelete(orderId);
        setShowDeleteModal(true);
    };

    const handleDeleteCancel = () => {
        setOrderToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await Orders.deleteOrder(orderToDelete);

            if (response.success) {
                // Remove the deleted order from the state
                setOrders(prevOrders => prevOrders.filter(order => order._id !== orderToDelete));

                addToast('Order deleted successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
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
            setOrderToDelete(null);
            setShowDeleteModal(false);
        }
    };

    return (
        <AdminLayout title="Order Management">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">All Orders</h5>

                        <DropdownButton
                            variant="outline-secondary"
                            title={statusFilter ? `Status: ${statusFilter}` : 'All Orders'}
                            id="status-filter"
                            onSelect={(key) => setStatusFilter(key || '')}
                        >
                            <Dropdown.Item eventKey="">All Orders</Dropdown.Item>
                            <Dropdown.Item eventKey="pending">Pending</Dropdown.Item>
                            <Dropdown.Item eventKey="processing">Processing</Dropdown.Item>
                            <Dropdown.Item eventKey="shipped">Shipped</Dropdown.Item>
                            <Dropdown.Item eventKey="delivered">Delivered</Dropdown.Item>
                            <Dropdown.Item eventKey="cancelled">Cancelled</Dropdown.Item>
                        </DropdownButton>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <InputGroup>
                            <InputGroup.Text>
                                <Search />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by order ID, customer name, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading orders...</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <tr key={order._id}>
                                                <td>{order._id.substring(0, 8)}...</td>
                                                <td>
                                                    <div>{order.shippingAddress?.name || 'Unknown'}</div>
                                                    <small className="text-muted">{order.shippingAddress?.email || 'No email'}</small>
                                                </td>
                                                <td>{formatDate(order.createdAt)}</td>
                                                <td>{CURRENCY_SYMBOL}{order.totalPrice}</td>
                                                <td>
                                                    <Badge bg={getStatusBadgeVariant(order.status)}>
                                                        {order.status || 'pending'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {/* Determine payment status badge */}
                                                    {order.isPaid ? (
                                                        <Badge bg="success">Paid</Badge>
                                                    ) : order.paymentInfo?.paymentStatus === 'success' ? (
                                                        <Badge bg="success">Paid</Badge>
                                                    ) : order.paymentInfo?.paymentStatus === 'completed' ? (
                                                        <Badge bg="success">Paid</Badge>
                                                    ) : order.status === 'cancelled' ? (
                                                        <Badge bg="danger">Cancelled</Badge>
                                                    ) : (
                                                        <Badge bg="warning">Pending</Badge>
                                                    )}
                                                    <div>
                                                        <small>{order.paymentMethod || order.paymentInfo?.paymentMethod || 'N/A'}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex">
                                                        <Link href={`/admin/orders/${order._id}`} className="me-2">
                                                            <span>
                                                                <Button variant="outline-primary" size="sm">
                                                                    <Eye className="me-1" /> View
                                                                </Button>
                                                            </span>
                                                        </Link>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(order._id)}
                                                        >
                                                            <Trash className="me-1" /> Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-3">
                                                {searchTerm ? 'No orders match your search' : 'No orders found'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </>
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
                    {orderToDelete && (
                        <div className="mt-2 alert alert-warning">
                            Order ID: {orderToDelete.substring(0, 8)}...
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

export default AdminOrders; 