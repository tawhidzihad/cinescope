'use client';

// ==========================================================================
// Movies Toolbar — genre pills + sort select (client-only interactivity)
// ==========================================================================
// Updates URL search params; the /movies Server Component performs the
// actual server-side filter/sort. Genre options are server-provided props.

import { useSearchParamUpdater } from '@/components/ui/SearchBox';

const SORT_OPTIONS = [
    { value: 'rating-desc', label: 'Highest Rated' },
    { value: 'year-desc', label: 'Newest Release' },
    { value: 'title-asc', label: 'Title (A - Z)' },
    { value: 'title-desc', label: 'Title (Z - A)' }
];

export default function MoviesToolbar({ genres, resultsCount, totalItems, activeGenre, activeSort }) {
    const updateParams = useSearchParamUpdater();

    const selectGenre = (genre) => {
        updateParams({ genre: genre === 'All' ? null : genre });
    };

    const changeSort = (event) => {
        updateParams({ sort: event.target.value }, { resetPage: false });
    };

    return (
        <div className="discovery-toolbar">
            <div className="filter-pills" role="toolbar" aria-label="Filter movies by genre">
                <button
                    type="button"
                    className={`filter-pill${activeGenre === 'All' ? ' is-active' : ''}`}
                    onClick={() => selectGenre('All')}
                    aria-pressed={activeGenre === 'All'}
                >
                    All
                </button>
                {genres.map((genre) => (
                    <button
                        key={genre.name}
                        type="button"
                        className={`filter-pill${activeGenre === genre.name ? ' is-active' : ''}`}
                        onClick={() => selectGenre(genre.name)}
                        aria-pressed={activeGenre === genre.name}
                    >
                        {genre.name}
                    </button>
                ))}
            </div>

            <div className="toolbar-controls">
                <div className="results-count" aria-live="polite">
                    Showing <span className="count-highlight">{resultsCount}</span> of {totalItems} movies
                </div>
                <div className="sort-wrapper">
                    <label htmlFor="sortSelect">Sort By:</label>
                    <select
                        id="sortSelect"
                        className="sort-select"
                        aria-label="Sort movies list"
                        value={activeSort}
                        onChange={changeSort}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}