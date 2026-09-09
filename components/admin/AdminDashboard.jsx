'use client';

// ==========================================================================
// Admin Dashboard — login, list, CRUD, bulk import, server-side pagination
// ==========================================================================
// All data flows through the Express API (/api/*). The dashboard never
// loads the full catalog — every list request is server-paginated.

import { useCallback, useEffect, useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';
import MovieFormModal from './MovieFormModal';
import BulkImportModal from './BulkImportModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import AdminPagination from './AdminPagination';

const API = '/api';
const PAGE_SIZE = 20;

const EMPTY_STATS = { totalMovies: 0, newReleases: 0, genres: 0 };

function formatDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

export default function AdminDashboard() {
    const show = useToast();

    // Auth
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginPending, setLoginPending] = useState(false);

    // List state
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [genreFilter, setGenreFilter] = useState('All');
    const [sortBy, setSortBy] = useState('createdAt-desc');
    const [genres, setGenres] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);

    // Modals
    const [formOpen, setFormOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletePending, setDeletePending] = useState(false);

    const fetchJson = useCallback(async (url, options) => {
        const response = await fetch(url, { credentials: 'same-origin', ...options });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(payload.message || `Request failed (${response.status})`);
            error.status = response.status;
            error.errors = payload.errors;
            throw error;
        }
        return payload;
    }, []);

    // Check session on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const payload = await fetchJson(`${API}/auth/me`);
                if (!cancelled) setUser(payload.data);
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setCheckingAuth(false);
            }
        })();
        return () => { cancelled = true; };
    }, [fetchJson]);

    const loadGenresAndStats = useCallback(async () => {
        try {
            const [genresPayload, statsPayload] = await Promise.all([
                fetchJson(`${API}/genres`),
                fetchJson(`${API}/movies?limit=1`).then((r) => r.pagination)
            ]);
            setGenres(genresPayload.data.map((g) => g.name));
            setStats((prev) => ({ ...prev, totalItems: statsPayload?.totalItems ?? prev.totalItems }));
        } catch {
            /* non-critical */
        }
    }, [fetchJson]);

    const loadStats = useCallback(async () => {
        try {
            // Stats are computed from list metadata + latest release count.
            const [listPayload, latestPayload] = await Promise.all([
                fetchJson(`${API}/movies?limit=1`),
                fetchJson(`${API}/movies/latest-releases?limit=12`)
            ]);
            setStats({
                totalMovies: listPayload.pagination.totalItems,
                newReleases: latestPayload.data.filter((m) => m.isNewRelease).length,
                genres: 0
            });
        } catch {
            /* non-critical */
        }
    }, [fetchJson]);

    const loadMovies = useCallback(async () => {
        setLoading(true);
        setListError('');
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
                sort: sortBy
            });
            if (search.trim()) params.set('search', search.trim());
            if (genreFilter !== 'All') params.set('genre', genreFilter);

            const payload = await fetchJson(`${API}/movies?${params}`);
            setMovies(payload.data);
            setTotalPages(payload.pagination.totalPages);
            setTotalItems(payload.pagination.totalItems);

            // Move to the last valid page if the current page became empty
            if (payload.data.length === 0 && payload.pagination.totalPages > 0 && page > payload.pagination.totalPages) {
                setPage(payload.pagination.totalPages);
            }
        } catch (err) {
            setListError(err.message || 'Failed to load movies');
        } finally {
            setLoading(false);
        }
    }, [fetchJson, page, search, sortBy, genreFilter]);

    useEffect(() => {
        if (!user) return;
        loadMovies();
    }, [user, loadMovies]);

    useEffect(() => {
        if (!user) return;
        loadStats();
        fetchJson(`${API}/genres`)
            .then((payload) => setGenres(payload.data.map((g) => g.name)))
            .catch(() => { });
    }, [user, loadStats, fetchJson]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoginError('');
        setLoginPending(true);
        try {
            const payload = await fetchJson(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword })
            });
            setUser(payload.data);
            setLoginPassword('');
            show({ message: 'Welcome back!', type: 'success' });
        } catch (err) {
            setLoginError(err.message || 'Login failed');
        } finally {
            setLoginPending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetchJson(`${API}/auth/logout`, { method: 'POST' });
        } finally {
            setUser(null);
            setMovies([]);
            show({ message: 'Logged out', type: 'info' });
        }
    };

    const handleSaved = async () => {
        setFormOpen(false);
        setEditingMovie(null);
        await loadMovies();
        await loadStats();
        show({ message: 'Movie saved successfully', type: 'success' });
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletePending(true);
        try {
            await fetchJson(`${API}/movies/${deleteTarget._id}`, { method: 'DELETE' });
            setDeleteTarget(null);
            await loadMovies();
            await loadStats();
            show({ message: 'Movie deleted', type: 'success' });
        } catch (err) {
            show({ message: err.message || 'Delete failed', type: 'error' });
        } finally {
            setDeletePending(false);
        }
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === 'Enter') {
            setPage(1);
            loadMovies();
        }
    };

    // ----- Login view -----
    if (checkingAuth) {
        return (
            <div className="admin-page">
                <div className="admin-login-view">
                    <div className="admin-login-card">
                        <p className="admin-login-subtitle">Checking session…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-page">
                <div className="admin-login-view">
                    <div className="admin-login-card">
                        <h1 className="admin-login-title">CineScope Admin</h1>
                        <p className="admin-login-subtitle">Sign in to manage the movie catalog.</p>
                        <form className="admin-login-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="adminEmail">Email</label>
                                <input
                                    id="adminEmail"
                                    type="email"
                                    className="form-input"
                                    value={loginEmail}
                                    onChange={(event) => setLoginEmail(event.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="adminPassword">Password</label>
                                <input
                                    id="adminPassword"
                                    type="password"
                                    className="form-input"
                                    value={loginPassword}
                                    onChange={(event) => setLoginPassword(event.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            {loginError && <p className="form-error" role="alert">{loginError}</p>}
                            <button type="submit" className="btn btn-primary btn-block" disabled={loginPending}>
                                {loginPending ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ----- Dashboard view -----
    return (
        <div className="admin-page">
            <a href="#mainContent" className="skip-link">Skip to main content</a>

            <header className="header admin-header">
                <div className="container navbar">
                    <a href="/" className="brand" aria-label="CineScope Home">
                        <span className="brand-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                <line x1="7" y1="2" x2="7" y2="22" />
                                <line x1="17" y1="2" x2="17" y2="22" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                            </svg>
                        </span>
                        <span>CINE<span className="brand-highlight">SCOPE</span></span>
                    </a>

                    <div className="admin-header-right">
                        <span className="admin-user-email">{user.email}</span>
                        <ThemeToggle />
                        <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </header>

            <main id="mainContent" className="admin-main">
                <div className="container">
                    {/* Stats */}
                    <div className="admin-stats">
                        <div className="stat-card">
                            <span className="stat-number">{stats.totalMovies}</span>
                            <span className="stat-label">Total Movies</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.newReleases}</span>
                            <span className="stat-label">Latest Releases</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{genres.length}</span>
                            <span className="stat-label">Genres</span>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="admin-action-bar">
                        <h2 className="admin-section-title">Movie Catalog</h2>
                        <div className="admin-action-buttons">
                            <button type="button" className="btn btn-primary" onClick={() => {
                                setEditingMovie(null);
                                setFormOpen(true);
                            }}>
                                + Add Movie
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
                                Bulk Import
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="admin-toolbar">
                        <div className="admin-search">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                className="form-input"
                                placeholder="Search by title, director, cast…"
                                aria-label="Search movies"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        <div className="admin-filters">
                            <select
                                className="form-input"
                                aria-label="Filter by genre"
                                value={genreFilter}
                                onChange={(event) => {
                                    setGenreFilter(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="All">All Genres</option>
                                {genres.map((genre) => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                            <select
                                className="form-input"
                                aria-label="Sort movies"
                                value={sortBy}
                                onChange={(event) => {
                                    setSortBy(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="createdAt-desc">Newest Added</option>
                                <option value="createdAt-asc">Oldest Added</option>
                                <option value="title-asc">Title (A–Z)</option>
                                <option value="title-desc">Title (Z–A)</option>
                                <option value="rating-desc">Highest Rated</option>
                                <option value="year-desc">Newest Release</option>
                                <option value="releaseDate-desc">Latest Release Date</option>
                            </select>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setPage(1);
                                    loadMovies();
                                }}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="admin-table-wrapper admin-skeleton-table" aria-busy="true">
                            {Array.from({ length: 5 }, (_, index) => (
                                <div key={index} className="skeleton-row" />
                            ))}
                        </div>
                    ) : listError ? (
                        <div className="admin-table-wrapper">
                            <div className="empty-state">
                                <h3>Could not load movies</h3>
                                <p>{listError}</p>
                                <button type="button" className="btn btn-primary" onClick={loadMovies}>Retry</button>
                            </div>
                        </div>
                    ) : movies.length === 0 ? (
                        <div className="admin-table-wrapper">
                            <div className="empty-state">
                                <h3>No movies found</h3>
                                <p>Try a different search, or add a movie to get started.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Movie</th>
                                        <th className="th-release">Release</th>
                                        <th className="th-genres">Genres</th>
                                        <th>Rating</th>
                                        <th className="th-new">New</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movies.map((movie) => (
                                        <tr key={movie._id}>
                                            <td className="td-title">
                                                <span className="admin-movie-title">{movie.title}</span>
                                                <span className="admin-movie-slug">/{movie.slug}</span>
                                            </td>
                                            <td className="td-release">{formatDate(movie.releaseDate)}</td>
                                            <td className="td-genres">
                                                {(movie.genres || []).slice(0, 2).map((genre) => (
                                                    <span key={genre} className="admin-genre-tag">{genre}</span>
                                                ))}
                                                {(movie.genres || []).length > 2 && (
                                                    <span className="admin-genre-more">
                                                        +{(movie.genres || []).length - 2}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="admin-rating-badge">
                                                    {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : '—'}
                                                </span>
                                            </td>
                                            <td className="td-new">
                                                {movie.isNewRelease && <span className="admin-new-badge">New</span>}
                                            </td>
                                            <td>
                                                <div className="td-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary admin-edit-btn"
                                                        onClick={() => {
                                                            setEditingMovie(movie);
                                                            setFormOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn admin-delete-btn"
                                                        onClick={() => setDeleteTarget(movie)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <AdminPagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </div>
            </main>

            {formOpen && (
                <MovieFormModal
                    movie={editingMovie}
                    genres={genres}
                    onClose={() => {
                        setFormOpen(false);
                        setEditingMovie(null);
                    }}
                    onSaved={handleSaved}
                />
            )}

            {bulkOpen && (
                <BulkImportModal
                    onClose={() => setBulkOpen(false)}
                    onImported={async (message) => {
                        setBulkOpen(false);
                        await loadMovies();
                        await loadStats();
                        show({ message, type: 'success' });
                    }}
                />
            )}

            {deleteTarget && (
                <ConfirmDeleteModal
                    movie={deleteTarget}
                    pending={deletePending}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}