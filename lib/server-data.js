// ==========================================================================
// Server Data Layer — direct DB access for Server Components
// ==========================================================================
// Public pages call these functions directly on the server (no self-HTTP),
// reusing the backend services. The Express API remains the external API
// surface (spec §52).

import {
    getMovies,
    getMovieById,
    getLatestReleases,
    getGenresWithCounts
} from '../backend/services/movieService.js';
import { getAllGenres } from '../backend/services/genreService.js';

export function serializeMovie(movie) {
    if (!movie) return null;
    return {
        ...movie,
        _id: String(movie._id),
        releaseDate: movie.releaseDate instanceof Date ? movie.releaseDate.toISOString() : (movie.releaseDate || null),
        createdAt: movie.createdAt instanceof Date ? movie.createdAt.toISOString() : (movie.createdAt || null),
        updatedAt: movie.updatedAt instanceof Date ? movie.updatedAt.toISOString() : (movie.updatedAt || null)
    };
}

export async function fetchMovies(params = {}) {
    const result = await getMovies(params);
    return {
        data: result.data.map(serializeMovie),
        pagination: result.pagination
    };
}

export async function fetchMovie(idOrSlug) {
    const movie = await getMovieById(idOrSlug);
    return serializeMovie(movie);
}

export async function fetchLatestReleases(limit = 6) {
    const { movies, isFallback } = await getLatestReleases(limit);
    return { movies: movies.map(serializeMovie), isFallback };
}

export async function fetchGenrePills() {
    const counts = await getGenresWithCounts();
    return counts.map((entry) => ({
        name: entry._id,
        count: entry.count
    }));
}

export async function fetchAllGenres() {
    const genres = await getAllGenres();
    return genres.map((g) => ({ name: g.name, slug: g.slug }));
}