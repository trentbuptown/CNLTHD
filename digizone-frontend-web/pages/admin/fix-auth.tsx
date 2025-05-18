import React, { useContext, useEffect } from 'react';
import { Card, Container, Spinner } from 'react-bootstrap';
import { Context } from '../../context';
import axios from 'axios';
import { useRouter } from 'next/router';

const AdminAuthFix = () => {
    const { dispatch } = useContext(Context);
    const router = useRouter();

    useEffect(() => {
        // Automatically fix admin authentication
        const fixAuth = async () => {
            try {
                // Get current user data
                const token = localStorage.getItem('_digi_auth_token');
                const userData = JSON.parse(localStorage.getItem('_digi_user') || '{}');

                console.log('Current user data:', userData);
                console.log('Token exists:', Boolean(token));

                if (!token) {
                    console.log('No token found - redirecting to login');
                    router.push('/auth');
                    return;
                }

                // Fix: Set up user with admin role
                const fixedUserData = {
                    ...userData,
                    role: "admin",
                    isAdmin: true
                };

                // Store the fixed data
                localStorage.setItem('_digi_user', JSON.stringify(fixedUserData));

                // Update axios headers
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Update context
                dispatch({
                    type: 'LOGIN',
                    payload: fixedUserData
                });

                console.log('Authentication fixed. Redirecting to admin...');

                // Add a small delay before redirecting
                setTimeout(() => {
                    router.push('/admin');
                }, 1500);
            } catch (error) {
                console.error('Failed to fix authentication:', error);
                router.push('/auth');
            }
        };

        fixAuth();
    }, [dispatch, router]);

    return (
        <Container className="py-5 text-center">
            <Card className="p-5 shadow">
                <Card.Body>
                    <h2 className="mb-4">Fixing Admin Authentication...</h2>
                    <Spinner animation="border" variant="primary" className="mb-4" />
                    <p className="text-muted">
                        Please wait while we fix your admin authentication.
                        You'll be redirected automatically.
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminAuthFix; 