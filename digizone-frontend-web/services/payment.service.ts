import requests, { resposnePayload } from './api';
import { getBaseUrl } from './api';

// Extend the response payload to include VNPAY specific properties
export interface VNPayResponsePayload extends resposnePayload {
    paymentSuccess?: boolean;
    orderId?: string;
    amount?: number;
    responseCode?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface PaymentResponse {
    success: boolean;
    paymentUrl?: string;
    message?: string;
    orderId?: string;
    transactionId?: string;
    was3DS?: boolean;     // Indicates if 3D Secure authentication was used
    errorCode?: string;   // Error code for failed payments
    wasTemp?: boolean;    // Indicates if this was a temporary payment before order creation
}

export interface CardDetails {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
}

export const paymentMethods: PaymentMethod[] = [
    {
        id: 'vnpay',
        name: 'VNPAY',
        description: 'Pay with local bank cards, international cards, and e-wallets',
        icon: '/images/payment/vnpay-logo.png'
    },
    {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive the package',
        icon: '/images/payment/cod-icon.png'
    }
];

export const Payments = {
    // Create a VNPAY payment
    createVnpayPayment: async (
        orderId: string,
        amount: number,
        orderInfo: string,
        ipAddr?: string
    ): Promise<PaymentResponse> => {
        try {
            const baseUrl = getBaseUrl();
            const response = await requests.post('/api/payments/vnpay/create', {
                orderId,
                amount,
                orderInfo,
                ipAddr
            });

            return {
                success: response.success,
                paymentUrl: response.paymentUrl,
                message: response.message
            };
        } catch (error) {
            console.error('Error creating VNPAY payment:', error);
            return {
                success: false,
                message: 'Failed to create VNPAY payment'
            };
        }
    },

    // Process payment before creating an order (prevents creating orders for failed payments)
    processPaymentBeforeOrder: async (
        amount: number,
        cardDetails: CardDetails,
        customerInfo: any
    ): Promise<PaymentResponse> => {
        try {
            // Generate a temporary ID for the payment that will be replaced later
            const tempId = `temp_${Date.now()}`;

            const response = await requests.post('/api/payments/vnpay/direct', {
                tempId: true, // Flag to indicate this is a pre-order payment
                amount,
                cardDetails,
                customerInfo
            });

            return {
                success: response.success,
                message: response.message,
                transactionId: response.transactionId,
                wasTemp: true,
                was3DS: response.was3DS,
                errorCode: response.errorCode
            };
        } catch (error) {
            console.error('Error processing payment:', error);
            return {
                success: false,
                message: 'Failed to process payment'
            };
        }
    },

    // Link a previously created payment to an order
    linkPaymentToOrder: async (
        transactionId: string,
        orderId: string,
        paymentStatus?: string
    ): Promise<PaymentResponse> => {
        try {
            const response = await requests.post('/api/payments/link', {
                transactionId,
                orderId,
                paymentStatus // Add payment status to ensure it's properly set
            });

            return {
                success: response.success,
                message: response.message
            };
        } catch (error) {
            console.error('Error linking payment to order:', error);
            return {
                success: false,
                message: 'Failed to link payment to order'
            };
        }
    },

    // Process VNPAY payment directly without redirect
    processDirectVnpayPayment: async (
        orderId: string,
        amount: number,
        cardDetails: CardDetails
    ): Promise<PaymentResponse> => {
        try {
            const response = await requests.post('/api/payments/vnpay/direct', {
                orderId,
                amount,
                cardDetails
            });

            return {
                success: response.success,
                message: response.message,
                orderId: response.orderId,
                transactionId: response.transactionId,
                was3DS: response.was3DS,
                errorCode: response.errorCode
            };
        } catch (error) {
            console.error('Error processing direct VNPAY payment:', error);
            return {
                success: false,
                message: 'Failed to process VNPAY payment'
            };
        }
    },

    // Create a COD payment
    createCodPayment: async (
        orderId: string,
        amount: number,
        customerInfo: any
    ): Promise<PaymentResponse> => {
        try {
            const response = await requests.post('/api/payments/cod/create', {
                orderId,
                amount,
                customerInfo
            });

            return {
                success: response.success,
                message: response.message,
                orderId: response.orderId
            };
        } catch (error) {
            console.error('Error creating COD payment:', error);
            return {
                success: false,
                message: 'Failed to create COD payment'
            };
        }
    },

    // Verify a VNPAY payment return
    verifyVnpayReturn: async (queryParams: any): Promise<VNPayResponsePayload> => {
        try {
            const urlParams = new URLSearchParams(queryParams).toString();
            const response = await requests.get(`/api/payments/vnpay/return?${urlParams}`);
            return response as VNPayResponsePayload;
        } catch (error) {
            console.error('Error verifying VNPAY payment:', error);
            return {
                success: false,
                message: 'Failed to verify VNPAY payment'
            };
        }
    }
}; 