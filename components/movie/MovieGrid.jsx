// ==========================================================================
// Movie Grid — server component
// ==========================================================================
// Keeps the existing responsive grid classes (2 cards per row on mobile).

import MovieCard from './MovieCard';

export default function MovieGrid({ movies, emptyState = null }) {
    if (!movies || movies.length === 0) {
        return emptyState;
    }

    return (
        <div className="movies-grid" aria-label="Movie Collection">
            {movies.map((movie) => (
                <MovieCard key={movie._id || movie.slug} movie={movie} />
            ))}
        </div>
    );
}