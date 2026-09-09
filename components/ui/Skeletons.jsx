// ==========================================================================
// Skeletons — reusable loading placeholders (shimmer via SCSS)
// ==========================================================================

export function MovieCardSkeleton() {
    return (
        <div className="movie-card movie-card-skeleton" aria-hidden="true">
            <div className="card-poster skeleton-block" />
            <div className="card-body">
                <div className="skeleton-line" style={{ width: '40%' }} />
                <div className="skeleton-line" style={{ width: '80%' }} />
                <div className="skeleton-line" style={{ width: '60%' }} />
            </div>
        </div>
    );
}

export function MovieGridSkeleton({ count = 12 }) {
    return (
        <div className="movies-grid" aria-busy="true" aria-label="Loading movies">
            {Array.from({ length: count }, (_, index) => (
                <MovieCardSkeleton key={index} />
            ))}
        </div>
    );
}