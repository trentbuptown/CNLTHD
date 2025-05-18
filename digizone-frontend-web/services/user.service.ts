import requests, { resposnePayload } from './api';
import axios from 'axios';

// create user service
export const Users = {
	// get user details
	getUser: async (): Promise<resposnePayload> => {
		const getUserRes = await requests.get('/api/users/profile');
		return getUserRes;
	},
	// get all users
	getUsers: async (): Promise<resposnePayload> => {
		const getUsersRes = await requests.get('/api/users/admin/users');
		return getUsersRes;
	},
	// save user details or register an user
	registerNewUser: async (user: {}): Promise<resposnePayload> => {
		try {
			console.log('Registering user with API endpoint:', `/api/users/register`);
			const registerRes = await requests.post('/api/users/register', {
				...user,
				type: 'customer',
			});
			console.log('Register raw response:', registerRes);

			// Transform response to match expected format if needed
			const registerNewUserRes = {
				success: registerRes.success !== undefined ? registerRes.success : true,
				message: registerRes.message || 'Registration successful',
				result: {
					user: registerRes.user || registerRes
				}
			};

			console.log('Transformed register response:', registerNewUserRes);
			return registerNewUserRes;
		} catch (error) {
			console.error('Register error:', error);
			throw error;
		}
	},
	// login an user
	loginUser: async (user: any): Promise<resposnePayload> => {
		try {
			// Clear any existing session data first 
			window.localStorage.removeItem('_digi_user');
			window.localStorage.removeItem('_digi_auth_token');
			delete axios.defaults.headers.common['Authorization'];

			console.log('Logging in user with API endpoint:', `/api/users/login`);
			const loginRes = await requests.post('/api/users/login', user);
			console.log('Login raw response:', loginRes);

			// Try to extract the role information from the API response
			// Could be in various locations based on API structure
			const apiRole = loginRes.user?.role ||
				loginRes.role ||
				loginRes.data?.user?.role ||
				loginRes.data?.role;

			console.log('API returned role:', apiRole);

			// Transform response to match expected format if needed
			const loginUserRes = {
				success: loginRes.success !== undefined ? loginRes.success : true,
				message: loginRes.message || 'Login successful',
				result: {
					user: {
						...loginRes.user || loginRes,
						// Ensure role is set if it was provided in the response
						role: apiRole || loginRes.user?.role || 'customer'
					}
				}
			};

			// Log complete user data from response
			console.log('Complete user data from API:', loginRes.user);

			// Ensure we have the role property correctly set
			if (loginRes.user) {
				console.log('User role from API:', loginRes.user.role);
				// Make sure the user object has the role from the API
				if (!loginUserRes.result.user.role && loginRes.user.role) {
					loginUserRes.result.user.role = loginRes.user.role;
					console.log('Added missing role to user object:', loginRes.user.role);
				}
			}

			console.log('Transformed login response:', loginUserRes);

			if (loginUserRes && loginUserRes.result && loginUserRes.result.user) {
				// Make sure we store the complete user info with role
				const userToStore = {
					...loginUserRes.result.user,
					role: loginUserRes.result.user.role || loginRes.role || loginRes.user?.role || 'customer'
				};

				console.log('Storing user with role:', userToStore.role);
				console.log('Is admin user?', userToStore.role === 'admin');

				// Store user data
				window.localStorage.setItem(
					'_digi_user',
					JSON.stringify(userToStore)
				);

				// Store the JWT token for API authentication
				if (loginRes.token) {
					window.localStorage.setItem('_digi_auth_token', loginRes.token);
					// Set the token in axios headers for subsequent requests
					axios.defaults.headers.common['Authorization'] = `Bearer ${loginRes.token}`;
					console.log('Authentication token stored and set in headers');
				}
			}
			return loginUserRes;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	},
	// update user details
	updateUser: async (user: any, id: string): Promise<resposnePayload> => {
		const updateUserRes = await requests.patch(
			`/api/users/update-name-password/${id}`,
			user
		);
		// get data from localStorage
		const userData = JSON.parse(
			window.localStorage.getItem('_digi_user') || '{}'
		);
		// update user data
		userData.name = user?.name;
		// set user data
		window.localStorage.setItem('_digi_user', JSON.stringify(userData));

		return updateUserRes;
	},
	// update user profile (name, phone, password)
	updateUserProfile: async (userData: any): Promise<resposnePayload> => {
		try {
			const response = await requests.put('/api/users/profile', userData);

			// Update the local storage with new user data
			if (response.success) {
				// Get current stored user data
				const storedUser = JSON.parse(
					window.localStorage.getItem('_digi_user') || '{}'
				);

				// Update with new values
				const updatedUser = {
					...storedUser,
					name: response.user?.name || userData.name || storedUser.name,
					phone: response.user?.phone || userData.phone || storedUser.phone
				};

				// Save updated user to local storage
				window.localStorage.setItem('_digi_user', JSON.stringify(updatedUser));
			}

			return response;
		} catch (error) {
			console.error('Error updating user profile:', error);
			throw error;
		}
	},
	// forgot user's password
	forgotUserPassword: async (email: string): Promise<resposnePayload> => {
		const forgotUserPasswordRes = await requests.get(
			`/api/users/forgot-password/${email}`
		);
		return forgotUserPasswordRes;
	},

	// resend otp
	resendOTP: async (email: string): Promise<resposnePayload> => {
		const resendOTPRes = await requests.get('/api/users/send-otp-mail/' + email);
		return resendOTPRes;
	},

	// verify OTP
	verifyOTP: async (otp: string, email: string): Promise<resposnePayload> => {
		const verifyOTPRes = await requests.get(
			`/api/users/verify-email/${otp}/${email}`
		);
		return verifyOTPRes;
	},

	//logout user
	logoutUser: async (): Promise<resposnePayload> => {
		try {
			console.log("Logout process started");
			const logoutUserRes = await requests.put('/api/users/logout', {});

			// Clear all storage immediately
			window.localStorage.removeItem('_digi_user');
			window.localStorage.removeItem('_digi_auth_token');
			window.localStorage.removeItem('_digi_cart'); // Also clear cart during logout

			// Clear auth headers
			delete axios.defaults.headers.common['Authorization'];
			console.log('User logged out, auth token removed');

			// Force reload the page to clear any state
			window.location.href = '/auth';

			return logoutUserRes;
		} catch (error) {
			console.error('Logout error:', error);
			// Even if API call fails, clear local storage and redirect
			window.localStorage.removeItem('_digi_user');
			window.localStorage.removeItem('_digi_auth_token');
			window.localStorage.removeItem('_digi_cart');
			delete axios.defaults.headers.common['Authorization'];
			window.location.href = '/auth';
			throw error;
		}
	},
};
