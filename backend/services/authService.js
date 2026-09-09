// ==========================================================================
// Auth Service — admin user management on native MongoDB driver
// ==========================================================================

import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';

const COLLECTION = 'users';

export async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed');
        }
        return null;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const existing = await collection.findOne({ email: normalizedEmail });

    const passwordHash = await bcrypt.hash(password, 12);

    if (existing) {
        // Keep the stored hash in sync with ADMIN_PASSWORD so the environment
        // remains the single source of truth for the admin account.
        if (!(await bcrypt.compare(password, existing.passwordHash))) {
            await collection.updateOne(
                { _id: existing._id },
                { $set: { passwordHash, updatedAt: new Date() } }
            );
        }
        return existing._id;
    }

    const result = await collection.insertOne({
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return result.insertedId;
}

export async function verifyCredentials(email, password) {
    if (!email || !password) return null;

    const normalizedEmail = String(email).toLowerCase().trim();
    const db = await getDb();
    const user = await db.collection(COLLECTION).findOne({ email: normalizedEmail });

    if (!user) {
        // Constant-time-ish: still perform a hash comparison to avoid
        // trivially timing-distinguishable "user not found" responses.
        await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
        return null;
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) return null;

    return { id: user._id, email: user.email, role: user.role };
}

export async function getUserById(id) {
    try {
        const db = await getDb();
        const { ObjectId } = await import('mongodb');
        if (!ObjectId.isValid(id)) return null;
        const user = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!user) return null;
        return { id: user._id, email: user.email, role: user.role };
    } catch {
        return null;
    }
}