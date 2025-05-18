import type { GetServerSideProps, NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import styles from '../styles/Home.module.css';
import StarRatingComponent from 'react-star-rating-component';
import Router from 'next/router';
import axios from 'axios';
import ProductItem from '../components/Products/ProductItem';
import { getBaseUrl } from '../services/api';

interface Props {
	products: Record<string, any>;
}

const Home: NextPage<Props> = ({ products: serverProducts }) => {
	const [products, setProducts] = useState<any>({
		latestProducts: [],
		topSoldProducts: []
	});

	useEffect(() => {
		// First try to use server-provided products
		if (serverProducts && (serverProducts.latestProducts?.length || serverProducts.topSoldProducts?.length)) {
			setProducts(serverProducts);
		} else {
			// If server products aren't available, fetch from client-side
			fetchProducts();
		}
	}, [serverProducts]);

	const fetchProducts = async () => {
		try {
			const baseUrl = getBaseUrl();
			// Get latest products
			const latestResponse = await axios.get(`${baseUrl}/api/products?limit=4&sort=-createdAt`);

			// Get top rated products with 5 star rating
			const topRatedResponse = await axios.get(`${baseUrl}/api/products?limit=4&sort=-avgRating`);

			let latestProducts = [];
			let topRatedProducts = [];

			if (latestResponse.data && latestResponse.data.success) {
				latestProducts = latestResponse.data.products || [];
			}

			if (topRatedResponse.data && topRatedResponse.data.success) {
				// Filter for products with rating 5 or close to 5
				topRatedProducts = topRatedResponse.data.products.filter((product: any) =>
					product.avgRating >= 4.5
				) || [];

				// If not enough 5-star products, just use the highest rated ones
				if (topRatedProducts.length < 4) {
					topRatedProducts = topRatedResponse.data.products.slice(0, 4);
				}
			}

			setProducts({
				latestProducts,
				topSoldProducts: topRatedProducts,
			});
		} catch (error) {
			console.error('Error fetching products for homepage:', error);
		}
	};

	return (
		<>
			<h3 className={styles.productCats}>Latest Products</h3>
			<Row xs={1} md={4} className='g-4'>
				{products.latestProducts && products.latestProducts.length > 0 ? (
					products.latestProducts.map(
						(product: any, index: React.Key | null | undefined) => (
							<ProductItem
								product={product}
								userType={'customer'}
								key={index}
							/>
						)
					)
				) : (
					<Col className="text-center">
						<p>No products available</p>
					</Col>
				)}
			</Row>
			<hr />
			<h3 className={styles.productCats}>Top Products</h3>
			<Row xs={1} md={4} className='g-4'>
				{products.topSoldProducts && products.topSoldProducts.length > 0 ? (
					products.topSoldProducts.map(
						(product: any, index: React.Key | null | undefined) => (
							<ProductItem
								product={product}
								userType={'customer'}
								key={index}
							/>
						)
					)
				) : (
					<Col className="text-center">
						<p>No products available</p>
					</Col>
				)}
			</Row>
			<Row>
				<Col>
					<Button
						variant='primary'
						className={styles.viewMoreBtn}
						onClick={() => Router.push('/products')}
					>
						View More
					</Button>
				</Col>
			</Row>
		</>
	);
};

export const getServerSideProps: GetServerSideProps<Props> = async (
	context
): Promise<any> => {
	try {
		const baseUrl = process.env.NODE_ENV !== 'production'
			? process.env.NEXT_PUBLIC_BASE_API_URL_LOCAL || 'http://localhost:3000'
			: process.env.NEXT_PUBLIC_BASE_API_URL;

		// Fetch latest products
		const latestProductsUrl = `${baseUrl}/products?limit=4&sort=-createdAt`;
		console.log('Fetching latest products from:', latestProductsUrl);
		const latestResponse = await axios.get(latestProductsUrl);

		// Fetch top rated products
		const topRatedUrl = `${baseUrl}/products?limit=4&sort=-avgRating`;
		console.log('Fetching top rated products from:', topRatedUrl);
		const topRatedResponse = await axios.get(topRatedUrl);

		let products = { latestProducts: [], topSoldProducts: [] };

		if (latestResponse.data && latestResponse.data.success) {
			products.latestProducts = latestResponse.data.products || [];
		}

		if (topRatedResponse.data && topRatedResponse.data.success) {
			// Filter for products with rating 5 or close to 5
			let topRatedProducts = topRatedResponse.data.products.filter((product: any) =>
				product.avgRating >= 4.5
			) || [];

			// If not enough 5-star products, just use the highest rated ones
			if (topRatedProducts.length < 4) {
				topRatedProducts = topRatedResponse.data.products.slice(0, 4);
			}

			products.topSoldProducts = topRatedProducts;
		}

		return {
			props: {
				products
			},
		};
	} catch (error) {
		console.log('Error fetching products on server:', error);
		return {
			props: {
				products: {
					latestProducts: [],
					topSoldProducts: []
				}
			}
		};
	}
};

export default Home;
