import React, { useContext, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Card, Col, Form, Row } from 'react-bootstrap';
import RegisterLogin from '../components/Auth/RegisterLogin';
import { Context } from '../context';
import { useRouter } from 'next/router';

const Auth = () => {
	const { state: { user } } = useContext(Context);
	const router = useRouter();

	useEffect(() => {
		// Check localStorage directly to avoid stale context
		const storedUser = localStorage.getItem('_digi_user');
		if (storedUser && Object.keys(JSON.parse(storedUser || '{}')).length > 0) {
			// If there's a stored user, clear it to force a clean login
			localStorage.removeItem('_digi_user');
			localStorage.removeItem('_digi_auth_token');
		}
	}, []);

	return (
		<Row>
			<Col sm={6} className="mt-3">
				<RegisterLogin />
			</Col>
			<Col sm={6} className="mt-3">
				<RegisterLogin isResgisterForm={true} />
			</Col>
		</Row>
	);
};

export default Auth;
