// ==========================================================================
// Homepage — Server Component
// ==========================================================================
// Server-side data fetch: latest releases (hero) + top-rated preview.
// Swiper interactivity is isolated inside HeroCarousel (client component).

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroCarousel from '@/components/hero/HeroCarousel';
import MovieGrid from '@/components/movie/MovieGrid';
import { fetchLatestReleases, fetchMovies } from '@/lib/server-data';

export const revalidate = 120;

export default async function HomePage() {
    const [hero, topRated] = await Promise.all([
        fetchLatestReleases(6),
        fetchMovies({ sort: 'rating-desc', limit: 12, page: 1 })
    ]);

    return (
        <>
            <a href="#mainContent" className="skip-link">Skip to main content</a>
            <Navbar />

            <main id="mainContent">
                <HeroCarousel movies={hero.movies} isFallback={hero.isFallback} />

                <section className="movies-section" aria-label="Top Rated Movies">
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
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}