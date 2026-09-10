// ==========================================================================
// MongoDB Connection — native driver, serverless-friendly
// ==========================================================================
// Uses a module-level cached promise so warm serverless invocations reuse
// the same connection instead of opening a new one per request.

import { MongoClient } from 'mongodb';

const DEFAULT_DB = 'cinescope';

let clientPromise = null;
let indexesReady = false;

export function getMongoUri() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }
    return uri;
}

export function getDbName() {
    return process.env.MONGODB_DB || DEFAULT_DB;
}

async function ensureIndexes(db) {
    if (indexesReady) return;

    await Promise.all([
        db.collection('movies').createIndex({ slug: 1 }, { unique: true, sparse: true }),
        db.collection('movies').createIndex({ tmdbId: 1 }, { unique: true, sparse: true }),
        db.collection('movies').createIndex({ title: 1 }),
        db.collection('movies').createIndex({ genres: 1 }),
        db.collection('movies').createIndex({ isNewRelease: 1, releaseDate: -1 }),
        db.collection('movies').createIndex({ rating: -1 }),
        db.collection('movies').createIndex({ createdAt: -1 }),
        db.collection('genres').createIndex({ slug: 1 }, { unique: true })
    ]);

    indexesReady = true;
}

export async function getDb() {
    if (!clientPromise) {
        const uri = getMongoUri();
        const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 8000,
            maxPoolSize: 10
        });
        // Cache the connect attempt immediately so concurrent cold-start
        // requests share it — but CLEAR it on failure so the next invocation
        // starts a fresh attempt instead of awaiting the same rejected
        // promise forever (poisoned warm instance).
        clientPromise = client.connect().then(
            () => client,
            (err) => {
                clientPromise = null;
                const target = String(uri).replace(/^[^:]+:\/\/[^@]+@/, '<credentials>@').split('?')[0];
                console.error('[db] MongoDB connect failed:', err?.name, err?.code ?? '', '-', err?.message, '| target:', target);
                throw err;
            }
        );
    }

    const client = await clientPromise;
    const db = client.db(getDbName());
    await ensureIndexes(db);
    return db;
}

export async function isConnected() {
    if (!clientPromise) return false;
    try {
        const client = await clientPromise;
        return client.topology ? client.topology.isConnected() : false;
    } catch {
        return false;
    }
}