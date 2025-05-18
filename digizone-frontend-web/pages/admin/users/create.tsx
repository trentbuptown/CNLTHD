import React, { useState } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../services/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

const CreateUser = () => {
    const { addToast } = useToasts();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const { name, email, password, role } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            const response = await axios.post(`${baseUrl}/api/users/register`, {
                name,
                email,
                password,
                role
            });

            if (response.data && response.data.success) {
                addToast('User created successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
                router.push('/admin/users');
            } else {
                throw new Error(response.data.message || 'Failed to create user');
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            addToast(error.response?.data?.message || 'Failed to create user. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Create New User">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Create New User</h5>
                        <Link href="/admin/users">
                            <Button variant="outline-secondary" size="sm">
                                Back to Users
                            </Button>
                        </Link>
                    </div>
                </Card.Header>
                <Card.Body>
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
                                    placeholder="Enter password (minimum 6 characters)"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    minLength={6}
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please provide a password (minimum 6 characters).
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
                                        Creating...
                                    </>
                                ) : (
                                    'Create User'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </AdminLayout>
    );
};

export default CreateUser; 