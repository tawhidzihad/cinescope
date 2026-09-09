// ==========================================================================
// Movies Catalog — Server Component
// ==========================================================================
// Search → Filter → Sort → Pagination all happen in MongoDB before render.
// URL params drive everything: /movies?search=batman&genre=Action&sort=newest&page=2

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MovieGrid from '@/components/movie/MovieGrid';
import MoviesToolbar from '@/components/movie/MoviesToolbar';
import Pagination from '@/components/pagination/Pagination';
import EmptyState from '@/components/movie/EmptyState';
import { fetchMovies, fetchGenrePills } from '@/lib/server-data';
import { parseSortParam } from '../../backend/utils/validation.js';

export const metadata = {
    title: 'Discover Movies',
    description: 'Browse the full CineScope catalog — search, filter by genre, and sort English cinema.'
};

const SORT_ALIASES = {
    newest: 'year-desc',
    oldest: 'year-asc',
    rating: 'rating-desc',
    title: 'title-asc'
};

export default async function MoviesPage({ searchParams }) {
    const params = await searchParams;
    const rawSort = params.sort || 'rating-desc';
    const sort = SORT_ALIASES[rawSort] || rawSort;

    const [result, genres] = await Promise.all([
        fetchMovies({
            search: params.search || '',
            genre: params.genre || 'All',
            sort,
            page: params.page,
            limit: params.limit || 12
        }),
        fetchGenrePills()
    ]);

    const { data, pagination } = result;
    const activeGenre = params.genre || 'All';
    // Report the canonical (non-aliased) sort value back to the select
    const sortObj = parseSortParam(sort);
    const canonicalSort =
        Object.entries(sortObj)[0][1] === 1
            ? `${Object.keys(sortObj)[0]}-asc`
            : `${Object.keys(sortObj)[0]}-desc`;

    return (
        <>
            <a href="#mainContent" className="skip-link">Skip to main content</a>
            <Navbar />

            <main id="mainContent">
                <section className="movies-section" aria-label="Discover Movies">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-subtitle">Curated Cinema</span>
                            <h1 className="section-title">Discover Movies</h1>
                            <p className="section-desc">
                                Explore critically acclaimed English-language cinema with high-definition details
                                and ratings.
                            </p>
                        </div>

                        <MoviesToolbar
                            genres={genres}
                            resultsCount={data.length}
                            totalItems={pagination.totalItems}
                            activeGenre={activeGenre}
                            activeSort={canonicalSort}
                        />

                        <MovieGrid
                            movies={data}
                            emptyState={
                                <EmptyState
                                    title="No movies found"
                                    description="Try adjusting your search or clearing the genre filter."
                                />
                            }
                        />

                        <Pagination
                            basePath="/movies"
                            searchParams={{
                                search: params.search || '',
                                genre: params.genre || '',
                                sort: rawSort,
                                limit: params.limit || ''
                            }}
                            pagination={pagination}
                        />
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}