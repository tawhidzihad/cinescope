// ==========================================================================
// Movie Detail — Server Component with SEO metadata
// ==========================================================================
// Content is fully server-rendered before hydration. Only the trailer
// player, watchlist toggle, and toast are client components.

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import MovieActions from '@/components/movie/MovieActions';
import { ToastProvider } from '@/components/ui/Toast';
import { fetchMovie } from '@/lib/server-data';

const FALLBACK_POSTER = '/images/poster-fallback.svg';

export const revalidate = 120;

export async function generateMetadata({ params }) {
    const { id } = await params;
    const movie = await fetchMovie(id);

    if (!movie) {
        return { title: 'Movie Not Found' };
    }

    const title = `${movie.title}${movie.year ? ` (${movie.year})` : ''}`;
    const description = movie.description || movie.fullOverview || `Discover ${movie.title} on CineScope.`;

    return {
        title,
        description,
        alternates: {
            canonical: `/movie/${movie.slug}`
        },
        openGraph: {
            title: `${title} | CineScope`,
            description,
            images: movie.backdrop || movie.poster ? [{ url: movie.backdrop || movie.poster }] : [],
            type: 'video.movie'
        }
    };
}

export default async function MovieDetailPage({ params }) {
    const { id } = await params;
    const movie = await fetchMovie(id);

    if (!movie) {
        notFound();
    }

    const rating = typeof movie.rating === 'number' ? movie.rating.toFixed(1) : '—';

    return (
        <ToastProvider>
            <a href="#mainContent" className="skip-link">Skip to main content</a>

            <header className="header detail-header">
                <div className="container navbar">
                    <a href="/movies" className="detail-back-link" aria-label="Back to movie catalog">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Discover</span>
                    </a>

                    <a href="/" className="brand" aria-label="CineScope Home">
                        <span className="brand-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                <line x1="7" y1="2" x2="7" y2="22" />
                                <line x1="17" y1="2" x2="17" y2="22" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                            </svg>
                        </span>
                        <span>CINE<span className="brand-highlight">SCOPE</span></span>
                    </a>
                </div>
            </header>

            <main id="mainContent" className="detail-page-body">
                <section className="detail-hero" aria-label="Movie Visual Banner">
                    <div className="detail-backdrop-wrap">
                        <Image
                            src={movie.backdrop || movie.poster || FALLBACK_POSTER}
                            alt=""
                            fill
                            priority
                            sizes="100vw"
                            className="detail-backdrop-img"
                        />
                        <div className="detail-hero-overlay" />
                    </div>
                </section>

                <section className="detail-body-section">
                    <div className="container detail-layout">
                        <div className="detail-poster-col">
                            <div className="detail-poster-card">
                                <Image
                                    src={movie.poster || FALLBACK_POSTER}
                                    alt={`Poster for ${movie.title}`}
                                    width={400}
                                    height={600}
                                    sizes="(max-width: 767.98px) 60vw, 340px"
                                    className="detail-poster-img"
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                        </div>

                        <div className="detail-info-col">
                            <h1 className="detail-title">{movie.title}</h1>
                            {movie.tagline && <p className="detail-tagline">{movie.tagline}</p>}

                            <div className="detail-meta-row">
                                <div className="detail-rating-badge" aria-label={`Rating ${rating} out of 10`}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"
                                        aria-hidden="true">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                    <span>{rating}</span>
                                </div>
                                {movie.votes && <span className="detail-meta-item">{movie.votes}</span>}
                                {movie.year && <span className="detail-meta-item">{movie.year}</span>}
                                {movie.duration && <span className="detail-meta-item">{movie.duration}</span>}
                            </div>

                            {(movie.genres || []).length > 0 && (
                                <div className="detail-genres">
                                    {movie.genres.map((genre) => (
                                        <span key={genre} className="genre-pill">{genre}</span>
                                    ))}
                                </div>
                            )}

                            <MovieActions movie={movie} />

                            <div className="detail-synopsis-box">
                                <h2 className="detail-section-title">Overview</h2>
                                <p className="detail-overview">
                                    {movie.fullOverview || movie.description || 'Overview coming soon.'}
                                </p>
                            </div>

                            <div className="detail-credits-grid">
                                <div className="credit-card">
                                    <span className="credit-label">Director</span>
                                    <span className="credit-value">{movie.director || '—'}</span>
                                </div>
                                <div className="credit-card">
                                    <span className="credit-label">Starring Cast</span>
                                    <span className="credit-value">
                                        {(movie.cast && movie.cast.join(', ')) || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </ToastProvider>
    );
}