// ==========================================================================
// Query & Movie Validation Utilities (allowlisted, safe)
// ==========================================================================

const SORT_FIELDS = ['rating', 'year', 'title', 'createdAt', 'releaseDate', 'updatedAt'];
const SORT_DIRECTIONS = ['asc', 'desc'];

export function parseSortParam(sortParam) {
    if (!sortParam || typeof sortParam !== 'string') {
        return { createdAt: -1 };
    }

    const parts = sortParam.split('-');
    const field = parts[0];
    const direction = parts[1] || 'desc';

    if (!SORT_FIELDS.includes(field) || !SORT_DIRECTIONS.includes(direction)) {
        return { createdAt: -1 };
    }

    return { [field]: direction === 'asc' ? 1 : -1 };
}

export function parsePagination(page, limit, defaultLimit = 12, maxLimit = 50) {
    let parsedPage = parseInt(page, 10);
    let parsedLimit = parseInt(limit, 10);

    if (!Number.isFinite(parsedPage) || parsedPage < 1) parsedPage = 1;
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) parsedLimit = defaultLimit;
    if (parsedLimit > maxLimit) parsedLimit = maxLimit;

    return { page: parsedPage, limit: parsedLimit };
}

export function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateMovie(body) {
    const errors = {};

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        errors.title = 'Title is required';
    }

    if (body.year !== undefined && body.year !== null && body.year !== '') {
        const y = Number(body.year);
        if (!Number.isFinite(y) || y < 1888 || y > 2100) {
            errors.year = 'Year must be between 1888 and 2100';
        }
    }

    if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
        const r = Number(body.rating);
        if (!Number.isFinite(r) || r < 0 || r > 10) {
            errors.rating = 'Rating must be between 0 and 10';
        }
    }

    if (body.runtime !== undefined && body.runtime !== null && body.runtime !== '') {
        const rt = Number(body.runtime);
        if (!Number.isFinite(rt) || rt < 0 || rt > 60000) {
            errors.runtime = 'Runtime must be a positive number of minutes';
        }
    }

    if (body.releaseDate !== undefined && body.releaseDate !== null && body.releaseDate !== '') {
        if (Number.isNaN(Date.parse(body.releaseDate))) {
            errors.releaseDate = 'Release date must be a valid date';
        }
    }

    if (body.genres !== undefined && !Array.isArray(body.genres)) {
        errors.genres = 'Genres must be an array';
    }

    if (body.cast !== undefined && !Array.isArray(body.cast)) {
        errors.cast = 'Cast must be an array';
    }

    if (body.isNewRelease !== undefined && typeof body.isNewRelease !== 'boolean') {
        errors.isNewRelease = 'isNewRelease must be a boolean';
    }

    if (body.poster && typeof body.poster === 'string' && body.poster.trim() && !isSafeUrl(body.poster)) {
        errors.poster = 'Poster must be a valid http(s) URL or a path starting with /';
    }

    if (body.backdrop && typeof body.backdrop === 'string' && body.backdrop.trim() && !isSafeUrl(body.backdrop)) {
        errors.backdrop = 'Backdrop must be a valid http(s) URL or a path starting with /';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

function isSafeUrl(value) {
    if (value.startsWith('/')) return true;
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[''"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}