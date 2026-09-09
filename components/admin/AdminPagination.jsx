'use client';

// ==========================================================================
// Admin Pagination — server-backed page navigation with ellipsis
// ==========================================================================

import { getVisiblePageItems } from '@/components/pagination/Pagination';

export default function AdminPagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
    if (!totalPages || totalPages <= 1) {
        if (!totalItems) return null;
        return <p className="admin-pagination-info">{totalItems} item(s)</p>;
    }

    const items = getVisiblePageItems(page, totalPages);

    return (
        <nav className="pagination admin-pagination" aria-label="Admin pagination">
            <button
                type="button"
                className="pagination-nav"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="pagination-nav-label">Previous</span>
            </button>

            <div className="pagination-pages" role="list">
                {items.map((item) => {
                    if (item.type === 'ellipsis') {
                        return <span key={`e${item.page || ''}`} className="pagination-ellipsis"
                            aria-hidden="true">&hellip;</span>;
                    }
                    return (
                        <button
                            key={item.page}
                            type="button"
                            className={`pagination-page${item.page === page ? ' is-current' : ''}`}
                            onClick={() => onPageChange(item.page)}
                            aria-label={`Go to page ${item.page}`}
                            aria-current={item.page === page ? 'page' : undefined}
                        >
                            {item.page}
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                className="pagination-nav"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
            >
                <span className="pagination-nav-label">Next</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </nav>
    );
}