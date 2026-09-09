// ==========================================================================
// Seed Script — migrate existing static movie data into MongoDB
// ==========================================================================
// Idempotent: matches on slug, inserts new records, optionally updates
// existing ones (--upsert). Never wipes the database by default.
//
// Usage:
//   node scripts/seed-mongodb.mjs            # insert missing movies only
//   node scripts/seed-mongodb.mjs --upsert   # also update existing records
//
// Reads the legacy static catalog at js/data/movies.js (preserved as the
// original data source) and normalizes each record into the Movie model.

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

const DEFAULT_DB = 'cinescope';
const LEGACY_DATA_PATH = path.resolve(process.cwd(), 'js/data/movies.js');

function parseLegacyCatalog(source) {
    // js/data/movies.js is an ES module exporting `export const movies = [...]`
    // plus possibly additional exports (e.g. availableGenres). Slice only the
    // movies array: from its opening bracket to the closing `];` before the
    // next top-level export.
    const marker = 'export const movies =';
    const start = source.indexOf(marker);
    if (start === -1) {
        throw new Error('Could not find "export const movies" in legacy data file');
    }

    const arrayStart = source.indexOf('[', start);
    if (arrayStart === -1) {
        throw new Error('Could not locate the movies array start');
    }

    const nextExport = source.indexOf('export const', start + marker.length);
    const searchEnd = nextExport === -1 ? source.length : nextExport;
    const arrayEnd = source.lastIndexOf(']', searchEnd);
    if (arrayEnd === -1 || arrayEnd <= arrayStart) {
        throw new Error('Could not locate the movies array bounds');
    }

    return JSON.parse(source.slice(arrayStart, arrayEnd + 1));
}

function normalize(raw) {
    const slug = raw.id || raw.slug ||
        String(raw.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const releaseDate = raw.releaseDate ? new Date(raw.releaseDate) : null;
    const year = raw.year || (releaseDate && !Number.isNaN(releaseDate.getTime())
        ? releaseDate.getUTCFullYear()
        : undefined);

    return {
        title: String(raw.title).trim(),
        slug,
        tmdbId: raw.tmdbId ?? undefined,
        tagline: raw.tagline || '',
        year,
        releaseDate: releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate : undefined,
        rating: typeof raw.rating === 'number' ? raw.rating : Number(raw.rating) || 0,
        votes: raw.votes || '',
        duration: raw.duration || '',
        runtime: raw.runtime ? Number(raw.runtime) : 0,
        genres: Array.isArray(raw.genres) ? raw.genres.map((g) => String(g).trim()).filter(Boolean) : [],
        director: raw.director || '',
        cast: Array.isArray(raw.cast) ? raw.cast : [],
        description: raw.description || '',
        fullOverview: raw.fullOverview || raw.description || '',
        poster: raw.poster || '',
        backdrop: raw.backdrop || '',
        trailerKey: raw.trailerKey || '',
        trailerUrl: raw.trailerUrl || '',
        trailerSource: raw.trailerSource || '',
        isNewRelease: Boolean(raw.isNewRelease ?? raw.featured),
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        updatedAt: new Date()
    };
}

function slugifyGenre(name) {
    return String(name).trim().toLowerCase().replace(/\s+/g, '-');
}

async function main() {
    const upsert = process.argv.includes('--upsert');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Error: MONGODB_URI is not set. Add it to .env or your environment.');
        process.exit(1);
    }

    console.log(`Reading legacy catalog: ${LEGACY_DATA_PATH}`);
    const source = await readFile(LEGACY_DATA_PATH, 'utf8');
    const rawMovies = parseLegacyCatalog(source);
    console.log(`Found ${rawMovies.length} raw movie records`);

    const movies = rawMovies.map(normalize);

    // De-duplicate within the batch by slug
    const seen = new Set();
    const unique = [];
    let batchDuplicates = 0;
    for (const movie of movies) {
        if (seen.has(movie.slug)) {
            batchDuplicates++;
            continue;
        }
        seen.add(movie.slug);
        unique.push(movie);
    }

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || DEFAULT_DB);
    const collection = db.collection('movies');
    const genreCollection = db.collection('genres');

    // Ensure indexes (mirrors backend/config/db.js)
    await Promise.all([
        collection.createIndex({ slug: 1 }, { unique: true, sparse: true }),
        collection.createIndex({ tmdbId: 1 }, { unique: true, sparse: true }),
        collection.createIndex({ title: 1 }),
        collection.createIndex({ genres: 1 }),
        collection.createIndex({ isNewRelease: 1, releaseDate: -1 }),
        collection.createIndex({ rating: -1 }),
        collection.createIndex({ createdAt: -1 }),
        genreCollection.createIndex({ slug: 1 }, { unique: true })
    ]);

    // Determine which slugs already exist
    const existingDocs = await collection.find(
        { slug: { $in: unique.map((m) => m.slug) } },
        { projection: { slug: 1 } }
    ).toArray();
    const existingSlugs = new Set(existingDocs.map((d) => d.slug));

    const newMovies = unique.filter((m) => !existingSlugs.has(m.slug));
    const existingMovies = unique.filter((m) => existingSlugs.has(m.slug));

    let inserted = 0;
    let updated = 0;
    let skipped = existingMovies.length;

    if (newMovies.length > 0) {
        const result = await collection.insertMany(newMovies, { ordered: false });
        inserted = result.insertedCount;
    }

    if (upsert && existingMovies.length > 0) {
        const operations = existingMovies.map((movie) => ({
            replaceOne: { filter: { slug: movie.slug }, replacement: movie }
        }));
        const result = await collection.bulkWrite(operations, { ordered: false });
        updated = result.modifiedCount;
        skipped = existingMovies.length - updated;
    }

    // Synchronize genres collection
    const genreNames = new Map();
    for (const movie of unique) {
        for (const genre of movie.genres) {
            genreNames.set(slugifyGenre(genre), genre);
        }
    }
    const now = new Date();
    const genreOps = [...genreNames.entries()].map(([slug, name]) => ({
        replaceOne: {
            filter: { slug },
            replacement: { name, slug, updatedAt: now },
            upsert: true
        }
    }));
    if (genreOps.length > 0) {
        await genreCollection.bulkWrite(genreOps, { ordered: false });
    }

    const total = await collection.countDocuments({});
    const totalGenres = await genreCollection.countDocuments({});

    console.log('-----------------------------------------');
    console.log(`Seed complete (${upsert ? 'upsert' : 'insert-missing'} mode)`);
    console.log(`  Raw records:      ${rawMovies.length}`);
    console.log(`  Batch duplicates: ${batchDuplicates}`);
    console.log(`  Inserted:         ${inserted}`);
    console.log(`  Updated:          ${updated}`);
    console.log(`  Skipped (exists): ${skipped}`);
    console.log(`  Genres synced:    ${genreNames.size}`);
    console.log(`  Total movies:     ${total}`);
    console.log(`  Total genres:     ${totalGenres}`);
    console.log('-----------------------------------------');

    await client.close();
}

main().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});