'use client';

// ==========================================================================
// Search Box — updates /movies?search= URL params (server-driven search)
// ==========================================================================
// Migrated from js/features/search.js. Debounced, keyboard friendly, and
// navigates via the URL so Next.js performs the server-side search.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function buildUrl(searchParams, updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export function useSearchParamUpdater() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return useCallback((updates, { resetPage = true } = {}) => {
        const merged = resetPage ? { ...updates, page: null } : updates;
        router.push(`${pathname}${buildUrl(searchParams, merged)}`);
    }, [router, pathname, searchParams]);
}

export default function SearchBox() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get('search') || '');
    const timerRef = useRef(null);

    // Sync when navigating (back/forward)
    useEffect(() => {
        setValue(searchParams.get('search') || '');
    }, [searchParams]);

    const handleChange = (event) => {
        const next = event.target.value;
        setValue(next);

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (next.trim()) {
                params.set('search', next.trim());
            } else {
                params.delete('search');
            }
            params.delete('page');
            const qs = params.toString();
            router.push(qs ? `/movies?${qs}` : '/movies');
        }, 400);
    };

    const clear = () => {
        setValue('');
        clearTimeout(timerRef.current);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('search');
        params.delete('page');
        const qs = params.toString();
        router.push(qs ? `/movies?${qs}` : '/movies');
    };

    const hasValue = value.length > 0;

    return (
        <>
            <label htmlFor="desktopSearchInput" className="visually-hidden">Search movies</label>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                type="search"
                id="desktopSearchInput"
                className="search-input"
                placeholder="Search movies, cast..."
                autoComplete="off"
                aria-label="Search movies by title, cast, or director"
                value={value}
                onChange={handleChange}
            />
            {hasValue && (
                <button type="button" className="search-clear-btn" aria-label="Clear search query" onClick={clear}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
        </>
    );
}