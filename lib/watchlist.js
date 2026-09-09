'use client';

// ==========================================================================
// Watchlist — localStorage persistence (client-only)
// ==========================================================================
// Preserves the previous watchlist behavior. Entries store {slug, title,
// poster} so a deleted movie can be filtered out gracefully on read.

const STORAGE_KEY = 'cinescope_watchlist';

export function getWatchlist() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => item && item.slug) : [];
    } catch {
        return [];
    }
}

export function isInWatchlist(slug) {
    return getWatchlist().some((item) => item.slug === slug);
}

export function toggleWatchlist(movie) {
    const list = getWatchlist();
    const exists = list.some((item) => item.slug === movie.slug);

    let next;
    if (exists) {
        next = list.filter((item) => item.slug !== movie.slug);
    } else {
        next = [
            ...list,
            {
                slug: movie.slug,
                title: movie.title,
                year: movie.year || null,
                poster: movie.poster || '',
                addedAt: new Date().toISOString()
            }
        ];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return !exists;
}

const listeners = new Set();

export function subscribeToWatchlist(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function notifyWatchlistChanged() {
    listeners.forEach((listener) => listener());
}