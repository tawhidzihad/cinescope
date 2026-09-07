import { Movie } from '../models/Movie.js';
import { parseSortParam, parsePagination, escapeRegex, validateMovie } from '../utils/validation.js';

export async function getMovies(req, res) {
  try {
    const { search, genre, sort, page: pageParam, limit: limitParam, isNewRelease } = req.query;
    const { page, limit } = parsePagination(pageParam, limitParam);
    const skip = (page - 1) * limit;

    const filter = {};

    if (search && typeof search === 'string' && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: regex },
        { director: regex },
        { cast: { $in: [regex] } },
        { genres: { $in: [regex] } }
      ];
    }

    if (genre && typeof genre === 'string' && genre.trim() && genre !== 'All') {
      filter.genres = { $in: [new RegExp(`^${escapeRegex(genre.trim())}$`, 'i')] };
    }

    if (isNewRelease === 'true') {
      filter.isNewRelease = true;
    }

    const sortObj = parseSortParam(sort);

    const [movies, totalItems] = await Promise.all([
      Movie.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Movie.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: movies,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching movies:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies' });
  }
}

export async function getMovieById(req, res) {
  try {
    const { id } = req.params;

    let movie = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(id).lean();
    }
    if (!movie) {
      movie = await Movie.findOne({
        $or: [{ slug: id }, { tmdbId: parseInt(id, 10) || 0 }]
      }).lean();
    }

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, data: movie });
  } catch (err) {
    console.error('Error fetching movie:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movie' });
  }
}

export async function getLatestReleases(req, res) {
  try {
    const limit = 10;
    const movies = await Movie.find({ isNewRelease: true })
      .sort({ releaseDate: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: movies });
  } catch (err) {
    console.error('Error fetching latest releases:', err.message);
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

    const movieData = {
      title: req.body.title.trim(),
      slug: req.body.slug || undefined,
      tmdbId: req.body.tmdbId || undefined,
      tagline: req.body.tagline || '',
      year: req.body.year ? Number(req.body.year) : undefined,
      rating: req.body.rating !== undefined ? Number(req.body.rating) : 0,
      votes: req.body.votes || '',
      duration: req.body.duration || '',
      runtime: req.body.runtime ? Number(req.body.runtime) : 0,
      genres: Array.isArray(req.body.genres) ? req.body.genres : [],
      director: req.body.director || '',
      cast: Array.isArray(req.body.cast) ? req.body.cast : [],
      description: req.body.description || '',
      fullOverview: req.body.fullOverview || '',
      poster: req.body.poster || '',
      backdrop: req.body.backdrop || '',
      trailerKey: req.body.trailerKey || '',
      trailerUrl: req.body.trailerUrl || '',
      trailerSource: req.body.trailerSource || 'youtube',
      isNewRelease: Boolean(req.body.isNewRelease),
      releaseDate: req.body.releaseDate || '',
      featured: Boolean(req.body.featured)
    };

    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).json({ success: true, data: movie });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A movie with this ${field} already exists`
      });
    }
    if (err.name === 'ValidationError') {
      const errors = {};
      for (const [field, error] of Object.entries(err.errors)) {
        errors[field] = error.message;
      }
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Error creating movie:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create movie' });
  }
}

export async function updateMovie(req, res) {
  try {
    const { id } = req.params;

    const validation = validateMovie(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const updateData = {};
    const allowedFields = [
      'title', 'slug', 'tmdbId', 'tagline', 'year', 'rating', 'votes',
      'duration', 'runtime', 'genres', 'director', 'cast', 'description',
      'fullOverview', 'poster', 'backdrop', 'trailerKey', 'trailerUrl',
      'trailerSource', 'isNewRelease', 'releaseDate', 'featured'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.title) {
      updateData.title = String(updateData.title).trim();
    }

    const movie = await Movie.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, data: movie });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A movie with this ${field} already exists`
      });
    }
    if (err.name === 'ValidationError') {
      const errors = {};
      for (const [field, error] of Object.entries(err.errors)) {
        errors[field] = error.message;
      }
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Error updating movie:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update movie' });
  }
}

export async function deleteMovie(req, res) {
  try {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (err) {
    console.error('Error deleting movie:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete movie' });
  }
}

export async function bulkImport(req, res) {
  try {
    if (!req.body || !Array.isArray(req.body.movies)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a "movies" array'
      });
    }

    const movies = req.body.movies;
    let inserted = 0;
    let skipped = 0;
    let invalid = 0;
    const errors = [];
    const validMovies = [];

    for (let i = 0; i < movies.length; i++) {
      const movieData = movies[i];
      const validation = validateMovie(movieData);

      if (!validation.isValid) {
        invalid++;
        errors.push({
          index: i,
          title: movieData.title || 'Unknown',
          errors: validation.errors
        });
        continue;
      }

      const existing = await Movie.findOne({
        $or: [
          ...(movieData.tmdbId ? [{ tmdbId: movieData.tmdbId }] : []),
          ...(movieData.slug ? [{ slug: movieData.slug }] : [])
        ]
      });

      if (existing) {
        skipped++;
        continue;
      }

      validMovies.push({
        title: String(movieData.title).trim(),
        slug: movieData.slug || undefined,
        tmdbId: movieData.tmdbId || undefined,
        tagline: movieData.tagline || '',
        year: movieData.year ? Number(movieData.year) : undefined,
        rating: movieData.rating !== undefined ? Number(movieData.rating) : 0,
        votes: movieData.votes || '',
        duration: movieData.duration || '',
        runtime: movieData.runtime ? Number(movieData.runtime) : 0,
        genres: Array.isArray(movieData.genres) ? movieData.genres : [],
        director: movieData.director || '',
        cast: Array.isArray(movieData.cast) ? movieData.cast : [],
        description: movieData.description || '',
        fullOverview: movieData.fullOverview || '',
        poster: movieData.poster || '',
        backdrop: movieData.backdrop || '',
        trailerKey: movieData.trailerKey || '',
        trailerUrl: movieData.trailerUrl || '',
        trailerSource: movieData.trailerSource || 'youtube',
        isNewRelease: Boolean(movieData.isNewRelease),
        releaseDate: movieData.releaseDate || '',
        featured: Boolean(movieData.featured)
      });
    }

    if (validMovies.length > 0) {
      const result = await Movie.insertMany(validMovies, { ordered: false }).catch(err => {
        if (err.insertedCount !== undefined) {
          return { insertedCount: err.insertedCount };
        }
        throw err;
      });
      inserted = result.insertedCount || validMovies.length;
    }

    res.json({
      success: true,
      data: {
        inserted,
        skipped,
        invalid,
        errors: errors.slice(0, 20)
      }
    });
  } catch (err) {
    console.error('Error in bulk import:', err.message);
    res.status(500).json({ success: false, message: 'Bulk import failed' });
  }
}

export async function exportMovies(req, res) {
  try {
    const movies = await Movie.find({}).sort({ title: 1 }).lean();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cinescope-movies.json"');
    res.json(movies);
  } catch (err) {
    console.error('Error exporting movies:', err.message);
    res.status(500).json({ success: false, message: 'Failed to export movies' });
  }
}
