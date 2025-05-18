// api skull with axios
import axios, { AxiosResponse, AxiosRequestHeaders } from 'axios';
// allow headers in axios instanse

// interface for response data
export interface resposnePayload {
	success: boolean;
	message: string;
	result?: any;
	orders?: any[];
	order?: any; // Add order property for single order responses
	product?: any; // Add product property for product responses
	user?: any; // Add user property for user profile responses
}

// get base url fro API calls
export const getBaseUrl = (): string => {
	if (typeof window === 'undefined') {
		return '';
	}
	// Return empty string since Next.js handles API routing
	return '';
};

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 seconds timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Set auth token from localStorage if it exists
if (typeof window !== 'undefined') {
	const token = localStorage.getItem('_digi_auth_token');
	if (token) {
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		console.log('Auth token found and set in default headers');
	}
}

const responseBody = (response: AxiosResponse) => response.data;

// Helper function to add auth header to requests
const getAuthHeader = (): Record<string, string> => {
	const token = localStorage.getItem('_digi_auth_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
};

const requests = {
	get: (url: string) => {
		const fullUrl = `${getBaseUrl()}${url}`;
		console.log('GET request to:', fullUrl);
		return axios.get(fullUrl, {
			withCredentials: true,
			headers: getAuthHeader() as AxiosRequestHeaders
		})
			.then(responseBody)
			.catch(error => {
				console.error('GET request error:', error.message);
				throw error;
			});
	},
	post: (url: string, body: {}) => {
		const fullUrl = `${getBaseUrl()}${url}`;
		console.log('POST request to:', fullUrl, 'with body:', body);
		return axios.post(fullUrl, body, {
			withCredentials: true,
			headers: getAuthHeader() as AxiosRequestHeaders
		})
			.then(response => {
				console.log('POST response:', response.status, response.statusText);
				return responseBody(response);
			})
			.catch(error => {
				console.error('POST request error:', error.message, error.response?.data);
				throw error;
			});
	},
	put: (url: string, body: {}) => {
		const fullUrl = `${getBaseUrl()}${url}`;
		console.log('PUT request to:', fullUrl);
		return axios.put(fullUrl, body, {
			withCredentials: true,
			headers: getAuthHeader() as AxiosRequestHeaders
		})
			.then(responseBody)
			.catch(error => {
				console.error('PUT request error:', error.message);
				throw error;
			});
	},
	patch: (url: string, body: {}) => {
		const fullUrl = `${getBaseUrl()}${url}`;
		console.log('PATCH request to:', fullUrl);
		return axios.patch(fullUrl, body, {
			withCredentials: true,
			headers: getAuthHeader() as AxiosRequestHeaders
		})
			.then(responseBody)
			.catch(error => {
				console.error('PATCH request error:', error.message);
				throw error;
			});
	},
	delete: (url: string, options?: any) => {
		const fullUrl = `${getBaseUrl()}${url}`;
		console.log('DELETE request to:', fullUrl, options ? `with options: ${JSON.stringify(options)}` : '');

		// Pass the options to axios for DELETE requests with a body
		return axios.delete(fullUrl, {
			withCredentials: true,
			headers: getAuthHeader() as AxiosRequestHeaders,
			...options
		})
			.then(responseBody)
			.catch(error => {
				console.error('DELETE request error:', error.message);
				throw error;
			});
	},
};
export default requests;
