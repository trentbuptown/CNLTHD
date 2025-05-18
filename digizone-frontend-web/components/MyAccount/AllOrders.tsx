import Link from 'next/link';
import React, { useEffect, useContext, useState } from 'react';
import {
	Badge,
	Button,
	Dropdown,
	DropdownButton,
	Row,
	Table,
} from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import { Orders } from '../../services/order.service';
import { Context } from '../../context';
import { CURRENCY_SYMBOL } from '../../helper/settings';

const AllOrders = () => {
	const { addToast } = useToasts();
	const { state: { user } } = useContext(Context);
	// Initialize orders as an empty array to avoid undefined errors
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

	useEffect(() => {
		fetchItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchItems = async (status?: string) => {
		setLoading(true);
		setError(null);
		try {
			console.log('Fetching user orders...');

			// Get user ID from context or localStorage
			const userId = user?.id || user?._id || JSON.parse(localStorage.getItem('_digi_user') || '{}')?.id;

			if (!userId) {
				throw new Error('User not logged in or user ID not found');
			}

			// Use getUserOrders instead of getAllOrders
			const response = await Orders.getUserOrders(userId, status);
			console.log('Orders response:', response);

			if (!response || !response.success) {
				throw new Error(response?.message || 'Failed to fetch orders');
			}

			// Check if we have orders in the response
			const orderData = response.result?.orders || response.orders || [];
			setOrders(orderData);
			console.log('Orders set:', orderData);
		} catch (error: any) {
			console.error('Error fetching orders:', error);
			setError(error.message || 'An error occurred while fetching orders');

			if (error.response && error.response.data) {
				if (Array.isArray(error.response.data.message)) {
					return error.response.data.message.forEach((message: any) => {
						addToast(message, { appearance: 'error', autoDismiss: true });
					});
				} else if (error.response.data.message) {
					return addToast(error.response.data.message, {
						appearance: 'error',
						autoDismiss: true,
					});
				}
			}
			addToast(error.message || 'An error occurred while fetching orders', { appearance: 'error', autoDismiss: true });
		} finally {
			setLoading(false);
		}
	};

	// Check if order can be cancelled (within 10 minutes of creation and not delivered/paid/cancelled)
	const canCancelOrder = (order: any) => {
		if (!order || !order.createdAt) return false;
		if (order.isDelivered || order.isPaid || order.status === 'cancelled' || order.status === 'delivered') return false;

		const orderTime = new Date(order.createdAt).getTime();
		const currentTime = new Date().getTime();
		const timeDiffMinutes = (currentTime - orderTime) / (1000 * 60);

		return timeDiffMinutes <= 10;
	};

	// Handle order cancellation
	const handleCancelOrder = async (orderId: string) => {
		try {
			if (!confirm('Are you sure you want to cancel this order?')) {
				return;
			}

			setCancellingOrderId(orderId);

			const response = await Orders.cancelOrder(orderId);

			if (response?.success) {
				addToast('Order cancelled successfully', { appearance: 'success', autoDismiss: true });

				// Update the order status in the UI without refetching
				setOrders(orders.map(order => {
					if (order._id === orderId) {
						return { ...order, status: 'cancelled' };
					}
					return order;
				}));
			} else {
				addToast(response?.message || 'Failed to cancel order', { appearance: 'error', autoDismiss: true });
			}
		} catch (error: any) {
			console.error('Error cancelling order:', error);
			addToast(error?.response?.data?.message || 'Error cancelling order. Please try again.', {
				appearance: 'error',
				autoDismiss: true,
			});
		} finally {
			setCancellingOrderId(null);
		}
	};

	const dateTOLocal = (date: any) => {
		return new Date(date).toLocaleString();
	};

	return (
		<>
			<Row>
				<DropdownButton
					variant='outline-secondary'
					title='Filter by status'
					id='input-group-dropdown-2'
					onSelect={(e) => {
						fetchItems(e ? e : '');
					}}
				>
					<Dropdown.Item href='#' eventKey=''>
						All
					</Dropdown.Item>
					<Dropdown.Item href='#' eventKey='pending'>
						Pending
					</Dropdown.Item>
					<Dropdown.Item href='#' eventKey='completed'>
						Complete
					</Dropdown.Item>
					<Dropdown.Item href='#' eventKey='cancelled'>
						Cancelled
					</Dropdown.Item>
				</DropdownButton>
			</Row>

			{loading ? (
				<div className="text-center py-4">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading orders...</span>
					</div>
					<p className="mt-2">Loading your orders...</p>
				</div>
			) : error ? (
				<div className="text-center py-4 text-danger">
					<p>{error}</p>
				</div>
			) : (
				<Table responsive>
					<thead>
						<tr>
							<th>Order ID</th>
							<th>Date</th>
							<th>Status</th>
							<th>Total</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{orders && orders.length > 0 ? (
							orders.map((order: any) => (
								<tr key={order._id}>
									<td style={{ color: 'green', cursor: 'pointer' }}>
										<Link href={`/orders/${order._id}`} legacyBehavior>
											<a>{order._id.substring(0, 10)}...</a>
										</Link>
									</td>
									<td>{dateTOLocal(order.createdAt || order.orderDate)}</td>
									<td>
										<Badge bg={
											order.status === 'pending' ? 'warning' :
												order.status === 'cancelled' ? 'danger' : 'success'
										}>
											{(order.status || order.orderStatus || 'pending').toUpperCase()}
										</Badge>
									</td>
									<td>{CURRENCY_SYMBOL}{order.totalPrice || order.paymnetInfo?.paymentAmount || order.paymentInfo?.paymentAmount || 0} </td>
									<td>
										<div className="d-flex flex-column flex-md-row gap-2">
											<Link href={`/orders/${order._id}`} legacyBehavior>
												<Button variant='outline-primary' size="sm" className="me-md-2">View Details</Button>
											</Link>
											{canCancelOrder(order) && (
												<Button
													variant='outline-danger'
													size="sm"
													disabled={cancellingOrderId === order._id}
													onClick={() => handleCancelOrder(order._id)}
												>
													{cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
												</Button>
											)}
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="text-center py-3">No orders found</td>
							</tr>
						)}
					</tbody>
				</Table>
			)}
			<div className="mt-3 text-muted">
				<small>* You can only cancel orders within 10 minutes of placing them and before they are paid or shipped.</small>
			</div>
		</>
	);
};

export default AllOrders;
