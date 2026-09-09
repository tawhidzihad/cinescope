// ==========================================================================
// Movie Service — native MongoDB data layer
// ==========================================================================

import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';
import {
    parseSortParam,
    parsePagination,
    escapeRegex,
    slugify
} from '../utils/validation.js';
import { syncGenres } from './genreService.js';

const COLLECTION = 'movies';

export function buildMovieFilter({ search, genre, isNewRelease }) {
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

    if (isNewRelease === true) {
        filter.isNewRelease = true;
    }

    return filter;
}

function normalizeMovieInput(body) {
    const doc = {
        title: String(body.title || '').trim(),
        slug: body.slug ? slugify(body.slug) : undefined,
        tmdbId: body.tmdbId !== undefined && body.tmdbId !== null && body.tmdbId !== ''
            ? Number(body.tmdbId)
            : undefined,
        tagline: body.tagline ? String(body.tagline) : '',
        year: body.year ? Number(body.year) : undefined,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
        rating: body.rating !== undefined && body.rating !== null && body.rating !== ''
            ? Number(body.rating)
            : 0,
        votes: body.votes ? String(body.votes) : '',
        duration: body.duration ? String(body.duration) : '',
        runtime: body.runtime ? Number(body.runtime) : 0,
        genres: Array.isArray(body.genres) ? body.genres.map((g) => String(g).trim()).filter(Boolean) : [],
        director: body.director ? String(body.director) : '',
        cast: Array.isArray(body.cast) ? body.cast.map((c) => String(c).trim()).filter(Boolean) : [],
        description: body.description ? String(body.description) : '',
        fullOverview: body.fullOverview ? String(body.fullOverview) : '',
        poster: body.poster ? String(body.poster) : '',
        backdrop: body.backdrop ? String(body.backdrop) : '',
        trailerKey: body.trailerKey ? String(body.trailerKey) : '',
        trailerUrl: body.trailerUrl ? String(body.trailerUrl) : '',
        trailerSource: body.trailerSource ? String(body.trailerSource) : '',
        isNewRelease: Boolean(body.isNewRelease),
        updatedAt: new Date()
    };

    // Auto-derive year from releaseDate when not supplied
    if (!doc.year && doc.releaseDate && !Number.isNaN(doc.releaseDate.getTime())) {
        doc.year = doc.releaseDate.getUTCFullYear();
    }

    return doc;
}

async function ensureSlug(db, doc, excludeId = null) {
    let slug = doc.slug || slugify(doc.title);
    let candidate = slug;
    let counter = 2;

    for (; ;) {
        const query = { slug: candidate };
        if (excludeId) query._id = { $ne: excludeId };
        const existing = await db.collection(COLLECTION).findOne(query, { projection: { _id: 1 } });
        if (!existing) break;
        candidate = `${slug}-${counter++}`;
    }

    doc.slug = candidate;
    return doc;
}

