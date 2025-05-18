import type { GetServerSideProps, NextPage } from 'next';
import {
	Badge,
	Button,
	Card,
	Col,
	Dropdown,
	DropdownButton,
	Form,
	Nav,
} from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import StarRatingComponent from 'react-star-rating-component';
import NumericInput from 'react-numeric-input';
import { BagCheckFill, PersonFill } from 'react-bootstrap-icons';
import { Tab } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import React, { useContext, useState, useEffect } from 'react';
import CartOffCanvas from '../../components/CartOffCanvas';
import axios from 'axios';
import SkuDetailsList from '../../components/Product/SkuDetailsList';
import { getFormatedStringFromDays } from '../../helper/utils';
import ProductItem from '../../components/Products/ProductItem';
import { Context } from '../../context';
import ReviewSection from '../../components/Product/ReviewSection';
import { CURRENCY_SYMBOL, DEFAULT_IMAGE_URL } from '../../helper/settings';
import { useRouter } from 'next/router';

interface ProductProps {
	product: Record<string, any>;
	relatedProducts: Record<string, any>[];
}

const Product: NextPage<ProductProps> = ({ product, relatedProducts }) => {
	const router = useRouter();
	const [show, setShow] = useState(false);
	const [allSkuDetails, setAllSkuDetails] = React.useState(
		product?.skuDetails || []
	);

	const [displaySku, setDisplaySku] = React.useState(() => {
		if (product?.skuDetails && Array.isArray(product.skuDetails) && product.skuDetails.length > 0) {
			return product.skuDetails.sort(
				(a: { price: number }, b: { price: number }) => a.price - b.price
			)[0] || {};
		} else {
			return {
				_id: product?._id ? `${product._id}_default` : 'default',
				price: product?.price || 0,
				validity: 365,
				lifetime: false
			};
		}
	});

	const [quantity, setQuantity] = useState(1);

	const {
		cartItems,
		cartDispatch,
		state: { user },
	} = useContext(Context);

	// Reset product state when the product ID changes (when navigating between products)
	useEffect(() => {
		// This will run whenever the product data or router query changes
		if (product?._id) {
			console.log("Product changed to:", product?._id);

			// Reset quantity to 1
			setQuantity(1);

			// Reset the display SKU to the first SKU for the new product
			if (product?.skuDetails && Array.isArray(product.skuDetails) && product.skuDetails.length > 0) {
				const newDisplaySku = product.skuDetails.sort(
					(a: { price: number }, b: { price: number }) => a.price - b.price
				)[0] || {};
				setDisplaySku(newDisplaySku);
			} else {
				setDisplaySku({
					_id: product?._id ? `${product._id}_default` : 'default',
					price: product?.price || 0,
					validity: 365,
					lifetime: false
				});
			}

			// Update SKU details
			setAllSkuDetails(product?.skuDetails || []);
		}
	}, [product?._id]);

	// Handle cart action
	const handleCart = () => {
		cartDispatch({
			type: cartItems.find(
				(item: { skuId: string }) => item.skuId === displaySku._id
			)
				? 'UPDATE_CART'
				: 'ADD_TO_CART',
			payload: {
				skuId: displaySku._id,
				quantity: quantity,
				validity: displaySku.lifetime ? 0 : displaySku.validity,
				lifetime: displaySku.lifetime,
				price: displaySku.price,
				productName: product.productName || product.name,
				productImage: product.image || product.imageUrl,
				productId: product._id,
				skuPriceId: displaySku.stripePriceId,
			},
		});
		setShow(true);
	};

	// Get product name with fallback
	const getProductName = () => {
		return product?.productName || product?.name || 'Product Details';
	};

	// Check if the current product's SKU is in the cart
	const isInCart = () => {
		return cartItems && Array.isArray(cartItems) && cartItems.find((item: any) => item.skuId === displaySku._id);
	};

	const getProductImage = (product: Record<string, any> | undefined) => {
		// More robust fallback handling for product image
		if (product?.image && product.image.startsWith('http')) {
			return product.image;
		}
		if (product?.imageUrl && product.imageUrl.startsWith('http')) {
			return product.imageUrl;
		}
		// Check for relative URLs
		if (product?.image && !product.image.startsWith('http')) {
			const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || '';
			return `${baseUrl}${product.image}`;
		}
		if (product?.imageUrl && !product.imageUrl.startsWith('http')) {
			const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || '';
			return `${baseUrl}${product.imageUrl}`;
		}
		// Final fallback
		return 'https://via.placeholder.com/300?text=No+Image';
	};

	useEffect(() => {
		// Log product data for debugging
		console.log('Product data:', product);
	}, [product]);

	return (
		<>
			<Row className='firstRow'>
				<Col sm={4}>
					<Card className='productImgCard'>
						<Card.Img variant='top' src={getProductImage(product)} onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = 'https://via.placeholder.com/300?text=Image+Error';
						}} />
					</Card>
				</Col>
				<Col sm={8}>
					<h2>{getProductName()}</h2>
					<div className='divStar'>
						<StarRatingComponent
							name='rate2'
							editing={false}
							starCount={5}
							value={product?.avgRating || 0}
						/>
						({product?.feedbackDetails?.length || 0} reviews)
					</div>
					<p className='productPrice'>
						{/* {product?.skuDetails && product?.skuDetails?.length > 1
							? `₹${Math.min.apply(
									Math,
									product?.skuDetails.map((sku: { price: number }) => sku.price)
							  )} - ₹${Math.max.apply(
									Math,
									product?.skuDetails.map((sku: { price: number }) => sku.price)
							  )}`
							: `₹${product?.skuDetails?.[0]?.price || '000'}`}{' '} */}
						{CURRENCY_SYMBOL}{displaySku?.price || '000'}
					</p>
					<ul>
						{product?.highlights &&
							product?.highlights.length > 0 &&
							product?.highlights.map((highlight: string, key: any) => (
								<li key={key}>{highlight}</li>
							))}
					</ul>

					<div className='productSkuZone'>
						<NumericInput
							min={1}
							max={5}
							value={quantity}
							size={5}
							onChange={(value) => setQuantity(Number(value))}
							disabled={!displaySku?.price}
						/>
						{/* <Form.Select
							aria-label='Default select example'
							className='selectValidity'
						>
							<option>Select validity</option>
							<option value='1'>One</option>
							<option value='2'>Two</option>
							<option value='3'>Three</option>
						</Form.Select> */}
						{/* {user?.type !== 'admin' && ( */}
						<Button
							variant='primary'
							className='cartBtn'
							onClick={handleCart}
							disabled={!displaySku?.price || displaySku.price <= 0}
						>
							<BagCheckFill className='cartIcon' />
							{isInCart()
								? 'Update cart'
								: 'Add to cart'} - {CURRENCY_SYMBOL}{displaySku?.price || '0'}
						</Button>
						{/* )} */}
					</div>
				</Col>
			</Row>
			<br />
			<hr />
			<Row>
				<Tab.Container id='left-tabs-example' defaultActiveKey='first'>
					<Row>
						<Col sm={3}>
							<Nav variant='pills' className='flex-column'>
								<Nav.Item>
									<Nav.Link eventKey='first' href='#'>
										Descriptions
									</Nav.Link>
								</Nav.Item>
								{product?.requirmentSpecification &&
									product?.requirmentSpecification.length > 0 && (
										<Nav.Item>
											<Nav.Link eventKey='second' href='#'>
												Requirements
											</Nav.Link>
										</Nav.Item>
									)}

								<Nav.Item>
									<Nav.Link eventKey='third' href='#'>
										Reviews
									</Nav.Link>
								</Nav.Item>
								{user?.type === 'admin' && (
									<Nav.Item>
										<Nav.Link eventKey='fourth' href='#'>
											Product SKUs
										</Nav.Link>
									</Nav.Item>
								)}
							</Nav>
						</Col>
						<Col sm={9}>
							<Tab.Content>
								<Tab.Pane eventKey='first'>
									{product?.description} <br />
									<a
										target='_blank'
										href={product?.productUrl}
										rel='noreferrer'
										style={{ textDecoration: 'none', float: 'right' }}
									>
										Get more info....
									</a>
									<br />
									<br />
									<a
										className='btn btn-primary text-center'
										target='_blank'
										href={product?.downloadUrl}
										rel='noreferrer'
										style={{ textDecoration: 'none', float: 'right' }}
									>
										Download this
									</a>
								</Tab.Pane>
								<Tab.Pane eventKey='second'>
									<Table responsive>
										<tbody>
											{product?.requirmentSpecification &&
												product?.requirmentSpecification.length > 0 &&
												product?.requirmentSpecification.map(
													(requirement: string, key: any) => (
														<tr key={key}>
															<td width='30%'>
																{Object.keys(requirement)[0]}{' '}
															</td>
															<td width='70%'>
																{Object.values(requirement)[0]}
															</td>
														</tr>
													)
												)}
										</tbody>
									</Table>
								</Tab.Pane>
								<Tab.Pane eventKey='third'>
									<ReviewSection
										reviews={product.feedbackDetails || []}
										productId={product._id}
									/>
								</Tab.Pane>
								<Tab.Pane eventKey='fourth'>
									<SkuDetailsList
										skuDetails={allSkuDetails}
										productId={product._id}
										setAllSkuDetails={setAllSkuDetails}
									/>
								</Tab.Pane>
							</Tab.Content>
						</Col>
					</Row>
				</Tab.Container>
			</Row>
			<br />
			<div className='separator'>Related Products</div>
			<br />
			<Row xs={1} md={4} className='g-3'>
				{relatedProducts.map((relatedProduct) => (
					<Col key={relatedProduct._id}>
						<ProductItem product={relatedProduct} userType={'customer'} />
					</Col>
				))}
			</Row>
			<CartOffCanvas setShow={setShow} show={show} />
		</>
	);
};

