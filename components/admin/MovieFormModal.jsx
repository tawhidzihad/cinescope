'use client';

// ==========================================================================
// Movie Form Modal — grouped sections, client+server validation
// ==========================================================================

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

const EMPTY_FORM = {
    title: '',
    slug: '',
    tmdbId: '',
    tagline: '',
    releaseDate: '',
    year: '',
    rating: '',
    votes: '',
    duration: '',
    runtime: '',
    genresText: '',
    director: '',
    castText: '',
    description: '',
    fullOverview: '',
    poster: '',
    backdrop: '',
    trailerKey: '',
    trailerUrl: '',
    isNewRelease: false
};

function toFormState(movie) {
    if (!movie) return EMPTY_FORM;
    return {
        title: movie.title || '',
        slug: movie.slug || '',
        tmdbId: movie.tmdbId ?? '',
        tagline: movie.tagline || '',
        releaseDate: movie.releaseDate ? String(movie.releaseDate).slice(0, 10) : '',
        year: movie.year ?? '',
        rating: movie.rating ?? '',
        votes: movie.votes || '',
        duration: movie.duration || '',
        runtime: movie.runtime ?? '',
        genresText: (movie.genres || []).join(', '),
        director: movie.director || '',
        castText: (movie.cast || []).join(', '),
        description: movie.description || '',
        fullOverview: movie.fullOverview || '',
        poster: movie.poster || '',
        backdrop: movie.backdrop || '',
        trailerKey: movie.trailerKey || '',
        trailerUrl: movie.trailerUrl || '',
        isNewRelease: Boolean(movie.isNewRelease)
    };
}

function validate(form) {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (form.year !== '' && form.year !== null) {
        const y = Number(form.year);
        if (!Number.isFinite(y) || y < 1888 || y > 2100) errors.year = 'Year must be 1888–2100';
    }
    if (form.rating !== '' && form.rating !== null) {
        const r = Number(form.rating);
        if (!Number.isFinite(r) || r < 0 || r > 10) errors.rating = 'Rating must be 0–10';
    }
    if (form.releaseDate && Number.isNaN(Date.parse(form.releaseDate))) {
        errors.releaseDate = 'Invalid release date';
    }
    return errors;
}

function toPayload(form) {
    const splitList = (text) =>
        text.split(',').map((item) => item.trim()).filter(Boolean);

    return {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        tmdbId: form.tmdbId === '' ? undefined : Number(form.tmdbId),
        tagline: form.tagline.trim(),
        releaseDate: form.releaseDate || undefined,
        year: form.year === '' ? undefined : Number(form.year),
        rating: form.rating === '' ? 0 : Number(form.rating),
        votes: form.votes.trim(),
        duration: form.duration.trim(),
        runtime: form.runtime === '' ? 0 : Number(form.runtime),
        genres: splitList(form.genresText),
        director: form.director.trim(),
        cast: splitList(form.castText),
        description: form.description.trim(),
        fullOverview: form.fullOverview.trim(),
        poster: form.poster.trim(),
        backdrop: form.backdrop.trim(),
        trailerKey: form.trailerKey.trim(),
        trailerUrl: form.trailerUrl.trim(),
        isNewRelease: form.isNewRelease
    };
}

