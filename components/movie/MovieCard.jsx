// ==========================================================================
// Movie Card — server component (static markup, links to detail page)
// ==========================================================================
// Migrated from js/components/movie-card.js. Clicking navigates to the
// server-rendered detail page instead of opening a client modal.

import Image from 'next/image';
import Link from 'next/link';

const FALLBACK_POSTER = '/images/poster-fallback.svg';

export default function MovieCard({ movie }) {
    const rating = typeof movie.rating === 'number' ? movie.rating.toFixed(1) : '—';
    const genres = (movie.genres || []).slice(0, 2);

    return (
        <article className="movie-card">
            <Link
                href={`/movie/${movie.slug}`}
                className="card-link"
                aria-label={`View details for ${movie.title} (${movie.year}), rated ${rating} out of 10`}
            >
                <div className="card-poster">
                    <Image
                        src={movie.poster || FALLBACK_POSTER}
                        alt={`Poster for ${movie.title}`}
                        fill
                        sizes="(max-width: 575.98px) 46vw, (max-width: 767.98px) 30vw, (max-width: 1023.98px) 22vw, 220px"
                        className="card-poster-img"
                    />
                    <div className="poster-overlay" />
                    <div className="card-badge-rating" aria-label={`Rating: ${rating}`}>
                        <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span>{rating}</span>
                    </div>
                    {movie.year && <div className="card-badge-year">{movie.year}</div>}
                </div>

                <div className="card-body">
                    {genres.length > 0 && (
                        <div className="card-genres">
                            {genres.map((genre) => (
                                <span key={genre} className="genre-pill">{genre}</span>
                            ))}
                        </div>
                    )}
                    <h3 className="card-title" title={movie.title}>{movie.title}</h3>
                    <p className="card-description">{movie.description}</p>
                    <div className="card-footer">
                        <span className="card-runtime">{movie.duration}</span>
                        <span className="card-action-link" aria-hidden="true">
                            Details
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}