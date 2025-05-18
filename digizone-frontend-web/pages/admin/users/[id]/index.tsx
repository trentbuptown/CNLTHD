import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/Admin/AdminLayout';
import { Button, Card, Row, Col, Badge, Modal, Spinner } from 'react-bootstrap';
import { PencilFill, Trash, ArrowLeft } from 'react-bootstrap-icons';
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

const UserDetails = () => {
    const { addToast } = useToasts();
    const router = useRouter();
    const { id } = router.query;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Get user details
    useEffect(() => {
        if (id) {
            fetchUserDetails();
        }
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/api/users/admin/users/${id}`);

            if (response.data && response.data.success) {
                setUser(response.data.user);
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
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const baseUrl = getBaseUrl();
            const response = await axios.delete(`${baseUrl}/api/users/admin/users/${id}`);

            if (response.data && response.data.success) {
                addToast('User deleted successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
                router.push('/admin/users');
            } else {
                throw new Error(response.data.message || 'Failed to delete user');
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            addToast(error.response?.data?.message || 'Failed to delete user. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <AdminLayout title="User Details">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">User Details</h5>
                        <Link href="/admin/users">
                            <Button variant="outline-secondary" size="sm">
                                <ArrowLeft className="me-1" /> Back to Users
                            </Button>
                        </Link>
                    </div>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading user details...</p>
                        </div>
                    ) : user ? (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">Name</h6>
                                        <p className="mb-0 fs-5">{user.name}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">Email</h6>
                                        <p className="mb-0 fs-5">{user.email}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">Role</h6>
                                        <Badge bg={user.role === 'admin' ? 'danger' : 'info'} className="fs-6">
                                            {user.role}
                                        </Badge>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">Status</h6>
                                        <Badge bg={user.active ? 'success' : 'secondary'} className="fs-6">
                                            {user.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">Joined Date</h6>
                                        <p className="mb-0">{new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-1">User ID</h6>
                                        <p className="mb-0 small text-muted">{user._id}</p>
                                    </div>
                                </Col>
                            </Row>

                            <hr />

                            <div className="d-flex justify-content-end mt-4">
                                <Link href={`/admin/users/${user._id}/edit`}>
                                    <Button variant="primary" className="me-2">
                                        <PencilFill className="me-1" /> Edit User
                                    </Button>
                                </Link>
                                <Button
                                    variant="danger"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash className="me-1" /> Delete User
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5">
                            <p>User not found.</p>
                            <Button
                                variant="primary"
                                onClick={() => router.push('/admin/users')}
                            >
                                Back to Users
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {user && (
                        <p>
                            Are you sure you want to delete the user <strong>{user.name}</strong>?
                            <br />
                            <span className="text-danger">This action cannot be undone.</span>
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-1"
                                />
                                Deleting...
                            </>
                        ) : (
                            'Delete User'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
};

export default UserDetails; 