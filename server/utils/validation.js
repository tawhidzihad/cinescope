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

export function parsePagination(page, limit) {
  const defaultLimit = 12;
  const maxLimit = 50;

  let parsedPage = parseInt(page, 10);
  let parsedLimit = parseInt(limit, 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) parsedPage = 1;
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) parsedLimit = defaultLimit;
  if (parsedLimit > maxLimit) parsedLimit = maxLimit;

  return { page: parsedPage, limit: parsedLimit };
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  if (body.genres !== undefined && !Array.isArray(body.genres)) {
    errors.genres = 'Genres must be an array';
  }

  if (body.cast !== undefined && !Array.isArray(body.cast)) {
    errors.cast = 'Cast must be an array';
  }

  if (body.isNewRelease !== undefined && typeof body.isNewRelease !== 'boolean') {
    errors.isNewRelease = 'isNewRelease must be a boolean';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
