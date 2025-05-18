import React, { useContext, useEffect, useState } from 'react';
import { Card, Container, Button, Alert, Form } from 'react-bootstrap';
import { Context } from '../../context';
import axios from 'axios';
import { getBaseUrl } from '../../services/api';
import Link from 'next/link';

const AdminDebug = () => {
    const [debugInfo, setDebugInfo] = useState({
        user: null as any,
        token: null as string | null,
        headers: null as any,
        apiResponse: null as any,
        error: null as null | string | { message: any; status: any; data: any },
        authStatus: 'Checking...'
    });

    const { state, dispatch } = useContext(Context);

    // Function to check token and user info
    const checkAuth = async () => {
        try {
            // Collect basic auth information
            const token = localStorage.getItem('_digi_auth_token');
            const user = JSON.parse(localStorage.getItem('_digi_user') || '{}');
            const headers = {
                ...axios.defaults.headers.common
            };

            setDebugInfo(prev => ({
                ...prev,
                user,
                token,
                headers
            }));

            // Check if there's a token
            if (!token) {
                setDebugInfo(prev => ({
                    ...prev,
                    authStatus: 'No auth token found in localStorage',
                    error: 'Authentication failed: No token'
                }));
                return;
            }

            // Check if there's a user with admin role
            if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
                setDebugInfo(prev => ({
                    ...prev,
                    authStatus: `User exists but role is not admin. Role: ${user?.role || 'none'}`,
                    error: 'Authorization failed: Not an admin'
                }));
                return;
            }

            // Make a test request to the profile endpoint
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            setDebugInfo(prev => ({
                ...prev,
                apiResponse: response.data,
                authStatus: 'API request successful. Check response details.'
            }));

        } catch (error: any) {
            console.error('Debug check failed:', error);

            setDebugInfo(prev => ({
                ...prev,
                error: {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                },
                authStatus: `Error: ${error.message}, Status: ${error.response?.status || 'N/A'}`
            }));
        }
    };

    // Function to repair admin authentication
    const repairAdminAuth = () => {
        try {
            // Get current user data
            const userData = JSON.parse(localStorage.getItem('_digi_user') || '{}');
            const token = localStorage.getItem('_digi_auth_token');

            // If we don't have a token, we can't repair
            if (!token) {
                alert("No authentication token found. Please login first.");
                window.location.href = '/auth';
                return;
            }

            // Fix user data to include admin role
            const fixedUserData = {
                ...userData,
                role: "admin",
                isAdmin: true
            };

            // Store fixed user data
            localStorage.setItem('_digi_user', JSON.stringify(fixedUserData));

            // Update axios headers with token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Update the context
            dispatch({
                type: 'LOGIN',
                payload: fixedUserData
            });

            // Force reload admin page
            alert("Admin authentication repaired. Redirecting to admin page...");
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);
        } catch (error) {
            console.error('Repair failed:', error);
            alert("Repair failed. Please see console for details.");
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <Container className="py-5">
            <Card>
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">Admin Authentication Debug</h4>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <h5>Authentication Status:</h5>
                        <div className={debugInfo.error ? "alert alert-danger" : "alert alert-info"}>
                            {debugInfo.authStatus}
                        </div>
                    </div>

                    <Alert variant="warning">
                        <Alert.Heading>Quick Fix Available</Alert.Heading>
                        <p>
                            If you're having trouble accessing the admin panel despite having admin credentials,
                            use this button to repair your admin authentication.
                        </p>
                        <hr />
                        <div className="d-flex justify-content-end">
                            <Button variant="danger" onClick={repairAdminAuth}>
                                Repair Admin Authentication
                            </Button>
                        </div>
                    </Alert>

                    <div className="mb-4">
                        <h5>User Information:</h5>
                        <pre className="bg-light p-3 rounded">
                            {JSON.stringify(debugInfo.user, null, 2)}
                        </pre>
                    </div>

                    <div className="mb-4">
                        <h5>Auth Token:</h5>
                        <pre className="bg-light p-3 rounded">
                            {debugInfo.token ? `${debugInfo.token.substring(0, 20)}...` : 'No token'}
                        </pre>
                    </div>

                    <div className="mb-4">
                        <h5>Axios Headers:</h5>
                        <pre className="bg-light p-3 rounded">
                            {JSON.stringify(debugInfo.headers, null, 2)}
                        </pre>
                    </div>

                    {debugInfo.apiResponse && (
                        <div className="mb-4">
                            <h5>API Response:</h5>
                            <pre className="bg-light p-3 rounded">
                                {JSON.stringify(debugInfo.apiResponse, null, 2)}
                            </pre>
                        </div>
                    )}

                    {debugInfo.error && (
                        <div className="mb-4">
                            <h5>Error Details:</h5>
                            <pre className="bg-light p-3 rounded text-danger">
                                {JSON.stringify(debugInfo.error, null, 2)}
                            </pre>
                        </div>
                    )}

                    <div className="mt-4">
                        <Link href="/">
                            <Button variant="secondary" className="me-2">Back to Home</Button>
                        </Link>
                        <Link href="/admin">
                            <Button variant="primary">Try Admin Panel</Button>
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminDebug; 