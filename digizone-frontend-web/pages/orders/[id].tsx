import axios from 'axios';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import {
	Badge,
	Button,
	Card,
	Col,
	Image,
	ListGroup,
	Row,
	Table,
} from 'react-bootstrap';
import { Clipboard } from 'react-bootstrap-icons';
import { useToasts } from 'react-toast-notifications';
import { useEffect, useState } from 'react';
import { Orders } from '../../services/order.service';
import { Products } from '../../services/product.service';
import { CURRENCY_SYMBOL, DEFAULT_IMAGE_URL } from '../../helper/settings';
import { useRouter } from 'next/router';

interface OrderProps {
	order: any;
}

const Order: NextPage<OrderProps> = ({ order: initialOrder }) => {
	const { addToast } = useToasts();
	const [order, setOrder] = useState(initialOrder);
	const [loading, setLoading] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [products, setProducts] = useState<Record<string, any>>({});
	const router = useRouter();

	useEffect(() => {
		if (!initialOrder || Object.keys(initialOrder).length === 0) {
			fetchOrderDetails();
		}
	}, [initialOrder]);

	useEffect(() => {
		if (order?.orderItems?.length > 0) {
			fetchProductDetails();
		}
	}, [order]);

	const fetchOrderDetails = async () => {
		try {
			setLoading(true);
			// Get order ID from URL
			const orderId = window.location.pathname.split('/').pop();
			if (!orderId) return;

			console.log('Fetching order details for:', orderId);
			const response = await Orders.getOrder(orderId);
			console.log('Order details response:', response);

			if (response?.success) {
				// Extract order data from the response structure
				const orderData = response.result?.order || response.result || response.order || {};
				console.log('Order data:', orderData);
				setOrder(orderData);
			}
		} catch (error) {
			console.error('Error fetching order details:', error);
			addToast('Failed to load order details. Please try again.', {
				appearance: 'error',
				autoDismiss: true,
			});
		} finally {
			setLoading(false);
		}
	};

	// Fetch product details for each item in the order
	const fetchProductDetails = async () => {
		try {
			const productMap: Record<string, any> = {};

			for (const item of order.orderItems) {
				if (item.productId && !productMap[item.productId]) {
					try {
						console.log(`Fetching product details for product ID: ${item.productId}`);
						const response = await Products.getProduct(item.productId);
						if (response?.success) {
							const productData = response.result || response.product || {};
							productMap[item.productId] = productData;
							console.log(`Found product:`, productData);
						}
					} catch (error) {
						console.error(`Error fetching product ${item.productId}:`, error);
					}
				}
			}

			setProducts(productMap);
			console.log("Loaded products data:", productMap);
		} catch (error) {
			console.error('Error fetching product details:', error);
		}
	};

	// Handle cases where order might not have the expected structure
	const orderItems = order?.orderItems || [];
	const shippingAddress = order?.shippingAddress || {};
	const paymentMethod = order?.paymentMethod || 'Not specified';
	const totalPrice = order?.totalPrice || 0;
	const orderStatus = order?.status || 'pending';
	const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'Not available';

	console.log("Products state:", products);
	console.log("Order items:", orderItems);

	// Helper function to get product details
	const getProductDetails = (productId: string) => {
		return products[productId] || {};
	};

	// Helper function to get product image
	const getProductImage = (item: any) => {
		const product = getProductDetails(item.productId);
		// Check multiple possible image sources with logging
		console.log("Getting image for item:", item);
		console.log("Product info:", product);

		if (item.image) {
			console.log("Using item.image:", item.image);
			return item.image;
		}
		if (product && product.image) {
			console.log("Using product.image:", product.image);
			return product.image;
		}
		if (product && product.imageUrl) {
			console.log("Using product.imageUrl:", product.imageUrl);
			return product.imageUrl;
		}
		console.log("Using default image");
		return DEFAULT_IMAGE_URL;
	};

	// Helper function to get product name
	const getProductName = (item: any) => {
		const product = getProductDetails(item.productId);
		const name = item.name || (product && (product.name || product.productName)) || 'Product';
		console.log(`Product name for ${item.productId}:`, name);
		return name;
	};

	// Calculate if order can be cancelled (within 10 minutes of creation and not delivered/paid/cancelled)
	const canCancelOrder = () => {
		if (!order || !order.createdAt) return false;
		if (order.isDelivered || order.isPaid || order.status === 'cancelled' || order.status === 'delivered') return false;

		const orderTime = new Date(order.createdAt).getTime();
		const currentTime = new Date().getTime();
		const timeDiffMinutes = (currentTime - orderTime) / (1000 * 60);

		return timeDiffMinutes <= 10;
	};

	// Handle order cancellation
	const handleCancelOrder = async () => {
		try {
			setCancelling(true);
			const orderId = order._id;

			if (!orderId) {
				addToast('Order ID not found', { appearance: 'error', autoDismiss: true });
				return;
			}

			if (!confirm('Are you sure you want to cancel this order?')) {
				setCancelling(false);
				return;
			}

			const response = await Orders.cancelOrder(orderId);

			if (response?.success) {
				addToast('Order cancelled successfully', { appearance: 'success', autoDismiss: true });
				// Update the order status in the UI
				setOrder({ ...order, status: 'cancelled' });

				// Option: redirect to my-account page after a short delay
				setTimeout(() => {
					router.push('/my-account');
				}, 2000);
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
			setCancelling(false);
		}
	};

	return (
		<>
			{loading ? (
				<div className="text-center py-5">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading order details...</span>
					</div>
					<p className="mt-2">Loading order details...</p>
				</div>
			) : (
				<>
					<Row>
						<Col>
							<Card style={{ marginTop: '20px' }}>
								<Card.Header>Order Details</Card.Header>
								<Card.Body>
									<Table responsive>
										<thead>
											<tr>
												<th>Products</th>
											</tr>
										</thead>
										<tbody>
											{orderItems && orderItems.length > 0 ? (
												orderItems.map((item: any, index: number) => (
													<tr key={item._id || item.productId || index}>
														<td>
															<div className='itemTitle' style={{ display: 'flex', alignItems: 'center' }}>
																<Image
																	height={50}
																	width={50}
																	roundedCircle={true}
																	src={getProductImage(item)}
																	alt=''
																	onError={(e: any) => {
																		console.log("Image error, using fallback");
																		e.currentTarget.onerror = null;
																		e.currentTarget.src = DEFAULT_IMAGE_URL;
																	}}
																/>
																<div style={{ marginLeft: '15px' }}>
																	<Link href={`/products/${item.productId}`} legacyBehavior>
																		<a style={{ textDecoration: 'none', fontWeight: 'bold' }}>
																			{getProductName(item)}
																		</a>
																	</Link>
																	<p style={{ marginTop: '5px', fontWeight: 'bold' }}>
																		{item.quantity} X {CURRENCY_SYMBOL}{item.price}
																	</p>
																</div>
															</div>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={1} className="text-center">No items found in this order</td>
												</tr>
											)}
										</tbody>
									</Table>
								</Card.Body>
							</Card>
						</Col>
					</Row>
					<Row>
						<Col>
							<Card style={{ marginTop: '20px' }}>
								<Card.Header>
									<Card.Title>
										Total Amount: {CURRENCY_SYMBOL}{totalPrice}
									</Card.Title>
								</Card.Header>
								<Card.Body>
									<ListGroup className='list-group-flush'>
										<ListGroup.Item>
											Order Date & Time: {orderDate}
										</ListGroup.Item>
										<ListGroup.Item>
											Payment Method: {paymentMethod.toUpperCase()}
										</ListGroup.Item>
										<ListGroup.Item>
											Order Status: <Badge bg={orderStatus === 'pending' ? 'warning' : orderStatus === 'cancelled' ? 'danger' : 'success'}>{orderStatus.toUpperCase()}</Badge>
										</ListGroup.Item>
										{shippingAddress && Object.keys(shippingAddress).length > 0 && (
											<ListGroup.Item>
												<h5>Shipping Address</h5>
												{shippingAddress.address && <p>Address: {shippingAddress.address}</p>}
												{shippingAddress.city && <p>City: {shippingAddress.city}</p>}
												{shippingAddress.postalCode && <p>Postal Code: {shippingAddress.postalCode}</p>}
												{shippingAddress.country && <p>Country: {shippingAddress.country}</p>}
											</ListGroup.Item>
										)}
										{canCancelOrder() && (
											<ListGroup.Item className="text-center py-3">
												<Button
													variant="danger"
													disabled={cancelling}
													onClick={handleCancelOrder}
												>
													{cancelling ? 'Cancelling...' : 'Cancel Order'}
												</Button>
												<p className="text-muted mt-2 small">
													* You can only cancel orders within 10 minutes of placing them and before they are paid or shipped.
												</p>
											</ListGroup.Item>
										)}
									</ListGroup>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</>
			)}
		</>
	);
};

export const getServerSideProps: GetServerSideProps<OrderProps> = async (
	context
): Promise<any> => {
	try {
		if (!context.params?.id) {
			return {
				props: {
					order: {},
				},
			};
		}

		// We'll let the client-side code handle the fetching for better error handling
		return {
			props: {
				order: {}, // Empty order to be filled by client-side fetching
			},
		};
	} catch (error) {
		console.error('Error in getServerSideProps:', error);
		return {
			props: {
				order: {},
			},
		};
	}
};

export default Order;
