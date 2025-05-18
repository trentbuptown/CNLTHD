import requests, { resposnePayload } from './api';
import queryString from 'query-string';

// create product service
export const Products = {
	// get products for customer
	getProducts: async (
		filter: Record<string, any>,
		serverSide: boolean = false
	): Promise<resposnePayload> => {
		const url = queryString.stringifyUrl({
			url: '/api/products',
			query: filter,
		});
		console.log('Product URL:', url);
		const getProductRes = await requests.get(url);
		return getProductRes;
	},
	// get product details
	getProduct: async (id: string): Promise<resposnePayload> => {
		const getProductRes = await requests.get('/api/products/' + id);
		return getProductRes;
	},
	// save product details
	saveProduct: async (
		product: Record<string, any>
	): Promise<resposnePayload> => {
		const saveProductRes = await requests.post('/api/products', product);
		return saveProductRes;
	},
	// update product details
	updateProduct: async (
		id: string,
		product: Record<string, any>
	): Promise<resposnePayload> => {
		const updateProductRes = await requests.put('/api/products/' + id, product);
		return updateProductRes;
	},

	// delete product details
	deleteProduct: async (id: string): Promise<resposnePayload> => {
		const deleteProductRes = await requests.delete('/api/products/' + id);
		return deleteProductRes;
	},

	// upload product image
	uploadProductImage: async (
		id: string,
		image: any
	): Promise<resposnePayload> => {
		const uploadProductImageRes = await requests.post(
			'/api/products/' + id + '/image',
			image
		);
		return uploadProductImageRes;
	},

	// add sku details for an product
	addSku: async (
		productId: string,
		sku: Record<string, any>
	): Promise<resposnePayload> => {
		const addSkuRes = await requests.post(
			'/api/products/' + productId + '/skus',
			sku
		);
		return addSkuRes;
	},

	// update sku details for an product
	updateSku: async (
		productId: string,
		skuId: string,
		sku: Record<string, any>
	): Promise<resposnePayload> => {
		const updateSkuRes = await requests.put(
			'/api/products/' + productId + '/skus/' + skuId,
			sku
		);
		return updateSkuRes;
	},

	// delete sku details for an product
	deleteSku: async (
		productId: string,
		skuId: string
	): Promise<resposnePayload> => {
		const deleteSkuRes = await requests.delete(
			'/api/products/' + productId + '/skus/' + skuId
		);
		return deleteSkuRes;
	},

	// get all licenses for a product SKU
	getLicenses: async (
		productId: string,
		skuId: string
	): Promise<resposnePayload> => {
		const getLicensesRes = await requests.get(
			'/api/products/' + productId + '/skus/' + skuId + '/licenses'
		);
		return getLicensesRes;
	},

	// add license for a product SKU
	addLicense: async (
		productId: string,
		skuId: string,
		license: Record<string, any>
	): Promise<resposnePayload> => {
		const addLicenseRes = await requests.post(
			'/api/products/' + productId + '/skus/' + skuId + '/licenses',
			license
		);
		return addLicenseRes;
	},

	// update license for a product SKU
	updateLicense: async (
		productId: string,
		skuId: string,
		licenseId: string,
		license: Record<string, any>
	): Promise<resposnePayload> => {
		const updateLicenseRes = await requests.put(
			'/api/products/' + productId + '/skus/' + skuId + '/licenses/' + licenseId,
			license
		);
		return updateLicenseRes;
	},

	// delete license for a product SKU
	deleteLicense: async (licenseId: string): Promise<resposnePayload> => {
		const deleteLicenseRes = await requests.delete(
			'/api/products/licenses/' + licenseId
		);
		return deleteLicenseRes;
	},

	// get product reviews
	getProductReviews: async (productId: string): Promise<resposnePayload> => {
		const getReviewsRes = await requests.get(`/api/products/${productId}/reviews`);
		return getReviewsRes;
	},

	// add review for a product
	addReview: async (
		productId: string,
		reviewData: Record<string, any>
	): Promise<resposnePayload> => {
		const addReviewRes = await requests.post(
			`/api/products/${productId}/reviews`,
			reviewData
		);
		return addReviewRes;
	},

	// update product review
	updateReview: async (
		productId: string,
		reviewId: string,
		reviewData: Record<string, any>
	): Promise<resposnePayload> => {
		const updateReviewRes = await requests.put(
			`/api/products/${productId}/reviews/${reviewId}`,
			reviewData
		);
		return updateReviewRes;
	},

	// delete product review
	deleteReview: async (
		productId: string,
		reviewId: string,
		userData?: Record<string, any>
	): Promise<resposnePayload> => {
		const deleteReviewRes = await requests.delete(
			`/api/products/${productId}/reviews/${reviewId}`,
			{ data: userData }
		);
		return deleteReviewRes;
	},
};
