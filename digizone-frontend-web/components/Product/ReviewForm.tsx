import React, { useState, FC, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import StarRatingComponent from 'react-star-rating-component';
import { useToasts } from 'react-toast-notifications';
import { Products } from '../../services/product.service';

interface ReviewFormProps {
    productId: string;
    onReviewAdded: () => void;
    currentUser: {
        id: string;
        name: string;
    } | null;
}

const ReviewForm: FC<ReviewFormProps> = ({ productId, onReviewAdded, currentUser }) => {
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [userData, setUserData] = useState<{ id: string, name: string } | null>(currentUser);
    const { addToast } = useToasts();

    useEffect(() => {
        // Try to get user data from localStorage if not provided by props
        if (!userData) {
            try {
                const storedUser = JSON.parse(localStorage.getItem('_digi_user') || '{}');
                if (storedUser && (storedUser.id || storedUser._id)) {
                    setUserData({
                        id: storedUser.id || storedUser._id,
                        name: storedUser.name || storedUser.email || 'Anonymous User'
                    });
                    console.log('Loaded user data from localStorage:', storedUser);
                }
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
            }
        }
    }, [userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Get user data from state or localStorage
        let userId = '';
        let userName = '';

        try {
            // First check if userData state has values
            if (userData && userData.id) {
                userId = userData.id;
                userName = userData.name;
            } else {
                // Try to get from localStorage
                const storedUser = JSON.parse(localStorage.getItem('_digi_user') || '{}');
                userId = storedUser.id || storedUser._id || '';
                userName = storedUser.name || storedUser.email || 'Anonymous User';

                console.log('Using user data from localStorage:', { userId, userName });
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }

        if (!userId) {
            addToast('Please log in to submit a review', { appearance: 'error', autoDismiss: true });
            return;
        }

        if (rating < 1) {
            addToast('Please select a rating', { appearance: 'warning', autoDismiss: true });
            return;
        }

        if (comment.trim().length < 2) {
            addToast('Please enter a comment', { appearance: 'warning', autoDismiss: true });
            return;
        }

        try {
            setIsSubmitting(true);

            const reviewData = {
                rating,
                comment,
                userId,
                userName
            };

            // Debug log the reviewData
            console.log('Submitting review data:', reviewData);

            const response = await Products.addReview(productId, reviewData);
            console.log('Review submission response:', response);

            if (response.success) {
                addToast('Review submitted successfully', { appearance: 'success', autoDismiss: true });
                setComment('');
                setRating(5);
                onReviewAdded();
            } else {
                throw new Error(response.message || 'Failed to submit review');
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);

            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review';
            addToast(errorMessage, { appearance: 'error', autoDismiss: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if we have valid user data to show the form
    const hasUserData = userData?.id ||
        (typeof window !== 'undefined' &&
            localStorage.getItem('_digi_user') &&
            JSON.parse(localStorage.getItem('_digi_user') || '{}').id);

    if (!hasUserData) {
        return (
            <div className="alert alert-info">
                Please log in to leave a review
            </div>
        );
    }

    return (
        <div className="review-form-container">
            <h4>Write a Review</h4>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <div>
                        <StarRatingComponent
                            name="reviewRating"
                            starCount={5}
                            value={rating}
                            onStarClick={(nextValue) => setRating(nextValue)}
                            renderStarIcon={() => <span className="fs-4">★</span>}
                        />
                    </div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Comment</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about this product"
                    />
                </Form.Group>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="mt-3"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
            </Form>
        </div>
    );
};

export default ReviewForm; 