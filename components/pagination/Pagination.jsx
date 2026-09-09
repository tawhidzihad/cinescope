// ==========================================================================
// Pagination — server-rendered link-based pagination with ellipsis
// ==========================================================================
// Ellipsis range logic migrated from js/components/pagination.js
// (getVisiblePageItems). Page changes are URL navigations, so the data is
// always fetched and paginated server-side.

import Link from 'next/link';

export function getVisiblePageItems(currentPage, totalPages, siblingCount = 2) {
    if (totalPages <= 0) return [];

    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => ({
            type: 'page',
            page: index + 1
        }));
    }

    const pages = new Set([1, totalPages, currentPage]);

    for (let offset = 1; offset <= siblingCount; offset += 1) {
        if (currentPage - offset >= 1) pages.add(currentPage - offset);
        if (currentPage + offset <= totalPages) pages.add(currentPage + offset);
    }

    if (currentPage <= siblingCount + 2) {
        for (let page = 1; page <= Math.min(5, totalPages); page += 1) {
            pages.add(page);
        }
    }

    if (currentPage >= totalPages - siblingCount - 1) {
        for (let page = Math.max(1, totalPages - 4); page <= totalPages; page += 1) {
            pages.add(page);
        }
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const items = [];
    let previous = 0;

    for (const page of sorted) {
        if (previous && page - previous > 1) {
            items.push({ type: 'ellipsis' });
        }
        items.push({ type: 'page', page });
        previous = page;
    }

    return items;
}

function buildPageHref(basePath, searchParams, page) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
        params.delete('page');
    } else {
        params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ basePath = '/movies', searchParams = {}, pagination }) {
    const { page: currentPage, totalPages } = pagination;

    if (!totalPages || totalPages <= 1) {
        return null;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, value);
    }
    const normalizedSearchParams = params;
    const items = getVisiblePageItems(currentPage, totalPages);

    return (
        <nav className="pagination" aria-label="Movie pagination">
            <Link
                href={buildPageHref(basePath, normalizedSearchParams, currentPage - 1)}
                className={`pagination-nav${currentPage <= 1 ? ' is-disabled' : ''}`}
                aria-label="Previous page"
                aria-disabled={currentPage <= 1}
                tabIndex={currentPage <= 1 ? -1 : 0}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="pagination-nav-label">Previous</span>
            </Link>

            <div className="pagination-pages" role="list">
                {items.map((item) => {
                    if (item.type === 'ellipsis') {
                        return (
                            <span key={`ellipsis-${item.page || 'e'}`} className="pagination-ellipsis"
                                aria-hidden="true">&hellip;</span>
                        );
                    }

                    const isCurrent = item.page === currentPage;
                    return (
                        <Link
                            key={item.page}
                            href={buildPageHref(basePath, normalizedSearchParams, item.page)}
                            className={`pagination-page${isCurrent ? ' is-current' : ''}`}
                            aria-label={`Go to page ${item.page}`}
                            aria-current={isCurrent ? 'page' : undefined}
                        >
                            {item.page}
                        </Link>
                    );
                })}
            </div>

            <Link
                href={buildPageHref(basePath, normalizedSearchParams, currentPage + 1)}
                className={`pagination-nav${currentPage >= totalPages ? ' is-disabled' : ''}`}
                aria-label="Next page"
                aria-disabled={currentPage >= totalPages}
                tabIndex={currentPage >= totalPages ? -1 : 0}
            >
                <span className="pagination-nav-label">Next</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </Link>
        </nav>
    );
}