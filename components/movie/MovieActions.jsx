'use client';

// ==========================================================================
// Movie Actions — watchlist toggle + trailer modal trigger (client-only)
// ==========================================================================
// Preserves existing behavior: real trailer plays; missing trailer shows a
// toast; deleted movies are handled gracefully by the watchlist module.

import { useEffect, useState, useCallback } from 'react';
import {
    isInWatchlist,
    toggleWatchlist,
    notifyWatchlistChanged
} from '@/lib/watchlist';
import { useToast } from '@/components/ui/Toast';
import TrailerModal from './TrailerModal';

export default function MovieActions({ movie }) {
    const show = useToast();
    const [inWatchlist, setInWatchlist] = useState(false);
    const [trailerOpen, setTrailerOpen] = useState(false);

    useEffect(() => {
        setInWatchlist(isInWatchlist(movie.slug));
    }, [movie.slug]);

    const handleWatchlist = useCallback(() => {
        const added = toggleWatchlist(movie);
        setInWatchlist(added);
        notifyWatchlistChanged();
        show({
            message: added
                ? `Added "${movie.title}" to your watchlist`
                : `Removed "${movie.title}" from your watchlist`,
            type: added ? 'success' : 'info'
        });
    }, [movie, show]);

    const handleTrailer = useCallback(() => {
        if (!movie.trailerKey && !movie.trailerUrl) {
            show({ message: 'No trailer available for this movie yet.', type: 'warning' });
            return;
        }
        setTrailerOpen(true);
    }, [movie, show]);

    return (
        <>
            <div className="detail-actions">
                <button type="button" className="btn btn-primary" onClick={handleTrailer}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Watch Trailer
                </button>
                <button
                    type="button"
                    className={`btn btn-secondary${inWatchlist ? ' is-active' : ''}`}
                    onClick={handleWatchlist}
                    aria-pressed={inWatchlist}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
            </div>

            {trailerOpen && (
                <TrailerModal
                    movie={movie}
                    onClose={() => setTrailerOpen(false)}
                />
            )}
        </>
    );
}