'use client';

// ==========================================================================
// Trailer Modal — YouTube embed with accessible close behavior
// ==========================================================================
// Never fabricates trailer IDs: the parent only opens this modal when a real
// trailerKey/trailerUrl exists (migrated from trailer-player.js).

import { useEffect, useCallback } from 'react';

export default function TrailerModal({ movie, onClose }) {
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    const embedUrl = movie.trailerKey
        ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&rel=0`
        : movie.trailerUrl;

    return (
        <div className="trailer-backdrop" role="dialog" aria-modal="true" aria-label={`${movie.title} trailer`}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div className="trailer-dialog">
                <button type="button" className="trailer-close-btn" aria-label="Close trailer" onClick={onClose}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
                <div className="trailer-player-wrapper">
                    <iframe
                        src={embedUrl}
                        title={`${movie.title} — Official Trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}