// ==========================================================================
// Genre Service — dedicated genres collection with sync
// ==========================================================================

import { getDb } from '../config/db.js';
import { slugify } from '../utils/validation.js';

const COLLECTION = 'genres';

function normalizeGenreName(name) {
    return String(name).trim().replace(/\s+/g, ' ');
}

export async function syncGenres(movieInputs) {
    if (!Array.isArray(movieInputs) || movieInputs.length === 0) return;

    const names = new Set();
    for (const movie of movieInputs) {
        if (Array.isArray(movie.genres)) {
            for (const genre of movie.genres) {
                const normalized = normalizeGenreName(genre);
                if (normalized) names.add(normalized);
            }
        }
    }

    if (names.size === 0) return;

    const db = await getDb();
    const now = new Date();

    const operations = [...names].map((name) => ({
        replaceOne: {
            filter: { slug: slugify(name) },
            replacement: {
                name: normalizedCapitalized(name),
                slug: slugify(name),
                updatedAt: now
            },
            upsert: true
        }
    }));

    await db.collection(COLLECTION).bulkWrite(operations, { ordered: false });
}

function normalizedCapitalized(name) {
    return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export async function getAllGenres() {
    const db = await getDb();
    return db.collection(COLLECTION)
        .find({})
        .sort({ name: 1 })
        .toArray();
}