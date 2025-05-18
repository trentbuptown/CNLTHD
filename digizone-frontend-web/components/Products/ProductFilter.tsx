import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { Card, Dropdown, DropdownButton, ListGroup } from 'react-bootstrap';
import styles from '../../styles/Product.module.css';

const ProductFilter = () => {
	const router = useRouter();
	const [filterCatText, setFilterCatText] = React.useState('Category');
	const [filterPlatformText, setFilterPlatformText] =
		React.useState('Platform');

	// Set initial filter text from URL params when component mounts
	useEffect(() => {
		const { category, platformType } = router.query;

		if (category) {
			setFilterCatText(
				String(category).includes('Application') ? 'Applications' :
					String(category) === 'Computer' ? 'Computer' :
						String(category) === 'Mobile' ? 'Mobile' : 'OS'
			);
		}

		if (platformType) {
			setFilterPlatformText(String(platformType));
		}

		console.log('Current router query params:', router.query);
	}, [router.query]);

	const handleCategorySelect = (e: string | null) => {
		console.log('Category selected:', e);

		if (e) {
			setFilterCatText(
				e.includes('Application') ? 'Applications' :
					e === 'Computer' ? 'Computer' :
						e === 'Mobile' ? 'Mobile' : 'OS'
			);

			// Update URL parameters
			const newQuery = { ...router.query };
			delete newQuery.offset;
			newQuery.category = e;

			console.log('New query params:', newQuery);
			router.push({
				pathname: router.pathname,
				query: newQuery
			});
		} else {
			// Reset category filter
			const newQuery = { ...router.query };
			delete newQuery.category;
			delete newQuery.offset;

			console.log('Reset category, new query:', newQuery);
			router.push({
				pathname: router.pathname,
				query: newQuery
			});
		}
	};

	const handlePlatformSelect = (e: string | null) => {
		console.log('Platform selected:', e);

		if (e) {
			setFilterPlatformText(e);

			// Update URL parameters
			const newQuery = { ...router.query };
			delete newQuery.offset;
			newQuery.platformType = e;

			console.log('New query params:', newQuery);
			router.push({
				pathname: router.pathname,
				query: newQuery
			});
		} else {
			// Reset platform filter
			const newQuery = { ...router.query };
			delete newQuery.platformType;
			delete newQuery.offset;

			console.log('Reset platform, new query:', newQuery);
			router.push({
				pathname: router.pathname,
				query: newQuery
			});
		}
	};

	return (
		<Card>
			<Card.Header>Filter By</Card.Header>
			<ListGroup variant='flush'>
				<ListGroup.Item>
					<DropdownButton
						variant='outline-secondary'
						title={filterCatText}
						id='input-group-dropdown-1'
						className={styles.dropdownFilterBtn}
						onSelect={handleCategorySelect}
					>
						<Dropdown.Item href='#' eventKey=''>
							Select category
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Operating System'>
							Operating System
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Application Software'>
							Application Software
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Computer'>
							Computer
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Mobile'>
							Mobile
						</Dropdown.Item>
					</DropdownButton>
				</ListGroup.Item>
				<ListGroup.Item>
					<DropdownButton
						variant='outline-secondary'
						title={filterPlatformText}
						id='input-group-dropdown-1'
						className={styles.dropdownFilterBtn}
						onSelect={handlePlatformSelect}
					>
						<Dropdown.Item href='#' eventKey=''>
							Select platform
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Windows'>
							Windows
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Android'>
							Android
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='iOS'>
							iOS
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Linux'>
							Linux
						</Dropdown.Item>
						<Dropdown.Item href='#' eventKey='Mac'>
							Mac
						</Dropdown.Item>
					</DropdownButton>
				</ListGroup.Item>
			</ListGroup>
		</Card>
	);
};

export default ProductFilter;
