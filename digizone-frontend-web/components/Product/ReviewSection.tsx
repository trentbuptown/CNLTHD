import React, { FC, useContext, useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { ArrowClockwise, PersonFill, Trash } from 'react-bootstrap-icons';
import StarRatingComponent from 'react-star-rating-component';
import { useToasts } from 'react-toast-notifications';
import { Context } from '../../context';
import { Products } from '../../services/product.service';
import ReviewForm from './ReviewForm';

interface IProps {
	reviews: Record<string, any>[];
	productId: string;
}

const ReviewSection: FC<IProps> = ({ reviews, productId }) => {
	const [productReviews, setProductReviews] = useState<Record<string, any>[]>(reviews || []);
	const [filteredReviews, setFilteredReviews] = useState<Record<string, any>[]>(reviews || []);
	const [filterValue, setFilterValue] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { addToast } = useToasts();

	const {
		state: { user },
	} = useContext(Context);

	// Function to refresh reviews
	const refreshReviews = async () => {
		try {
			setIsLoading(true);
			const response = await Products.getProductReviews(productId);
			if (response.success) {
				const fetchedReviews = response.result?.reviews || [];
				setProductReviews(fetchedReviews);
				setFilteredReviews(fetchedReviews);
			} else {
				throw new Error(response.message || 'Failed to fetch reviews');
			}
		} catch (error: any) {
			console.error('Error fetching reviews:', error);
			addToast('Failed to load reviews', { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// Sync with props when they change
		if (reviews && reviews.length > 0) {
			setProductReviews(reviews);
			setFilteredReviews(reviews);
		}
	}, [reviews]);

	const handleDelete = async (reviewId: string) => {
		if (!user) {
			addToast('You must be logged in to delete a review', { appearance: 'error', autoDismiss: true });
			return;
		}

		try {
			setIsLoading(true);
			const response = await Products.deleteReview(productId, reviewId, { userId: user.id });

			if (response.success) {
				addToast('Review deleted successfully', { appearance: 'success', autoDismiss: true });
				// Refresh reviews
				await refreshReviews();
			} else {
				throw new Error(response.message || 'Failed to delete review');
			}
		} catch (error: any) {
			console.error('Error deleting review:', error);
			const errorMessage = error.response?.data?.message || error.message || 'Failed to delete review';
			addToast(errorMessage, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// Filter reviews by rating
	const filterReviews = (rating: number) => {
		setFilterValue(rating);
		if (rating === 0) {
			setFilteredReviews(productReviews);
		} else {
			const filtered = productReviews.filter(review => review.rating === rating);
			setFilteredReviews(filtered);
		}
	};

	// Simpler date formatter that doesn't rely on date-fns
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (e) {
			return dateString;
		}
	};

	const currentUser = user ? {
		id: user.id || user._id || localStorage.getItem('_digi_user_id') || '',
		name: user.name || user.email || localStorage.getItem('_digi_user_name') || 'Anonymous User'
	} : null;

	console.log('Current user context:', user);

	return (
		<div className="review-section">
			{/* Review form for logged in users */}
			<ReviewForm
				productId={productId}
				onReviewAdded={refreshReviews}
				currentUser={currentUser}
			/>

			<hr className="my-4" />

			{/* Filter and refresh controls */}
			<div className="d-flex align-items-center justify-content-between mb-4">
				<div className="d-flex align-items-center">
					<h5 className="mb-0 me-2">Filter By:</h5>
					<StarRatingComponent
						name="ratingFilter"
						starCount={5}
						value={filterValue}
						onStarClick={filterReviews}
					/>
				</div>

				<Button
					variant="outline-secondary"
					onClick={() => {
						refreshReviews();
						setFilterValue(0);
					}}
					disabled={isLoading}
				>
					<ArrowClockwise className="me-2" />
					Refresh
				</Button>
			</div>

			{/* Reviews list */}
			{isLoading ? (
				<div className="text-center py-4">
					<div className="spinner-border" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			) : (
				<div className="reviews-container">
					{filteredReviews.length > 0 ? (
						filteredReviews.map((review) => (
							<Card className="mb-3" key={review._id}>
								<Card.Header className="d-flex justify-content-between align-items-center">
									<div>
										<PersonFill className="me-2" />
										<span className="fw-bold">{review.userName || 'Anonymous'}</span>
										<StarRatingComponent
											name={`rating-${review._id}`}
											editing={false}
											starCount={5}
											value={review.rating}
										/>
									</div>
									<small className="text-muted">
										{formatDate(review.createdAt)}
									</small>
								</Card.Header>
								<Card.Body>
									<Card.Text>{review.comment}</Card.Text>

									{currentUser && review.userId === currentUser.id && (
										<Button
											variant="outline-danger"
											size="sm"
											onClick={() => handleDelete(review._id)}
											disabled={isLoading}
										>
											<Trash className="me-1" /> Delete
										</Button>
									)}
								</Card.Body>
							</Card>
						))
					) : (
						<div className="alert alert-light text-center">
							No reviews yet. Be the first to review this product!
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default ReviewSection;
