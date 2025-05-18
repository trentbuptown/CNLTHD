import React, { FC, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Card, Form } from 'react-bootstrap';
import { resposnePayload } from '../../services/api';
import { Users } from '../../services/user.service';
interface IAccountDetailsProps {
	user: Record<string, any>;
	dispatch: any;
	addToast: any;
}
const AccountDetails: FC<IAccountDetailsProps> = ({
	user,
	dispatch,
	addToast,
}) => {
	const [accountForm, setAccountForm] = React.useState({
		name: user?.name || '',
		phone: user?.phone || '',
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [isLoading, setIsLoading] = React.useState(false);
	const [isPasswordDirty, setIsPasswordDirty] = React.useState(false);

	// Update form when user prop changes
	useEffect(() => {
		setAccountForm(prev => ({
			...prev,
			name: user?.name || '',
			phone: user?.phone || ''
		}));
	}, [user]);

	const updateUserAccount = async (e: any) => {
		e.preventDefault();
		try {
			const { name, phone, oldPassword, newPassword, confirmPassword } = accountForm;

			// Only validate password fields if any password field is filled
			const isChangingPassword = oldPassword || newPassword || confirmPassword;

			if (isChangingPassword) {
				if (!oldPassword) {
					throw new Error('Please enter your current password');
				}

				if (!newPassword) {
					throw new Error('Please enter your new password');
				}

				if (newPassword.length < 6) {
					throw new Error('Password is too short. Minimum 6 characters');
				}

				if (newPassword !== confirmPassword) {
					throw new Error('New password and confirmation do not match');
				}
			}

			setIsLoading(true);

			// Build payload based on what's being updated
			const payload: Record<string, any> = {
				name,
				phone
			};

			// Only include password fields if updating password
			if (isChangingPassword) {
				payload.password = newPassword;
				payload.oldPassword = oldPassword;
			}

			// Call the profile update API
			const response = await Users.updateUserProfile(payload);
			const { success, message } = response;

			if (!success) throw new Error(message);

			// Get the updated user data from the response
			const updatedUser = response.user || {};

			// Update the user in context
			dispatch({
				type: 'UPDATE_USER',
				payload: updatedUser,
			});

			// Reset form, especially password fields
			setAccountForm({
				name: updatedUser.name || name,
				phone: updatedUser.phone || phone,
				oldPassword: '',
				newPassword: '',
				confirmPassword: '',
			});

			setIsPasswordDirty(false);
			addToast(message || 'Profile updated successfully', { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			console.error('Error updating profile:', error);
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

	const handlePasswordChange = (field: string, value: string) => {
		// Mark password as dirty when any password field is modified
		if (!isPasswordDirty && value) {
			setIsPasswordDirty(true);
		}

		setAccountForm({ ...accountForm, [field]: value });
	};

	return (
		<Card className='mt-3'>
			<Card.Header>Account Details</Card.Header>
			<Card.Body>
				<Form onSubmit={updateUserAccount}>
					<Form.Group className='mb-3' controlId='fullName'>
						<Form.Label>Full name</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter your full name'
							value={accountForm.name}
							onChange={(e) =>
								setAccountForm({ ...accountForm, name: e.target.value })
							}
						/>
					</Form.Group>
					<Form.Group className='mb-3' controlId='phone'>
						<Form.Label>Phone number</Form.Label>
						<Form.Control
							type='tel'
							placeholder='Enter your phone number'
							value={accountForm.phone}
							onChange={(e) =>
								setAccountForm({ ...accountForm, phone: e.target.value })
							}
						/>
					</Form.Group>
					<Form.Group className='mb-3' controlId='email'>
						<Form.Label>Email address</Form.Label>
						<Form.Control
							type='email'
							placeholder='name@example.com'
							disabled={true}
							value={user?.email}
						/>
						<Form.Text className="text-muted">
							Email cannot be changed
						</Form.Text>
					</Form.Group>

					<h5 className="mt-4">Change Password</h5>
					<p className="text-muted small">Leave fields empty if you don't want to change your password</p>

					<Form.Group className='mb-3' controlId='oldPassword'>
						<Form.Label>Current Password</Form.Label>
						<Form.Control
							type='password'
							placeholder='Enter your current password'
							onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
							value={accountForm.oldPassword}
							isInvalid={isPasswordDirty && !accountForm.oldPassword}
						/>
						{isPasswordDirty && !accountForm.oldPassword && (
							<Form.Control.Feedback type="invalid">
								Current password is required to set a new password
							</Form.Control.Feedback>
						)}
					</Form.Group>
					<Form.Group className='mb-3' controlId='newPassword'>
						<Form.Label>New Password</Form.Label>
						<Form.Control
							type='password'
							placeholder='Enter your new password'
							onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
							value={accountForm.newPassword}
							isInvalid={isPasswordDirty && (!accountForm.newPassword || accountForm.newPassword.length < 6)}
						/>
						{isPasswordDirty && accountForm.newPassword && accountForm.newPassword.length < 6 && (
							<Form.Control.Feedback type="invalid">
								Password must be at least 6 characters
							</Form.Control.Feedback>
						)}
					</Form.Group>
					<Form.Group className='mb-3' controlId='confirmPassword'>
						<Form.Label>Confirm New Password</Form.Label>
						<Form.Control
							type='password'
							placeholder='Confirm your new password'
							onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
							value={accountForm.confirmPassword}
							isInvalid={isPasswordDirty && accountForm.newPassword !== accountForm.confirmPassword}
						/>
						{isPasswordDirty && accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword && (
							<Form.Control.Feedback type="invalid">
								Passwords do not match
							</Form.Control.Feedback>
						)}
					</Form.Group>
					<Form.Group className='mb-3'>
						<Button
							variant='primary'
							type='submit'
							className='btnAuth'
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'
									></span>
									Updating...
								</>
							) : 'Update Profile'}
						</Button>
					</Form.Group>
				</Form>
			</Card.Body>
		</Card>
	);
};

export default AccountDetails;
