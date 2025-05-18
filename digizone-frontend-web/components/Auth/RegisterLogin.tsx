import React, { FC, useContext, useEffect, useRef } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { Users } from '../../services/user.service';
import { useToasts } from 'react-toast-notifications';
import { resposnePayload } from '../../services/api';
import validator from 'validator';
import Router from 'next/router';
import { Context } from '../../context';
import axios from 'axios';

interface IRegisterLoginProps {
	isResgisterForm?: boolean;
}

const initalForm = {
	email: '',
	password: '',
	confirmPassword: '',
	name: '',
};

const RegisterLogin: FC<IRegisterLoginProps> = ({
	isResgisterForm = false,
}) => {
	const { addToast } = useToasts();
	const [authForm, setAuthForm] = React.useState(initalForm);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isLoadingForgotPwd, setIsLoadingForgotPwd] = React.useState(false);
	const [otpTime, setOtpTime] = React.useState(false);
	const [otpForm, setOtpForm] = React.useState({ email: '', otp: '' });

	const {
		state: { user },
		dispatch,
	} = useContext(Context);

	useEffect(() => {
		if (user && user.email) {
			Router.push('/my-account'); // if user already logged in redirect to my account
		}
	}, [user]);

	// handle register form
	const handleRegister = async (e: any) => {
		e.preventDefault();
		try {
			const { email, name, password, confirmPassword } = authForm;
			if (!name) {
				throw new Error('Invalid name');
			}
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			if (password !== confirmPassword) {
				console.error('Invalid password', password, confirmPassword);
				throw new Error('Password does not match');
			}
			if (password.length < 6) {
				throw new Error('Password is too short. Minimum 6 characters');
			}
			setIsLoading(true);
			const payload = {
				email: authForm.email,
				password: authForm.password,
				name: authForm.name,
			};

			console.log('Sending registration request with payload:', payload);
			const response: resposnePayload = await Users.registerNewUser(
				payload
			);
			console.log('Registration response:', response);

			// Check if response is successful (either by success flag or by having user data)
			if (response && (response.success === false || !response.result?.user)) {
				throw new Error(response.message || 'Registration failed');
			}

			setOtpForm({ ...otpForm, email: email });
			setOtpTime(true);
			addToast(response.message || 'Registration successful', { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			console.error('Registration error:', error);
			if (error.response) {
				return addToast(error.response.data?.message || 'Registration failed', {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// handle login form
	const handleLogin = async (e: any) => {
		e.preventDefault();
		try {
			const { email, password } = authForm;
			if (!email || !password) {
				throw new Error('Invalid email or password');
			}
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			if (password.length < 6) {
				throw new Error('Password is too short. Minimum 6 characters');
			}
			setIsLoading(true);

			// Clear any existing auth data to ensure clean login
			window.localStorage.removeItem('_digi_user');
			window.localStorage.removeItem('_digi_auth_token');
			delete axios.defaults.headers.common['Authorization'];

			const payload = {
				email,
				password,
			};
			console.log('Sending login request with payload:', payload);
			const response: resposnePayload = await Users.loginUser(payload);
			console.log('Login response:', response);

			// Check if response is successful (either by success flag or by having user data)
			if (response && (response.success === false || !response.result?.user)) {
				throw new Error(response.message || 'Login failed');
			}

			// Update context
			dispatch({
				type: 'LOGIN',
				payload: response.result?.user,
			});

			addToast(response.message || 'Login successful', { appearance: 'success', autoDismiss: true });

			// Check if user is admin and redirect accordingly
			const userRole = response.result?.user?.role;
			console.log("User role for redirect decision:", userRole);

			// Redirect to admin panel for admin users, or home page for regular users
			if (userRole && (userRole.toLowerCase() === 'admin' || response.result?.user?.isAdmin === true)) {
				console.log("Redirecting to admin panel");
				window.location.href = '/admin';
			} else {
				console.log("Redirecting to home page");
				window.location.href = '/';
			}
		} catch (error: any) {
			console.error('Login error:', error);
			if (error.response) {
				return addToast(error.response.data?.message || 'Login failed', {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// handle resend otp
	const otpResend = async () => {
		try {
			const { email } = otpForm;
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			setIsLoading(true);
			const { success, message }: resposnePayload = await Users.resendOTP(
				email
			);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// verify user otp
	const verifyUser = async (e: any) => {
		e.preventDefault();
		try {
			if (!validator.isEmail(otpForm.email)) {
				throw new Error('Invalid email');
			}
			setIsLoading(true);
			const { success, message }: resposnePayload = await Users.verifyOTP(
				otpForm.otp,
				otpForm.email
			);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
			setOtpTime(false);
			setAuthForm(initalForm);
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	const forgotPassword = async (e: any) => {
		e.preventDefault();
		try {
			const { email } = authForm;
			if (!validator.isEmail(email)) {
				throw new Error(
					'Invalid email. Plese enter a valid email and we will send you a password for you'
				);
			}
			setIsLoadingForgotPwd(true);
			const { success, message }: resposnePayload =
				await Users.forgotUserPassword(email);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoadingForgotPwd(false);
		}
	};

	return (
		<Card>
			<Card.Header>{isResgisterForm ? 'Register' : 'Login'}</Card.Header>
			<Card.Body>
				<Form>
					{isResgisterForm && (
						<Form.Group className='mb-3'>
							<Form.Label>Full name</Form.Label>
							<Form.Control
								type='text'
								name='name'
								placeholder='Enter your full name'
								disabled={otpTime}
								value={authForm.name || ''}
								onChange={(e) =>
									setAuthForm({ ...authForm, name: e.target.value })
								}
							/>
						</Form.Group>
					)}
					<Form.Group className='mb-3'>
						<Form.Label>Email address</Form.Label>
						<Form.Control
							type='email'
							placeholder='name@example.com'
							name='email'
							disabled={otpTime}
							value={authForm.email || ''}
							onChange={(e) =>
								setAuthForm({ ...authForm, email: e.target.value })
							}
						/>
					</Form.Group>
					<Form.Group className='mb-3'>
						<Form.Label>Password</Form.Label>
						<Form.Control
							type='password'
							name='password'
							placeholder='Enter your password'
							disabled={otpTime}
							value={authForm.password || ''}
							onChange={(e) =>
								setAuthForm({ ...authForm, password: e.target.value })
							}
						/>
					</Form.Group>
					{isResgisterForm && (
						<>
							<Form.Group className='mb-3'>
								<Form.Label>Re-type password</Form.Label>
								<Form.Control
									type='password'
									name='repassword'
									placeholder='Re-type your password'
									disabled={otpTime}
									value={authForm.confirmPassword || ''}
									onChange={(e) =>
										setAuthForm({
											...authForm,
											confirmPassword: e.target.value,
										})
									}
								/>
							</Form.Group>
							{otpTime && (
								<Form.Group className='mb-3'>
									<Form.Label>OTP</Form.Label>
									<Form.Control
										type='text'
										name='otp'
										placeholder='OTP'
										onChange={(e) =>
											setOtpForm({ ...otpForm, otp: e.target.value })
										}
									/>

									<Button
										variant='link'
										className='resendOtpBtn'
										onClick={otpResend}
									>
										Resend OTP
									</Button>
								</Form.Group>
							)}
						</>
					)}
					{otpTime ? (
						<Form.Group className='mb-3'>
							<Button
								variant='info'
								type='submit'
								className='btnAuth'
								disabled={isLoading}
								onClick={verifyUser}
							>
								{isLoading && (
									<span
										className='spinner-border spinner-border-sm mr-2'
										role='status'
										aria-hidden='true'
									></span>
								)}
								Submit
							</Button>
						</Form.Group>
					) : (
						<Form.Group className='mb-3'>
							<Button
								variant='info'
								type='submit'
								className='btnAuth'
								disabled={isLoading}
								onClick={isResgisterForm ? handleRegister : handleLogin}
							>
								{isLoading && (
									<span
										className='spinner-border spinner-border-sm mr-2'
										role='status'
										aria-hidden='true'
									></span>
								)}
								{isResgisterForm ? 'Register' : 'Login'}
							</Button>
						</Form.Group>
					)}
				</Form>
				{!isResgisterForm && (
					<a
						style={{ textDecoration: 'none' }}
						href=''
						onClick={forgotPassword}
					>
						{isLoadingForgotPwd && (
							<span
								className='spinner-border spinner-border-sm'
								role='status'
								aria-hidden='true'
							></span>
						)}
						Forgot your password?
					</a>
				)}
			</Card.Body>
		</Card>
	);
};

export default RegisterLogin;
