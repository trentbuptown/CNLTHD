import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { FC } from 'react';
import { Button, Card, Col, Badge } from 'react-bootstrap';
import { Eye, Pen, Trash, Upload } from 'react-bootstrap-icons';
import StarRatingComponent from 'react-star-rating-component';
import { useToasts } from 'react-toast-notifications';
import { isArray } from 'util';
import { getFormatedStringFromDays } from '../../helper/utils';
import { Products } from '../../services/product.service';
import axios from 'axios';
import { getBaseUrl } from '../../services/api';
import { CURRENCY_SYMBOL } from '../../helper/settings';

interface IProductItemProps {
	userType: string;
	product: Record<string, any>;
}

const ProductItem: FC<IProductItemProps> = ({ userType, product }) => {
	const { addToast } = useToasts();
	const [isLoading, setIsLoading] = React.useState(false);
	const [uploading, setUploading] = React.useState(false);
	const router = useRouter();

	const deleteProduct = async () => {
		try {
			setIsLoading(true);
			const deleteConfirm = confirm(
				'Want to delete? You will lose all details for this product'
			);
			if (deleteConfirm) {
				const baseUrl = getBaseUrl();
				const response = await axios.delete(`${baseUrl}/api/products/${product._id}`);

				if (response.data && response.data.success) {
					addToast('Product deleted successfully', {
						appearance: 'success',
						autoDismiss: true,
					});

					// Refresh the current page
					window.location.reload();
				} else {
					throw new Error('Failed to delete product');
				}
			}
		} catch (error: any) {
			console.error('Error deleting product:', error);
			addToast('Failed to delete product', {
				appearance: 'error',
				autoDismiss: true
			});
		} finally {
			setIsLoading(false);
		}
	};

	const uploadProductImage = async (e: any) => {
		try {
			setUploading(true);
			const file = e.target.files[0];
			const formData = new FormData();
			formData.append('productImage', file);

			const baseUrl = getBaseUrl();
			const response = await axios.post(
				`${baseUrl}/api/products/${product._id}/image`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);

			if (response.data && response.data.success) {
				addToast('Image uploaded successfully', {
					appearance: 'success',
					autoDismiss: true,
				});
				// Refresh the page to show the new image
				window.location.reload();
			} else {
				throw new Error('Failed to upload image');
			}
		} catch (error: any) {
			console.error('Error uploading image:', error);
			addToast('Failed to upload image', {
				appearance: 'error',
				autoDismiss: true,
			});
		} finally {
			setUploading(false);
		}
	};

	// Handle different product data formats
	const getProductName = () => {
		return product.name || product.productName || 'Unnamed Product';
	};

	const getProductImage = () => {
		// More robust fallback handling
		if (product.image && product.image.startsWith('http')) {
			return product.image;
		}
		if (product.imageUrl && product.imageUrl.startsWith('http')) {
			return product.imageUrl;
		}
		// Check for relative URLs and add domain if needed
		if (product.image && !product.image.startsWith('http')) {
			const baseUrl = getBaseUrl();
			return `${baseUrl}${product.image}`;
		}
		if (product.imageUrl && !product.imageUrl.startsWith('http')) {
			const baseUrl = getBaseUrl();
			return `${baseUrl}${product.imageUrl}`;
		}
		// Final fallback
		return 'https://via.placeholder.com/150?text=No+Image';
	};

	const getPriceForSingleProduct = (product: Record<string, any>) => {
		return `${CURRENCY_SYMBOL}${product.price}`;
	};

	const getPriceForMultipleSkus = (product: Record<string, any>) => {
		const prices = product.skuDetails.map((sku: any) => sku.price);
		if (prices.length > 1) {
			return `${CURRENCY_SYMBOL}${Math.min(...prices)} - ${CURRENCY_SYMBOL}${Math.max(...prices)}`;
		}
		return `${CURRENCY_SYMBOL}${product.skuDetails[0].price || 0}`;
	};

	const getPriceForSku = () => {
		return `${CURRENCY_SYMBOL}0`;
	};

	return (
		<Col>
			<Card className='productCard'>
				<Card.Img
					onClick={() => router.push(`/products/${product?._id}`)}
					variant='top'
					src={
						uploading
							? 'https://www.ebi.ac.uk/training/progressbar.gif'
							: getProductImage()
					}
					style={{ height: '200px', objectFit: 'cover' }}
				/>
				<Card.Body>
					<Card.Title
						onClick={() => router.push(`/products/${product?._id}`)}
						style={{ height: '50px', overflow: 'hidden' }}
					>
						{getProductName()}
					</Card.Title>
					<StarRatingComponent
						name={`rate-${product._id}`}
						editing={false}
						starCount={5}
						value={product?.avgRating || 0}
					/>
					<Card.Text>
						<span className='priceText'>
							{product.price ? getPriceForSingleProduct(product) : getPriceForSku()}
						</span>
					</Card.Text>

					{product.category && (
						<Badge bg="info" className="me-2 mb-2">
							{product.category}
						</Badge>
					)}

					{product.stock > 0 ? (
						<Badge bg="success" className="mb-2">In Stock</Badge>
					) : (
						<Badge bg="danger" className="mb-2">Out of Stock</Badge>
					)}

					<br />
					{userType === 'admin' ? (
						<div className='btnGrpForProduct'>
							<div className='file btn btn-md btn-outline-primary fileInputDiv'>
								<Upload />
								<input
									type='file'
									name='file'
									className='fileInput'
									onChange={uploadProductImage}
								/>
							</div>
							<Button
								variant='outline-dark'
								className='btn btn-outline-dark viewProdBtn'
								onClick={() => router.push(`/admin/products/edit/${product?._id}`)}
							>
								<Pen />
							</Button>
							<Button
								variant='outline-dark'
								className='btn btn-outline-dark viewProdBtn'
								onClick={() => deleteProduct()}
							>
								{isLoading && (
									<span
										className='spinner-border spinner-border-sm mr-2'
										role='status'
										aria-hidden='true'
									></span>
								)}
								<Trash />
							</Button>
							<Link href={`/products/${product?._id}`}>
								<a className='btn btn-outline-dark viewProdBtn'>
									<Eye />
								</a>
							</Link>
						</div>
					) : (
						<Link href={`/products/${product?._id}`}>
							<a className='btn btn-outline-dark viewProdBtn'>
								<Eye />
								View Details
							</a>
						</Link>
					)}
				</Card.Body>
			</Card>
		</Col>
	);
};

export default ProductItem;
