import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { FC, useContext } from 'react';
import { Badge } from 'react-bootstrap';
import { Button, Card, CloseButton, Image, Offcanvas } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import { useToasts } from 'react-toast-notifications';
import { Context } from '../context';
import { getFormatedStringFromDays } from '../helper/utils';
import { Orders } from '../services/order.service';
import CartItems from './CartItems';
interface IProps {
	show: boolean;
	setShow: (show: boolean) => void;
}
const CartOffCanvas: FC<IProps> = ({ show, setShow }: IProps) => {
	const handleClose = () => setShow(false);
	const { addToast } = useToasts();
	const router = useRouter();
	const { cartItems, cartDispatch } = useContext(Context);
	const [isLoading, setIsLoading] = React.useState(false);
	const handleCheckout = async () => {
		try {
			setIsLoading(true);
			if (!cartItems || cartItems.length === 0) {
				addToast('Your cart is empty', { appearance: 'warning', autoDismiss: true });
				return;
			}

			// Check if user is logged in
			const user = JSON.parse(localStorage.getItem('_digi_user') || '{}');
			if (!user || (!user.id && !user._id)) {
				addToast('Please log in to checkout', { appearance: 'warning', autoDismiss: true });
				router.push('/auth');
				return;
			}

			console.log('Sending checkout request with items:', cartItems);
			const sessionRes = await Orders.checkoutSession(cartItems);

			if (!sessionRes.success) {
				throw new Error(sessionRes.message || 'Failed to create checkout session');
			}

			if (!sessionRes.result) {
				throw new Error('No checkout URL returned from server');
			}

			console.log('Redirecting to checkout page:', sessionRes.result);
			router.push(sessionRes.result);
		} catch (error: any) {
			console.error('Checkout error:', error);

			// Handle different types of errors
			if (error.response) {
				const errorMsg = error.response.data?.message || 'Server error during checkout';
				addToast(errorMsg, { appearance: 'error', autoDismiss: true });
			} else {
				addToast(error.message || 'Something went wrong during checkout', {
					appearance: 'error',
					autoDismiss: true
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Offcanvas show={show} onHide={handleClose} placement='end'>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title>Shoping Cart</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body>
					<CartItems />
					<Button
						variant='primary'
						style={{ width: '100%' }}
						disabled={isLoading}
						onClick={
							() => handleCheckout()
							// 	{
							// 	setShow(false);
							// 	router.push('/checkout');
							// }
						}
					>
						{isLoading && (
							<span
								className='spinner-border spinner-border-sm mr-2'
								role='status'
								aria-hidden='true'
							></span>
						)}
						Checkout
					</Button>
				</Offcanvas.Body>
			</Offcanvas>
		</>
	);
};

export default CartOffCanvas;
