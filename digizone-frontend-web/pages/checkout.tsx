import React, { useEffect, useContext, useState } from 'react';
import { Button, Col, Form, Image, Row, Alert, Card } from 'react-bootstrap';
import { useRouter } from 'next/router';
import CartItems from '../components/CartItems';
import BreadcrumbDisplay from '../components/shared/BreadcrumbDisplay';
import validator from 'validator';
import { useToasts } from 'react-toast-notifications';
import { Orders } from '../services/order.service';
import { Context } from '../context';
import { Payments, paymentMethods, CardDetails } from '../services/payment.service';
import { CURRENCY_SYMBOL } from '../helper/settings';

interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
}

const Checkout = () => {
	const [billingForm, setBillingForm] = React.useState({
		name: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		postalCode: '',
		country: '',
	});
	const [paymentMethod, setPaymentMethod] = React.useState('vnpay');
	const [isValidSession, setIsValidSession] = React.useState(false);
	const [isFormValid, setIsFormValid] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [cardDetails, setCardDetails] = useState<CardDetails>({
		cardNumber: '',
		cardName: '',
		expiryDate: '',
		cvv: ''
	});
	const { addToast } = useToasts();
	const router = useRouter();
	const { session } = router.query;
	const { cartItems, cartDispatch } = useContext(Context);

	useEffect(() => {
		// Check if we have a valid session from the checkout process
		if (session) {
			console.log('Checkout session found:', session);
			setIsValidSession(true);

			// Try to pre-populate form with user data if available
			try {
				const userData = JSON.parse(localStorage.getItem('_digi_user') || '{}');
				if (userData) {
					setBillingForm(prev => ({
						...prev,
						name: userData.name || '',
						email: userData.email || ''
					}));
				}
			} catch (error) {
				console.error('Error loading user data:', error);
			}
		} else {
			console.log('No checkout session found');
			addToast('Please add items to your cart and proceed to checkout first', {
				appearance: 'info',
				autoDismiss: true
			});
		}
	}, [session, addToast]);

	useEffect(() => {
		// Validate form as user types
		const { name, email, phone, address, city, postalCode, country } = billingForm;
		setIsFormValid(
			name.trim() !== '' &&
			validator.isEmail(email) &&
			phone.trim() !== '' &&
			address.trim() !== '' &&
			city.trim() !== '' &&
			postalCode.trim() !== '' &&
			country.trim() !== ''
		);
	}, [billingForm]);

	const placeOrder = async () => {
		try {
			setIsSubmitting(true);
			const { name, email, phone, address, city, postalCode, country } = billingForm;

			// Form validation
			if (!name.trim()) {
				throw new Error('Please enter your full name');
			}
			if (!validator.isEmail(email)) {
				throw new Error('Please enter a valid email address');
			}
			if (!phone.trim()) {
				throw new Error('Please enter your phone number');
			}
			if (!address.trim()) {
				throw new Error('Please enter your address');
			}
			if (!city.trim()) {
				throw new Error('Please enter your city');
			}
			if (!postalCode.trim()) {
				throw new Error('Please enter your postal code');
			}
			if (!country.trim()) {
				throw new Error('Please enter your country');
			}

			// Additional validation for VNPAY card details
			if (paymentMethod === 'vnpay') {
				const { cardNumber, cardName, expiryDate, cvv } = cardDetails;
				if (!cardNumber.trim() || cardNumber.length < 15) {
					throw new Error('Please enter a valid card number');
				}
				if (!cardName.trim()) {
					throw new Error('Please enter the name on the card');
				}
				if (!expiryDate.trim() || !expiryDate.includes('/')) {
					throw new Error('Please enter a valid expiry date in MM/YY format');
				}
				if (!cvv.trim() || cvv.length < 3) {
					throw new Error('Please enter a valid CVV code');
				}
			}

			// Get the user from localStorage
			const user = JSON.parse(localStorage.getItem('_digi_user') || '{}');
			console.log('User data from localStorage:', user);

			if (!user || (!user.id && !user._id)) {
				throw new Error('You must be logged in to place an order');
			}

			// Calculate total price from cart items
			const totalPrice = cartItems.reduce((sum: number, item: CartItem) => {
				return sum + (item.price * item.quantity);
			}, 0);

			// Create order object
			const orderData = {
				orderItems: cartItems,
				userId: user.id || user._id,
				shippingAddress: {
					name,
					email,
					phone,
					address,
					city,
					postalCode,
					country
				},
				paymentMethod: paymentMethod,
				totalPrice,
				sessionId: session
			};

			console.log('Submitting order:', orderData);

			// Create order
			const orderResult = await Orders.submitOrder(orderData);
			console.log('Order creation response:', orderResult);

			if (!orderResult.success) {
				throw new Error(orderResult.message || 'Failed to create order');
			}

			// Extract order ID from the response with detailed logging
			// The order controller returns the order in different formats:
			// 1. { success: true, order: { _id: '...' } }
			// 2. { success: true, result: { _id: '...' } }
			// 3. { success: true, result: { order: { _id: '...' } } }

			let orderId = '';

			if (orderResult.order && orderResult.order._id) {
				console.log('Found order ID in response.order:', orderResult.order._id);
				orderId = orderResult.order._id;
			} else if (orderResult.result && orderResult.result._id) {
				console.log('Found order ID in response.result:', orderResult.result._id);
				orderId = orderResult.result._id;
			} else if (orderResult.result && orderResult.result.order && orderResult.result.order._id) {
				console.log('Found order ID in response.result.order:', orderResult.result.order._id);
				orderId = orderResult.result.order._id;
			} else {
				// Log the full response for debugging
				console.error('Could not find order ID in response:', JSON.stringify(orderResult));
				throw new Error('Invalid order ID returned from server');
			}

			console.log('Using order ID for payment:', orderId);

			// Process payment based on selected method
			if (paymentMethod === 'vnpay') {
				// Process direct VNPAY payment
				try {
					console.log('Processing direct VNPAY payment for order:', orderId);

					// Show processing message
					addToast('Processing payment...', {
						appearance: 'info',
						autoDismiss: true
					});

					// Call the direct payment API
					const paymentResponse = await Payments.processDirectVnpayPayment(
						orderId,
						totalPrice,
						cardDetails
					);

					console.log('Direct VNPAY payment response:', paymentResponse);

					if (paymentResponse.success) {
						// Check if 3DS authentication was required
						if (paymentResponse.was3DS) {
							// Simulate 3DS verification process
							addToast('3D Secure Authentication required', {
								appearance: 'info',
								autoDismiss: true
							});

							// Show simulated 3DS authentication process
							await new Promise(resolve => setTimeout(resolve, 1500));

							addToast('3D Secure Authentication successful', {
								appearance: 'success',
								autoDismiss: true
							});

							await new Promise(resolve => setTimeout(resolve, 1000));
						}

						// Clear the cart after successful order
						cartDispatch({ type: 'CLEAR_CART', payload: {} });

						addToast('Payment successful! Your order has been placed.', {
							appearance: 'success',
							autoDismiss: true
						});

						// Redirect to success page
						setTimeout(() => {
							router.push(`/success?order_id=${orderId}&transaction_id=${paymentResponse.transactionId}`);
						}, 1500);
					} else {
						// Handle specific error cases
						let errorMessage = 'Payment failed. Please try again.';

						if (paymentResponse.errorCode === 'INSUFFICIENT_FUNDS') {
							errorMessage = 'Payment failed: Insufficient funds in your account.';
						} else if (paymentResponse.errorCode === 'CARD_NOT_ACTIVATED') {
							errorMessage = 'Payment failed: Card is not activated.';
						} else if (paymentResponse.errorCode === 'CARD_LOCKED') {
							errorMessage = 'Payment failed: Card is locked.';
						} else if (paymentResponse.errorCode === 'CARD_EXPIRED') {
							errorMessage = 'Payment failed: Card has expired.';
						}

						throw new Error(paymentResponse.message || errorMessage);
					}

					return;
				} catch (error: any) {
					console.error('Payment processing error:', error);
					throw new Error(error.message || 'Failed to process payment');
				}
			} else if (paymentMethod === 'cod') {
				// Create COD payment
				console.log('Creating COD payment for order:', orderId);
				const customerInfo = {
					name,
					email,
					phone,
					address
				};

				const paymentResponse = await Payments.createCodPayment(
					orderId,
					totalPrice,
					customerInfo
				);

				console.log('COD payment response:', paymentResponse);

				if (paymentResponse.success) {
					// Clear the cart after successful order
					cartDispatch({ type: 'CLEAR_CART', payload: {} });

					addToast('Order placed successfully! You will pay upon delivery.', {
						appearance: 'success',
						autoDismiss: true
					});

					// Redirect to confirmation page or homepage
					console.log('Redirecting to success page with order ID:', orderId);
					setTimeout(() => {
						router.push(`/success?order_id=${orderId}`);
					}, 2000);
					return;
				} else {
					throw new Error(paymentResponse.message || 'Failed to create COD payment');
				}
			}

		} catch (error: any) {
			addToast(error.message, {
				appearance: 'error',
				autoDismiss: true
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Row>
				<BreadcrumbDisplay />

				{!isValidSession && (
					<Col sm={12}>
						<Alert variant="warning">
							No valid checkout session found. Please add items to your cart and checkout.
							<div className="mt-3">
								<Button variant="primary" onClick={() => router.push('/')}>
									Return to Shopping
								</Button>
							</div>
						</Alert>
					</Col>
				)}

				{isValidSession && (
					<>
						<Col sm={8}>
							<h2 className="mb-4">Billing Information</h2>
							<Form>
								<Form.Group className='mb-3' controlId='fullName'>
									<Form.Label>Full name</Form.Label>
									<Form.Control
										type='text'
										placeholder='Enter your full name'
										value={billingForm.name}
										onChange={(e) =>
											setBillingForm({ ...billingForm, name: e.target.value })
										}
										required
									/>
								</Form.Group>
								<Form.Group className='mb-3' controlId='email'>
									<Form.Label>Email address</Form.Label>
									<Form.Control
										type='email'
										placeholder='name@example.com'
										value={billingForm.email}
										onChange={(e) =>
											setBillingForm({ ...billingForm, email: e.target.value })
										}
										required
									/>
									{billingForm.email && !validator.isEmail(billingForm.email) && (
										<Form.Text className="text-danger">
											Please enter a valid email address
										</Form.Text>
									)}
								</Form.Group>
								<Form.Group className='mb-3' controlId='phone'>
									<Form.Label>Phone no</Form.Label>
									<Form.Control
										type='tel'
										placeholder='Enter your phone number'
										value={billingForm.phone}
										onChange={(e) =>
											setBillingForm({ ...billingForm, phone: e.target.value })
										}
										required
									/>
								</Form.Group>
								<Form.Group className='mb-3' controlId='address'>
									<Form.Label>Address</Form.Label>
									<Form.Control
										as='textarea'
										rows={3}
										value={billingForm.address}
										onChange={(e) =>
											setBillingForm({ ...billingForm, address: e.target.value })
										}
										required
										placeholder='Enter your street address'
									/>
								</Form.Group>

								<Row>
									<Col md={6}>
										<Form.Group className='mb-3' controlId='city'>
											<Form.Label>City</Form.Label>
											<Form.Control
												type='text'
												placeholder='Enter your city'
												value={billingForm.city}
												onChange={(e) =>
													setBillingForm({ ...billingForm, city: e.target.value })
												}
												required
											/>
										</Form.Group>
									</Col>
									<Col md={6}>
										<Form.Group className='mb-3' controlId='postalCode'>
											<Form.Label>Postal Code</Form.Label>
											<Form.Control
												type='text'
												placeholder='Enter your postal code'
												value={billingForm.postalCode}
												onChange={(e) =>
													setBillingForm({ ...billingForm, postalCode: e.target.value })
												}
												required
											/>
										</Form.Group>
									</Col>
								</Row>

								<Form.Group className='mb-3' controlId='country'>
									<Form.Label>Country</Form.Label>
									<Form.Control
										type='text'
										placeholder='Enter your country'
										value={billingForm.country}
										onChange={(e) =>
											setBillingForm({ ...billingForm, country: e.target.value })
										}
										required
									/>
								</Form.Group>

								<h4 className="mt-4">Payment Method</h4>
								<div className="mb-4">
									{paymentMethods.map((method) => (
										<Card
											key={method.id}
											className={`mb-2 ${paymentMethod === method.id ? 'border-primary' : ''}`}
											onClick={() => setPaymentMethod(method.id)}
											style={{ cursor: 'pointer' }}
										>
											<Card.Body className="d-flex align-items-center">
												<div className="me-3">
													<Form.Check
														type='radio'
														id={`payment-${method.id}`}
														name='paymentMethod'
														checked={paymentMethod === method.id}
														onChange={() => setPaymentMethod(method.id)}
													/>
												</div>
												<Image
													src={method.icon}
													alt={method.name}
													width={40}
													height={40}
													className="me-3"
												/>
												<div>
													<div className="fw-bold">{method.name}</div>
													<div className="text-muted small">{method.description}</div>
												</div>
											</Card.Body>
										</Card>
									))}
								</div>

								{paymentMethod === 'vnpay' && (
									<div className="mt-4 mb-4 p-3 border rounded">
										<h5>VNPAY Payment Information</h5>

										<Form.Group className="mb-3" controlId="bankSelection">
											<Form.Label>Select Bank</Form.Label>
											<Form.Select
												onChange={(e) => {
													// Pre-fill card details based on selected bank
													const bankOption = e.target.value;
													let newCardDetails = { ...cardDetails };

													switch (bankOption) {
														case 'NCB-SUCCESS':
															newCardDetails = {
																cardNumber: '9704198526191432198',
																cardName: 'NGUYEN VAN A',
																expiryDate: '07/15',
																cvv: '123'
															};
															break;
														case 'NCB-INSUFFICIENT':
															newCardDetails = {
																cardNumber: '9704195798459170488',
																cardName: 'NGUYEN VAN A',
																expiryDate: '07/15',
																cvv: '123'
															};
															break;
														case 'NCB-INACTIVE':
															newCardDetails = {
																cardNumber: '9704192181368742',
																cardName: 'NGUYEN VAN A',
																expiryDate: '07/15',
																cvv: '123'
															};
															break;
														case 'NCB-LOCKED':
															newCardDetails = {
																cardNumber: '9704193370791314',
																cardName: 'NGUYEN VAN A',
																expiryDate: '07/15',
																cvv: '123'
															};
															break;
														case 'NCB-EXPIRED':
															newCardDetails = {
																cardNumber: '9704194841945513',
																cardName: 'NGUYEN VAN A',
																expiryDate: '07/15',
																cvv: '123'
															};
															break;
														case 'VISA-NO3DS':
															newCardDetails = {
																cardNumber: '4456530000001005',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/26',
																cvv: '123'
															};
															break;
														case 'VISA-3DS':
															newCardDetails = {
																cardNumber: '4456530000001096',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/26',
																cvv: '123'
															};
															break;
														case 'MASTERCARD-NO3DS':
															newCardDetails = {
																cardNumber: '5200000000001005',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/26',
																cvv: '123'
															};
															break;
														case 'MASTERCARD-3DS':
															newCardDetails = {
																cardNumber: '5200000000001096',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/26',
																cvv: '123'
															};
															break;
														case 'JCB-NO3DS':
															newCardDetails = {
																cardNumber: '3337000000000008',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/26',
																cvv: '123'
															};
															break;
														case 'JCB-3DS':
															newCardDetails = {
																cardNumber: '3337000000200004',
																cardName: 'NGUYEN VAN A',
																expiryDate: '12/24',
																cvv: '123'
															};
															break;
														case 'ATM-NAPAS':
															newCardDetails = {
																cardNumber: '9704000000000018',
																cardName: 'NGUYEN VAN A',
																expiryDate: '03/07',
																cvv: '123'
															};
															break;
														case 'ATM-EXIMBANK':
															newCardDetails = {
																cardNumber: '9704310005819191',
																cardName: 'NGUYEN VAN A',
																expiryDate: '10/26',
																cvv: '123'
															};
															break;
														default:
															// Clear the form for manual entry
															newCardDetails = {
																cardNumber: '',
																cardName: '',
																expiryDate: '',
																cvv: ''
															};
													}

													setCardDetails(newCardDetails);
												}}
											>
												<option value="">Select bank or card type...</option>
												<optgroup label="Local Banks">
													<option value="NCB-SUCCESS">NCB Bank (Successful payment)</option>
													<option value="NCB-INSUFFICIENT">NCB Bank (Insufficient funds)</option>
													<option value="NCB-INACTIVE">NCB Bank (Card not activated)</option>
													<option value="NCB-LOCKED">NCB Bank (Card locked)</option>
													<option value="NCB-EXPIRED">NCB Bank (Card expired)</option>
													<option value="ATM-EXIMBANK">EXIMBANK ATM Card</option>
												</optgroup>
												<optgroup label="International Cards">
													<option value="VISA-NO3DS">VISA (No 3DS)</option>
													<option value="VISA-3DS">VISA (3DS)</option>
													<option value="MASTERCARD-NO3DS">MasterCard (No 3DS)</option>
													<option value="MASTERCARD-3DS">MasterCard (3DS)</option>
													<option value="JCB-NO3DS">JCB (No 3DS)</option>
													<option value="JCB-3DS">JCB (3DS)</option>
												</optgroup>
												<optgroup label="Other Payment Methods">
													<option value="ATM-NAPAS">NAPAS ATM Card</option>
												</optgroup>
											</Form.Select>
										</Form.Group>

										<Row className="mt-3">
											<Col md={6}>
												<Form.Group className="mb-3" controlId="cardNumber">
													<Form.Label>Card Number</Form.Label>
													<Form.Control
														type="text"
														placeholder="Enter card number"
														maxLength={19}
														value={cardDetails.cardNumber}
														onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
													/>
												</Form.Group>
											</Col>
											<Col md={6}>
												<Form.Group className="mb-3" controlId="cardName">
													<Form.Label>Name on Card</Form.Label>
													<Form.Control
														type="text"
														placeholder="Enter name on card"
														value={cardDetails.cardName}
														onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
													/>
												</Form.Group>
											</Col>
										</Row>
										<Row>
											<Col md={6}>
												<Form.Group className="mb-3" controlId="expiryDate">
													<Form.Label>Expiry Date</Form.Label>
													<Form.Control
														type="text"
														placeholder="MM/YY"
														maxLength={5}
														value={cardDetails.expiryDate}
														onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
													/>
												</Form.Group>
											</Col>
											<Col md={6}>
												<Form.Group className="mb-3" controlId="cvv">
													<Form.Label>CVV</Form.Label>
													<Form.Control
														type="text"
														placeholder="CVV"
														maxLength={3}
														value={cardDetails.cvv}
														onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
													/>
												</Form.Group>
											</Col>
										</Row>
										<Alert variant="info" className="mt-2">
											<small>
												<strong>Note:</strong> This is a simulated VNPAY checkout for demo purposes. We've added test cards for different scenarios.
												<br />
												- For successful payments, use the NCB Bank (Successful payment) option.
												<br />
												- You can also test error scenarios with the other NCB options.
												<br />
												- No actual payments will be processed.
											</small>
										</Alert>
									</div>
								)}
							</Form>
						</Col>
						<Col sm={4}>
							<h2 className="mb-4">Order Summary</h2>
							<CartItems rmvdeleteBtn={true} />
							<Button
								variant='primary'
								style={{ width: '100%' }}
								onClick={placeOrder}
								disabled={!isFormValid || isSubmitting}
							>
								{isSubmitting ? 'Processing...' : `Place Order - ${CURRENCY_SYMBOL}${cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0).toFixed(2)}`}
							</Button>
						</Col>
					</>
				)}
			</Row>
		</>
	);
};

export default Checkout;
