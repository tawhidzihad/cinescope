'use client';

// ==========================================================================
// Route Error Boundary — user-safe message with retry
// ==========================================================================

export default function Error({ error, reset }) {
    return (
        <main className="container not-found-container">
            <div className="not-found-card">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2>Something went wrong</h2>
                <p>We couldn't load this content. The service may be temporarily unavailable.</p>
                <button type="button" className="btn btn-primary" onClick={() => reset()}>
                    Try again
                </button>
            </div>
        </main>
    );
}