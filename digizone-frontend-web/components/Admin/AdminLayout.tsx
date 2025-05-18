import React, { useContext, useEffect } from 'react';
import { Container, Nav, Row, Col, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { Context } from '../../context';
import Link from 'next/link';
import {
    BarChart,
    People,
    Box,
    Cart,
    House,
    GearWide,
    ArrowLeft
} from 'react-bootstrap-icons';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
    const router = useRouter();
    const {
        state: { user },
    } = useContext(Context);

    useEffect(() => {
        try {
            // Log user details for debugging
            console.log('Admin check - Current user:', user);
            console.log('Admin check - User role:', user?.role);

            // Check if user is logged in - this is critical
            const localUserData = JSON.parse(localStorage.getItem('_digi_user') || '{}');
            const hasLocalData = localUserData && Object.keys(localUserData).length > 0;

            if (!user && !hasLocalData) {
                console.log('Admin check failed: No user logged in anywhere');
                router.push('/auth');
                return;
            }

            // If context user is empty but localStorage has data, use local data
            const effectiveUser = user || localUserData;
            console.log('Using effective user data:', effectiveUser);

            // Check if user has admin privileges (more flexible check)
            // Accept 'admin', 'ADMIN', etc.
            const isAdmin = effectiveUser.role &&
                (effectiveUser.role.toLowerCase() === 'admin' ||
                    effectiveUser.isAdmin === true);

            if (!isAdmin) {
                console.log('Admin check failed: User is not an admin. Role =', effectiveUser.role);
                console.log('Redirecting to auth page - unauthorized access');
                router.push('/auth');
                return;
            }

            console.log('Admin check passed - User has admin access');
        } catch (error) {
            // If any error occurs during admin check, redirect to auth
            console.error('Error in Admin layout auth check:', error);
            router.push('/auth');
        }
    }, [user, router]);

    const isActive = (path: string) => {
        return router.pathname === path || router.pathname.startsWith(`${path}/`);
    };

    // Only render content if user is authenticated and admin
    const isAuthorized = user && (
        user.role?.toLowerCase() === 'admin' ||
        user.role?.toLowerCase() === 'administrator' ||
        user.isAdmin === true ||
        // Check for different formats of admin role that the backend might send
        user.type?.toLowerCase() === 'admin' ||
        user.userType?.toLowerCase() === 'admin'
    );

    if (!isAuthorized && !router.pathname.includes('/auth')) {
        // Show minimal loading state
        return (
            <Container fluid className="p-5 text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Verifying admin access...</p>
                <div className="mt-3">
                    <p className="text-muted">If you're experiencing issues, please contact the administrator.</p>
                    <Button
                        variant="outline-primary"
                        onClick={() => router.push('/auth')}
                    >
                        Back to Login
                    </Button>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="admin-layout p-0">
            <Row className="g-0">
                {/* Sidebar */}
                <Col md={2} className="admin-sidebar bg-dark text-white min-vh-100 py-4">
                    <div className="text-center mb-4">
                        <h4>DigiZone Admin</h4>
                    </div>
                    <Nav className="flex-column">
                        <Link href="/admin" passHref>
                            <Nav.Link className={isActive('/admin') ? 'active' : ''}>
                                <BarChart className="me-2" />
                                Dashboard
                            </Nav.Link>
                        </Link>
                        <Link href="/admin/products" passHref>
                            <Nav.Link className={isActive('/admin/products') ? 'active' : ''}>
                                <Box className="me-2" />
                                Products
                            </Nav.Link>
                        </Link>
                        <Link href="/admin/orders" passHref>
                            <Nav.Link className={isActive('/admin/orders') ? 'active' : ''}>
                                <Cart className="me-2" />
                                Orders
                            </Nav.Link>
                        </Link>
                        <Link href="/admin/users" passHref>
                            <Nav.Link className={isActive('/admin/users') ? 'active' : ''}>
                                <People className="me-2" />
                                Users
                            </Nav.Link>
                        </Link>
                        <Link href="/admin/settings" passHref>
                            <Nav.Link className={isActive('/admin/settings') ? 'active' : ''}>
                                <GearWide className="me-2" />
                                Settings
                            </Nav.Link>
                        </Link>
                        <Link href="/admin/connection-test" passHref>
                            <Nav.Link className={isActive('/admin/connection-test') ? 'active' : ''}>
                                <i className="me-2 bi bi-hdd-network"></i>
                                Services Test
                            </Nav.Link>
                        </Link>
                        <hr />
                        <Link href="/" passHref>
                            <Nav.Link>
                                <ArrowLeft className="me-2" />
                                Back to Main Site
                            </Nav.Link>
                        </Link>
                    </Nav>
                </Col>

                {/* Main Content */}
                <Col md={10} className="admin-content p-4">
                    <div className="content-header mb-4 d-flex justify-content-between align-items-center">
                        <h2>{title}</h2>
                        {user && (
                            <div className="user-info text-end">
                                <span className="me-2">Welcome, {user.name}</span>
                            </div>
                        )}
                    </div>
                    <div className="content-body">
                        {children}
                    </div>
                </Col>
            </Row>

            <style jsx global>{`
        .admin-sidebar .nav-link {
          color: rgba(255, 255, 255, 0.75);
          padding: 0.8rem 1rem;
          border-radius: 4px;
          margin-bottom: 0.25rem;
        }
        .admin-sidebar .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .admin-sidebar .nav-link.active {
          background-color: #0d6efd;
          color: white;
        }
        .content-header {
          border-bottom: 1px solid #ddd;
          padding-bottom: 1rem;
        }
      `}</style>
        </Container>
    );
};

export default AdminLayout; 