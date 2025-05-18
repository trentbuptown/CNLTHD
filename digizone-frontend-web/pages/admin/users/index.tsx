import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { Button, Card, Table, Form, InputGroup, Badge, Modal, Row, Col } from 'react-bootstrap';
import { Search, Pencil, Lock, Unlock, Eye, Trash, PlusCircle } from 'react-bootstrap-icons';
import Link from 'next/link';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../services/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

const AdminUsers = () => {
    const { addToast } = useToasts();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/api/users/admin/users`);

            if (response.data && response.data.success) {
                setUsers(response.data.users || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            addToast('Failed to load users. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleUpdate = async () => {
        if (!selectedUser || !newRole) return;

        try {
            const baseUrl = getBaseUrl();
            const response = await axios.put(`${baseUrl}/api/users/admin/users/${selectedUser._id}/role`, {
                role: newRole
            });

            if (response.data && response.data.success) {
                // Update the user role in the local state
                setUsers(prevUsers => prevUsers.map(user =>
                    user._id === selectedUser._id ? { ...user, role: newRole } : user
                ));

                addToast('User role updated successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response.data.message || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            addToast('Failed to update user role. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setShowRoleModal(false);
            setSelectedUser(null);
            setNewRole('');
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const baseUrl = getBaseUrl();
            const response = await axios.put(`${baseUrl}/api/users/admin/users/${userId}/status`, {
                active: !currentStatus
            });

            if (response.data && response.data.success) {
                // Update the user status in the local state
                setUsers(prevUsers => prevUsers.map(user =>
                    user._id === userId ? { ...user, active: !currentStatus } : user
                ));

                addToast(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response.data.message || 'Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            addToast('Failed to update user status. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        }
    };

    const openRoleModal = (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const confirmDeleteUser = (userId: string) => {
        setUserIdToDelete(userId);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = async () => {
        if (!userIdToDelete) return;

        try {
            setDeleting(true);
            const baseUrl = getBaseUrl();
            const response = await axios.delete(`${baseUrl}/api/users/admin/users/${userIdToDelete}`);

            if (response.data && response.data.success) {
                // Remove the user from the local state
                setUsers(prevUsers => prevUsers.filter(user => user._id !== userIdToDelete));

                addToast('User deleted successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            addToast('Failed to delete user. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setShowDeleteModal(false);
            setUserIdToDelete(null);
            setDeleting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout title="User Management">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">All Users</h5>
                        <Link href="/admin/users/create">
                            <Button variant="primary" size="sm">
                                <PlusCircle className="me-1" /> Create User
                            </Button>
                        </Link>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <InputGroup>
                            <InputGroup.Text>
                                <Search />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading users...</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user._id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <Badge bg={user.role === 'admin' ? 'danger' : 'info'}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={user.active ? 'success' : 'secondary'}>
                                                        {user.active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <Link href={`/admin/users/${user._id}`}>
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            className="me-1"
                                                        >
                                                            <Eye />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/users/${user._id}/edit`}>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-1"
                                                        >
                                                            <Pencil />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant={user.active ? "outline-danger" : "outline-success"}
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => toggleUserStatus(user._id, user.active)}
                                                    >
                                                        {user.active ? <Lock /> : <Unlock />}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => confirmDeleteUser(user._id)}
                                                    >
                                                        <Trash />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4">
                                                {searchTerm ? 'No users match your search.' : 'No users found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Role Change Modal */}
            <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Change User Role</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <>
                            <p>
                                Changing role for user: <strong>{selectedUser.name}</strong>
                                <br />
                                <small className="text-muted">{selectedUser.email}</small>
                            </p>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={3}>Role:</Form.Label>
                                <Col sm={9}>
                                    <Form.Select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleRoleUpdate}>
                        Update Role
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to delete this user?
                        <br />
                        <span className="text-danger">This action cannot be undone.</span>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteUser}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete User'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
};

export default AdminUsers; 