import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/Admin/AdminLayout';
import { Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../../services/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

const EditUser = () => {
    const { addToast } = useToasts();
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(true);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        active: true
    });

    // Get user details
    useEffect(() => {
        if (id) {
            fetchUserDetails();
        }
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            setFetchingUser(true);
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/api/users/admin/users/${id}`);

            if (response.data && response.data.success) {
                const userData = response.data.user;
                setFormData({
                    name: userData.name,
                    email: userData.email,
                    password: '',
                    role: userData.role,
                    active: userData.active
                });
            } else {
                throw new Error(response.data.message || 'Failed to fetch user details');
            }
        } catch (error: any) {
            console.error('Error fetching user details:', error);
            addToast(error.response?.data?.message || 'Failed to fetch user details. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
            router.push('/admin/users');
        } finally {
            setFetchingUser(false);
        }
    };

    const { name, email, password, role, active } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        if (!form.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        try {
            const baseUrl = getBaseUrl();
            const updateData: any = {
                name,
                email,
                role,
                active
            };

            // Only include password if it was modified
            if (password) {
                updateData.password = password;
            }

            const response = await axios.put(`${baseUrl}/api/users/admin/users/${id}`, updateData);

            if (response.data && response.data.success) {
                addToast('User updated successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
                router.push('/admin/users');
            } else {
                throw new Error(response.data.message || 'Failed to update user');
            }
        } catch (error: any) {
            console.error('Error updating user:', error);
            addToast(error.response?.data?.message || 'Failed to update user. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Edit User">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Edit User</h5>
                        <Link href="/admin/users">
                            <Button variant="outline-secondary" size="sm">
                                Back to Users
                            </Button>
                        </Link>
                    </div>
                </Card.Header>
                <Card.Body>
                    {fetchingUser ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading user details...</p>
                        </div>
                    ) : (
                        <Form noValidate validated={validated} onSubmit={handleSubmit}>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={2}>Name</Form.Label>
                                <Col sm={10}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter full name"
                                        name="name"
                                        value={name}
                                        onChange={onChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please provide a name.
                                    </Form.Control.Feedback>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={2}>Email</Form.Label>
                                <Col sm={10}>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please provide a valid email.
                                    </Form.Control.Feedback>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={2}>Password</Form.Label>
                                <Col sm={10}>
                                    <Form.Control
                                        type="password"
                                        placeholder="Leave blank to keep current password"
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        minLength={6}
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank to keep the current password. Minimum 6 characters if changing.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        Password must be at least 6 characters.
                                    </Form.Control.Feedback>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={2}>Role</Form.Label>
                                <Col sm={10}>
                                    <Form.Select
                                        name="role"
                                        value={role}
                                        onChange={onChange}
                                        required
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={2}>Status</Form.Label>
                                <Col sm={10}>
                                    <Form.Check
                                        type="switch"
                                        id="user-status"
                                        name="active"
                                        label={active ? "Active" : "Inactive"}
                                        checked={active}
                                        onChange={onChange}
                                    />
                                </Col>
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="secondary"
                                    className="me-2"
                                    onClick={() => router.push('/admin/users')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-1"
                                            />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update User'
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </AdminLayout>
    );
};

export default EditUser; 