export async function getMovies(options = {}) {
    const { page, limit } = parsePagination(options.page, options.limit);
    const skip = (page - 1) * limit;
    const filter = buildMovieFilter(options);
    const sort = parseSortParam(options.sort);

    const db = await getDb();

    const [movies, totalItems] = await Promise.all([
        db.collection(COLLECTION)
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection(COLLECTION).countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        data: movies,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
}

export async function getMovieById(idOrSlug) {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    let movie = null;

    if (ObjectId.isValid(idOrSlug)) {
        movie = await collection.findOne({ _id: new ObjectId(idOrSlug) });
    }

    if (!movie) {
        movie = await collection.findOne({ slug: idOrSlug });
    }

    if (!movie) {
        const parsed = Number.parseInt(idOrSlug, 10);
        if (Number.isFinite(parsed)) {
            movie = await collection.findOne({ tmdbId: parsed });
        }
    }

    return movie;
}

export async function getMovieBySlug(slug) {
    const db = await getDb();
    return db.collection(COLLECTION).findOne({ slug });
}

export async function getLatestReleases(limit = 6) {
    const db = await getDb();

    const newReleases = await db.collection(COLLECTION)
        .find({ isNewRelease: true })
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit)
        .toArray();

    if (newReleases.length > 0) {
        return { movies: newReleases, isFallback: false };
    }

    // Graceful fallback: highest-rated recent movies, NOT labeled as new releases
    const fallback = await db.collection(COLLECTION)
        .find({})
        .sort({ releaseDate: -1, rating: -1 })
        .limit(limit)
        .toArray();

    return { movies: fallback, isFallback: true };
}

export async function getGenresWithCounts() {
    const db = await getDb();
    return db.collection(COLLECTION).aggregate([
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
}

export async function getStats() {
    const db = await getDb();

    const [totalItems, newReleases, genres] = await Promise.all([
        db.collection(COLLECTION).countDocuments({}),
        db.collection(COLLECTION).countDocuments({ isNewRelease: true }),
        db.collection(COLLECTION).aggregate([
            { $unwind: '$genres' },
            { $group: { _id: '$genres' } },
            { $count: 'value' }
        ]).toArray()
    ]);

    return {
        totalMovies: totalItems,
        newReleases,
        genres: genres.length > 0 ? genres[0].value : 0
    };
}

export async function createMovie(body) {
    const db = await getDb();
    const doc = await ensureSlug(db, normalizeMovieInput(body));

    const now = new Date();
    doc.createdAt = now;
    if (!doc.releaseDate) doc.releaseDate = now;

    const result = await db.collection(COLLECTION).insertOne(doc);
    await syncGenres([doc]);

    return db.collection(COLLECTION).findOne({ _id: result.insertedId });
}

export async function updateMovie(id, body) {
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const existing = await getMovieById(id);

    if (!existing) return null;

    // Merge: undefined fields fall back to existing values so partial updates
    // don't wipe data (full PUT-style payloads still overwrite everything sent).
    const mergedInput = { ...existing, ...body, title: body.title ?? existing.title };
    const doc = normalizeMovieInput(mergedInput);
    await ensureSlug(db, doc, existing._id);

    doc.releaseDate = body.releaseDate
        ? new Date(body.releaseDate)
        : (existing.releaseDate || undefined);

    const result = await collection.findOneAndUpdate(
        { _id: existing._id },
        { $set: doc },
        { returnDocument: 'after' }
    );

    await syncGenres([result]);
    return result;
}

export async function deleteMovie(id) {
    const db = await getDb();
    const existing = await getMovieById(id);

    if (!existing) return null;

    await db.collection(COLLECTION).deleteOne({ _id: existing._id });
    return existing;
}

export async function bulkImportMovies(moviesInput, { upsert = false } = {}) {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const operations = [];
    const seenSlugs = new Set();
    let toInsert = 0;
    let toUpdate = 0;

    for (const raw of moviesInput) {
        const doc = normalizeMovieInput(raw);
        doc.createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();
        if (!doc.releaseDate) doc.releaseDate = doc.createdAt;
        doc.slug = raw.slug ? slugify(raw.slug) : slugify(doc.title);

        if (seenSlugs.has(doc.slug)) {
            continue; // duplicate slug within the batch — skip
        }
        seenSlugs.add(doc.slug);

        if (upsert) {
            toUpdate++;
            operations.push({
                replaceOne: {
                    filter: { slug: doc.slug },
                    replacement: doc,
                    upsert: true
                }
            });
        } else {
            toInsert++;
            operations.push({
                replaceOne: {
                    filter: { slug: doc.slug },
                    replacement: doc,
                    upsert: false
                }
            });
        }
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    if (operations.length > 0) {
        const result = await collection.bulkWrite(operations, { ordered: false });
        inserted = result.insertedCount + result.upsertedCount;
        updated = result.modifiedCount;
        skipped = moviesInput.length - toInsert - toUpdate;
        await syncGenres(moviesInput);
    }

    return {
        inserted,
        updated,
        skipped,
        invalid: 0,
        received: moviesInput.length
    };
}