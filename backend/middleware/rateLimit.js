// ==========================================================================
// Simple In-Memory Rate Limiter (login protection)
// ==========================================================================
// Suitable for the modest scale of the admin login endpoint. On serverless,
// each warm instance keeps its own counters, which still blunts brute force
// without over-engineering (per spec §43: "Do not over-engineer").

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function cleanup(now) {
    for (const [key, entry] of attempts) {
        if (now - entry.start > WINDOW_MS) {
            attempts.delete(key);
        }
    }
}

export function loginRateLimiter(req, res, next) {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (attempts.size > 5000) cleanup(now);

    const entry = attempts.get(key) || { start: now, count: 0 };

    if (now - entry.start > WINDOW_MS) {
        entry.start = now;
        entry.count = 0;
    }

    if (entry.count >= MAX_ATTEMPTS) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.'
        });
    }

    entry.count += 1;
    attempts.set(key, entry);

    next();
}