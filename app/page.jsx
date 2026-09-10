// ==========================================================================
// Homepage — Server Component
// ==========================================================================
// Server-side data fetch: new releases (hero + New Releases row), the most
// voted Popular row, and a Top Rated preview. Swiper interactivity is
// isolated inside HeroCarousel (client component).

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroCarousel from '@/components/hero/HeroCarousel';
import MovieGrid from '@/components/movie/MovieGrid';
import { fetchLatestReleases, fetchPopularMovies, fetchMovies } from '@/lib/server-data';

export const revalidate = 120;

export default async function HomePage() {
    const [latest, popular, topRated] = await Promise.all([
        fetchLatestReleases(12),
        fetchPopularMovies(12),
        fetchMovies({ sort: 'rating-desc', limit: 12, page: 1 })
    ]);

    // The hero spotlights the first six new releases.
    const heroMovies = latest.movies.slice(0, 6);

    return (
        <>
            <a href="#mainContent" className="skip-link">Skip to main content</a>
            <Navbar />

            <main id="mainContent">
                <HeroCarousel movies={heroMovies} isFallback={latest.isFallback} />

                {popular.length > 0 && (
                    <section className="movies-section" aria-label="Popular Movies">
                        <div className="container">
                            <div className="section-header">
                                <span className="section-subtitle">Trending Now</span>
                                <h2 className="section-title">Popular Movies</h2>
                                <p className="section-desc">
                                    The titles the CineScope community is watching right now, ranked by audience
                                    votes.
                                </p>
                            </div>

                            <MovieGrid movies={popular} />
                        </div>
                    </section>
                )}

                {latest.movies.length > 0 && (
                    <section className="movies-section movies-section-tight" aria-label="New Releases">
                        <div className="container">
                            <div className="section-header">
                                <span className="section-subtitle">Fresh From the Studio</span>
                                <h2 className="section-title">New Releases</h2>
                                <p className="section-desc">
                                    The latest additions to the catalog, straight from the newest release dates.
                                </p>
                            </div>

                            <MovieGrid movies={latest.movies} />
                        </div>
                    </section>
                )}

                {topRated.data.length > 0 && (
                    <section className="movies-section movies-section-tight" aria-label="Top Rated Movies">
                        <div className="container">
                            <div className="section-header">
                                <span className="section-subtitle">Curated Cinema</span>
                                <h2 className="section-title">Top Rated Movies</h2>
                                <p className="section-desc">
                                    Explore critically acclaimed English-language cinema with high-definition details
                                    and ratings.
                                </p>
                            </div>

                            <MovieGrid movies={topRated.data} />

                            <div className="home-browse-more">
                                <Link href="/movies" className="btn btn-primary btn-lg">
                                    Browse More Movies
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}