export default function MovieFormModal({ movie, genres, onClose, onSaved }) {
    const show = useToast();
    const [form, setForm] = useState(() => toFormState(movie));
    const [errors, setErrors] = useState({});
    const [serverErrors, setServerErrors] = useState({});
    const [pending, setPending] = useState(false);
    const isEdit = Boolean(movie);

    const setField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const clientErrors = validate(form);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setPending(true);
        setServerErrors({});
        try {
            const response = await fetch(isEdit ? `/api/movies/${movie._id}` : '/api/movies', {
                method: isEdit ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toPayload(form))
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (payload.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
                    setServerErrors(payload.errors);
                }
                throw new Error(payload.message || 'Save failed');
            }

            onSaved();
        } catch (err) {
            show({ message: err.message, type: 'error' });
        } finally {
            setPending(false);
        }
    };

    const renderError = (field) => {
        const message = errors[field] || serverErrors[field];
        if (!message) return null;
        return <p className="form-error" role="alert">{message}</p>;
    };

    const genreSuggestions = (genres || []).filter((genre) => !form.genresText.includes(genre));

    return (
        <div className="modal-backdrop admin-modal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit movie' : 'Add movie'}>
            <div className="admin-form-dialog">
                <button type="button" className="modal-close-btn" aria-label="Close form" onClick={onClose}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="admin-form-header">
                    <h2>{isEdit ? `Edit “${movie.title}”` : 'Add Movie'}</h2>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <fieldset className="form-section">
                        <legend>Identity</legend>
                        <div className="form-row">
                            <div className="form-group form-grow">
                                <label htmlFor="mf-title">Title *</label>
                                <input id="mf-title" className="form-input" value={form.title}
                                    onChange={(e) => setField('title', e.target.value)} required />
                                {renderError('title')}
                            </div>
                            <div className="form-group">
                                <label htmlFor="mf-year">Year</label>
                                <input id="mf-year" type="number" className="form-input" value={form.year}
                                    onChange={(e) => setField('year', e.target.value)} min="1888" max="2100" />
                                {renderError('year')}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group form-grow">
                                <label htmlFor="mf-slug">Slug (auto-generated if empty)</label>
                                <input id="mf-slug" className="form-input" value={form.slug}
                                    onChange={(e) => setField('slug', e.target.value)} placeholder="my-movie" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="mf-tmdb">TMDB ID</label>
                                <input id="mf-tmdb" type="number" className="form-input" value={form.tmdbId}
                                    onChange={(e) => setField('tmdbId', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="mf-tagline">Tagline</label>
                            <input id="mf-tagline" className="form-input" value={form.tagline}
                                onChange={(e) => setField('tagline', e.target.value)} />
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>Release & Rating</legend>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="mf-release">Release Date</label>
                                <input id="mf-release" type="date" className="form-input" value={form.releaseDate}
                                    onChange={(e) => setField('releaseDate', e.target.value)} />
                                {renderError('releaseDate')}
                            </div>
                            <div className="form-group">
                                <label htmlFor="mf-rating">Rating (0–10)</label>
                                <input id="mf-rating" type="number" step="0.1" className="form-input" value={form.rating}
                                    onChange={(e) => setField('rating', e.target.value)} min="0" max="10" />
                                {renderError('rating')}
                            </div>
                            <div className="form-group">
                                <label htmlFor="mf-votes">Votes</label>
                                <input id="mf-votes" className="form-input" value={form.votes}
                                    onChange={(e) => setField('votes', e.target.value)} placeholder="12K" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="mf-duration">Duration (display)</label>
                                <input id="mf-duration" className="form-input" value={form.duration}
                                    onChange={(e) => setField('duration', e.target.value)} placeholder="2h 47m" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="mf-runtime">Runtime (minutes)</label>
                                <input id="mf-runtime" type="number" className="form-input" value={form.runtime}
                                    onChange={(e) => setField('runtime', e.target.value)} min="0" />
                            </div>
                            <div className="form-group form-checkbox">
                                <label htmlFor="mf-new">New Release</label>
                                <span className="switch-wrap">
                                    <input id="mf-new" type="checkbox" checked={form.isNewRelease}
                                        onChange={(e) => setField('isNewRelease', e.target.checked)} />
                                    <span className="switch-label">Mark as latest release (hero)</span>
                                </span>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>People</legend>
                        <div className="form-group">
                            <label htmlFor="mf-director">Director</label>
                            <input id="mf-director" className="form-input" value={form.director}
                                onChange={(e) => setField('director', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mf-cast">Cast (comma-separated)</label>
                            <input id="mf-cast" className="form-input" value={form.castText}
                                onChange={(e) => setField('castText', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mf-genres">Genres (comma-separated)</label>
                            <input id="mf-genres" className="form-input" value={form.genresText}
                                onChange={(e) => setField('genresText', e.target.value)}
                                list="genre-suggestions" />
                            <datalist id="genre-suggestions">
                                {genreSuggestions.map((genre) => (
                                    <option key={genre} value={genre} />
                                ))}
                            </datalist>
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>Content</legend>
                        <div className="form-group">
                            <label htmlFor="mf-description">Short Description</label>
                            <textarea id="mf-description" className="form-input" rows="2" value={form.description}
                                onChange={(e) => setField('description', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mf-overview">Full Overview</label>
                            <textarea id="mf-overview" className="form-input" rows="4" value={form.fullOverview}
                                onChange={(e) => setField('fullOverview', e.target.value)} />
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>Media</legend>
                        <div className="form-group">
                            <label htmlFor="mf-poster">Poster URL</label>
                            <input id="mf-poster" type="url" className="form-input" value={form.poster}
                                onChange={(e) => setField('poster', e.target.value)}
                                placeholder="https://image.tmdb.org/t/p/w500/…" />
                            {renderError('poster')}
                        </div>
                        <div className="form-group">
                            <label htmlFor="mf-backdrop">Backdrop URL</label>
                            <input id="mf-backdrop" type="url" className="form-input" value={form.backdrop}
                                onChange={(e) => setField('backdrop', e.target.value)} />
                        </div>
                        <div className="form-row">
                            <div className="form-group form-grow">
                                <label htmlFor="mf-trailerkey">YouTube Trailer Key</label>
                                <input id="mf-trailerkey" className="form-input" value={form.trailerKey}
                                    onChange={(e) => setField('trailerKey', e.target.value)} placeholder="U2Qp5pL3ovA" />
                            </div>
                            <div className="form-group form-grow">
                                <label htmlFor="mf-trailerurl">Trailer URL (fallback)</label>
                                <input id="mf-trailerurl" type="url" className="form-input" value={form.trailerUrl}
                                    onChange={(e) => setField('trailerUrl', e.target.value)} />
                            </div>
                        </div>
                    </fieldset>

                    <div className="admin-form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={pending}>
                            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Movie'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}