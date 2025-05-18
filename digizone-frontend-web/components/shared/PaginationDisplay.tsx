import { useRouter } from 'next/router';
import { FC } from 'react';
import { Pagination } from 'react-bootstrap';

interface IPaginationProps {
	metadata: Record<string, any>;
}

const PaginationDisplay: FC<IPaginationProps> = ({ metadata }) => {
	const router = useRouter();

	const handlePageChange = (page: number) => {
		const currentQuery = { ...router.query };
		currentQuery.page = page.toString();
		router.push({
			pathname: router.pathname,
			query: currentQuery,
		});
	};

	// Generate an array of page numbers to display
	const getPageNumbers = () => {
		const totalPages = metadata?.totalPages || 0;
		const currentPage = metadata?.currentPage || 1;
		const pageNumbers = [];

		// Show max 5 pages with current page in the middle when possible
		const maxPagesToShow = 5;
		let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
		let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

		// Adjust start page if end page is maxed out
		if (endPage === totalPages) {
			startPage = Math.max(1, endPage - maxPagesToShow + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(i);
		}

		return pageNumbers;
	};

	return (
		<>
			<Pagination style={{ float: 'right', marginTop: '20px' }}>
				<Pagination.First
					disabled={metadata?.currentPage <= 1}
					onClick={() => handlePageChange(1)}
				/>
				<Pagination.Prev
					disabled={metadata?.currentPage <= 1}
					onClick={() => handlePageChange(metadata.currentPage - 1)}
				/>

				{getPageNumbers().map(page => (
					<Pagination.Item
						key={page}
						active={page === metadata?.currentPage}
						onClick={() => handlePageChange(page)}
					>
						{page}
					</Pagination.Item>
				))}

				<Pagination.Next
					disabled={metadata?.currentPage >= metadata?.totalPages}
					onClick={() => handlePageChange(metadata.currentPage + 1)}
				/>
				<Pagination.Last
					disabled={metadata?.currentPage >= metadata?.totalPages}
					onClick={() => handlePageChange(metadata.totalPages)}
				/>
			</Pagination>
			<div className='row h-100'>
				<div className='col-sm-12 my-auto'>
					<div
						style={{
							float: 'right',
							color: '#2b7fe0',
							fontSize: '13px',
						}}
					>
						Showing {((metadata?.currentPage - 1) * metadata?.limit) + 1} - {Math.min(metadata?.currentPage * metadata?.limit, metadata?.totalProducts)} of {metadata?.totalProducts} products
					</div>
				</div>
			</div>
		</>
	);
};

export default PaginationDisplay;
