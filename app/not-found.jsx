// ==========================================================================
// 404 — polished, branded, theme-compatible
// ==========================================================================

import Link from 'next/link';

export const metadata = {
    title: 'Page Not Found'
};

export default function NotFound() {
    return (
        <main className="container not-found-container">
            <div className="not-found-card">
                <span className="not-found-code">404</span>
                <h2>Page not found</h2>
                <p>The page or movie you are looking for doesn't exist or may have been removed.</p>
                <Link href="/" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Back to Movies
                </Link>
            </div>
        </main>
    );
}