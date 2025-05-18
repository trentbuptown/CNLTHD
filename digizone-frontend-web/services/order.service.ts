import requests, { resposnePayload } from './api';
import queryString from 'query-string';
// create order service
export const Orders = {
	// checkout session for order
	checkoutSession: async (
		cartItems: Record<string, any>
	): Promise<resposnePayload> => {
		const checkoutSessionRes = await requests.post('/api/orders/checkout', {
			checkoutDetails: cartItems,
		});
		return checkoutSessionRes;
	},

	// submit order after checkout
	submitOrder: async (
		orderData: Record<string, any>
	): Promise<resposnePayload> => {
		try {
			const submitOrderRes = await requests.post('/api/orders', orderData);
			// Log the structure of the response to understand what fields are available
			console.log('Order submission response structure:', JSON.stringify(submitOrderRes, null, 2));
			return submitOrderRes;
		} catch (error) {
			console.error('Order submission error:', error);
			throw error;
		}
	},

	// find all orders (admin only)
	getAllOrders: async (status?: string): Promise<resposnePayload> => {
		const findOrderRes = await requests.get(
			status ? `/api/orders?status=${status}` : `/api/orders`
		);
		return findOrderRes;
	},

	// get orders for current user
	getUserOrders: async (userId: string, status?: string): Promise<resposnePayload> => {
		const url = status
			? `/api/orders/user/${userId}?status=${status}`
			: `/api/orders/user/${userId}`;
		const userOrdersRes = await requests.get(url);
		return userOrdersRes;
	},

	// get an order
	getOrder: async (orderId: string): Promise<resposnePayload> => {
		const getOrderRes = await requests.get(`/api/orders/${orderId}`);
		return getOrderRes;
	},

	// update order status (admin only)
	updateOrderStatus: async (orderId: string, status: string): Promise<resposnePayload> => {
		const updateStatusRes = await requests.put(`/api/orders/${orderId}/status`, { status });
		return updateStatusRes;
	},

	// delete order (admin only)
	deleteOrder: async (orderId: string): Promise<resposnePayload> => {
		try {
			const deleteOrderRes = await requests.delete(`/api/orders/${orderId}`);
			return deleteOrderRes;
		} catch (error) {
			console.error('Error deleting order:', error);
			throw error;
		}
	},

	// cancel order (user can cancel within 10 minutes of order creation)
	cancelOrder: async (orderId: string): Promise<resposnePayload> => {
		try {
			const cancelOrderRes = await requests.put(`/api/orders/${orderId}/cancel`, {});
			return cancelOrderRes;
		} catch (error) {
			console.error('Error cancelling order:', error);
			throw error;
		}
	}
};
