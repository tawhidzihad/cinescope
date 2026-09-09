// ==========================================================================
// Movie Controller — HTTP layer over movieService
// ==========================================================================

import * as movieService from '../services/movieService.js';
import { validateMovie, parsePagination } from '../utils/validation.js';

const MAX_BULK_ITEMS = 1000;
const MAX_BULK_BYTES = 5 * 1024 * 1024; // matches express.json limit

export async function getMovies(req, res) {
    try {
        const { search, genre, sort, isNewRelease } = req.query;
        const result = await movieService.getMovies({
            search,
            genre,
            sort,
            isNewRelease: isNewRelease === 'true',
            page: req.query.page,
            limit: req.query.limit
        });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('GET /api/movies failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch movies' });
    }
}

export async function getMovieById(req, res) {
    try {
        const movie = await movieService.getMovieById(req.params.id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, data: movie });
    } catch (err) {
        console.error('GET /api/movies/:id failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch movie' });
    }
}

export async function getLatestReleases(req, res) {
    try {
        const limitParam = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 6;
        const { movies, isFallback } = await movieService.getLatestReleases(limit);
        res.json({ success: true, data: movies, isFallback });
    } catch (err) {
        console.error('GET /api/movies/latest-releases failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch latest releases' });
    }
}

export async function createMovie(req, res) {
    try {
        const validation = validateMovie(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const movie = await movieService.createMovie(req.body);
        res.status(201).json({ success: true, data: movie });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A movie with that slug or TMDB ID already exists' });
        }
        console.error('POST /api/movies failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create movie' });
    }
}

export async function updateMovie(req, res) {
    try {
        const validation = validateMovie(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const movie = await movieService.updateMovie(req.params.id, req.body);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, data: movie });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A movie with that slug or TMDB ID already exists' });
        }
        console.error('PUT /api/movies/:id failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update movie' });
    }
}

export async function deleteMovie(req, res) {
    try {
        const deleted = await movieService.deleteMovie(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, message: `Deleted "${deleted.title}"`, data: { id: deleted._id } });
    } catch (err) {
        console.error('DELETE /api/movies/:id failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to delete movie' });
    }
}

export async function bulkImport(req, res) {
    try {
        const payload = req.body;

        let moviesInput;
        if (Array.isArray(payload)) {
            moviesInput = payload;
        } else if (payload && Array.isArray(payload.movies)) {
            moviesInput = payload.movies;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Body must be a JSON array of movies or an object with a "movies" array'
            });
        }

        if (moviesInput.length === 0) {
            return res.status(400).json({ success: false, message: 'No movies provided' });
        }

        if (moviesInput.length > MAX_BULK_ITEMS) {
            return res.status(413).json({
                success: false,
                message: `Too many movies (${moviesInput.length}). Maximum is ${MAX_BULK_ITEMS} per import.`
            });
        }

        // Record-level validation with useful errors
        const invalid = [];
        moviesInput.forEach((movie, index) => {
            const validation = validateMovie(movie);
            if (!validation.isValid) {
                invalid.push({
                    index,
                    title: movie && movie.title ? movie.title : '(untitled)',
                    errors: validation.errors
                });
            }
        });

        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${invalid.length} record(s) failed validation`,
                errors: invalid
            });
        }

        const upsert = req.query.mode === 'upsert' || req.body.mode === 'upsert';
        const result = await movieService.bulkImportMovies(moviesInput, { upsert });

        res.json({
            success: true,
            message: `Import complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`,
            data: result
        });
    } catch (err) {
        if (err.type === 'entity.too.large' || (err.body && err.body.length > MAX_BULK_BYTES)) {
            return res.status(413).json({ success: false, message: 'Request body too large' });
        }
        console.error('POST /api/movies/bulk failed:', err.message);
        res.status(500).json({ success: false, message: 'Bulk import failed' });
    }
}