export const getServerSideProps: GetServerSideProps<ProductProps> = async (
	context
): Promise<any> => {
	try {
		if (!context.params?.id) {
			return {
				props: {
					product: {},
					relatedProducts: []
				},
			};
		}

		// Construct the API URL for product details
		const baseUrl = process.env.NODE_ENV !== 'production'
			? process.env.NEXT_PUBLIC_BASE_API_URL_LOCAL || 'http://localhost:3000/api'
			: process.env.NEXT_PUBLIC_BASE_API_URL;

		const productId = context.params.id;
		console.log(`Fetching product details for ID: ${productId} from ${baseUrl}/products/${productId}`);

		// Add error interceptor for debugging
		axios.interceptors.response.use(
			response => response,
			error => {
				console.log('Axios error intercepted:', error.message);
				if (error.response) {
					console.log('Response status:', error.response.status);
					console.log('Response data:', error.response.data);
				}
				return Promise.reject(error);
			}
		);

		try {
			const { data } = await axios.get(`${baseUrl}/products/${productId}`);
			console.log('API response received:', JSON.stringify(data).substring(0, 300) + '...');

			if (!data || !data.success) {
				console.log("API returned unsuccessful response:", data);
				return { props: { product: {}, relatedProducts: [] } };
			}

			// Extract product data with proper fallback handling
			const productData = data.product || (data.result && data.result.product) || {};
			console.log('Product data extracted:', JSON.stringify(productData).substring(0, 300) + '...');

			// Ensure skuDetails is properly handled
			if (!productData.skuDetails || !Array.isArray(productData.skuDetails) || productData.skuDetails.length === 0) {
				productData.skuDetails = [{
					_id: productData._id + '_default',
					price: productData.price || 0,
					validity: 365,
					lifetime: false
				}];
			}

			// Ensure image field exists
			if (!productData.image && productData.imageUrl) {
				productData.image = productData.imageUrl;
			} else if (!productData.image) {
				productData.image = 'https://via.placeholder.com/300?text=No+Image';
			}

			return {
				props: {
					product: productData,
					relatedProducts: data?.result?.relatedProducts || [],
				},
			};
		} catch (axiosError) {
			console.log("Network error fetching product:", axiosError);
			throw axiosError;
		}
	} catch (error: any) {
		console.log("Error fetching product details:", error);
		return {
			props: {
				product: {},
				relatedProducts: []
			},
		};
	}
};

export default Product;
