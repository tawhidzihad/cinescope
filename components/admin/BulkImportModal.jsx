'use client';

// ==========================================================================
// Bulk JSON Import — choose → validate → preview → import (one batch)
// ==========================================================================

import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateRecords(movies) {
    const problems = [];
    const seenSlugs = new Set();
    const seenTmdb = new Set();

    movies.forEach((movie, index) => {
        const label = movie && movie.title ? `#${index + 1} “${movie.title}”` : `#${index + 1}`;
        if (!movie || typeof movie !== 'object') {
            problems.push(`${label}: not an object`);
            return;
        }
        if (!movie.title || typeof movie.title !== 'string' || !movie.title.trim()) {
            problems.push(`${label}: title is required`);
        }
        const slug = (movie.slug || movie.id || '').toString().trim() ||
            movie.title.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (seenSlugs.has(slug)) problems.push(`${label}: duplicate slug “${slug}”`);
        seenSlugs.add(slug);
        if (movie.tmdbId != null && movie.tmdbId !== '') {
            if (seenTmdb.has(movie.tmdbId)) problems.push(`${label}: duplicate TMDB ID ${movie.tmdbId}`);
            seenTmdb.add(movie.tmdbId);
        }
        if (movie.genres !== undefined && !Array.isArray(movie.genres)) {
            problems.push(`${label}: genres must be an array`);
        }
        if (movie.rating !== undefined && (Number(movie.rating) < 0 || Number(movie.rating) > 10)) {
            problems.push(`${label}: rating must be 0–10`);
        }
        if (movie.releaseDate && Number.isNaN(Date.parse(movie.releaseDate))) {
            problems.push(`${label}: invalid releaseDate`);
        }
    });

    return problems;
}

export default function BulkImportModal({ onClose, onImported }) {
    const show = useToast();
    const fileInputRef = useRef(null);
    const [parsed, setParsed] = useState(null); // { movies, fileName }
    const [problems, setProblems] = useState([]);
    const [parseError, setParseError] = useState('');
    const [importMode, setImportMode] = useState('insert');
    const [pending, setPending] = useState(false);

    const handleFile = async (event) => {
        const file = event.target.files && event.target.files[0];
        setParseError('');
        setProblems([]);
        setParsed(null);

        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
            setParseError('Please choose a .json file.');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setParseError('File is too large (max 5 MB). Split it into smaller batches.');
            return;
        }

        let data;
        try {
            const text = await file.text();
            data = JSON.parse(text);
        } catch (err) {
            setParseError(`Invalid JSON: ${err.message}`);
            return;
        }

        const movies = Array.isArray(data) ? data : (data && Array.isArray(data.movies) ? data.movies : null);
        if (!movies) {
            setParseError('Root must be a JSON array of movies, or an object with a "movies" array.');
            return;
        }
        if (movies.length === 0) {
            setParseError('The file contains no movies.');
            return;
        }

        const foundProblems = validateRecords(movies);
        setParsed({ movies, fileName: file.name });
        setProblems(foundProblems);
    };

    const handleImport = async () => {
        if (!parsed || problems.length > 0) return;
        setPending(true);
        try {
            const response = await fetch(
                importMode === 'upsert' ? '/api/movies/bulk?mode=upsert' : '/api/movies/bulk',
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed.movies)
                }
            );
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || 'Import failed');
            }
            onImported(payload.message || 'Import complete');
        } catch (err) {
            show({ message: err.message, type: 'error' });
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="modal-backdrop admin-modal" role="dialog" aria-modal="true" aria-label="Bulk JSON import">
            <div className="admin-form-dialog">
                <button type="button" className="modal-close-btn" aria-label="Close import" onClick={onClose}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="admin-form-header">
                    <h2>Bulk JSON Import</h2>
                </div>

                <div className="form-group">
                    <label htmlFor="bulk-file">Choose a JSON file</label>
                    <input
                        id="bulk-file"
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="form-input"
                        onChange={handleFile}
                    />
                    <p className="form-hint">
                        Format: an array of movie objects (or {'{'}"movies": […]{'}'}). Max 5 MB / 1000
                        records per import.
                    </p>
                </div>

                {parseError && <p className="form-error" role="alert">{parseError}</p>}

                {parsed && (
                    <div className="bulk-preview">
                        <div className="bulk-preview-summary">
                            <strong>{parsed.movies.length}</strong> records found in{' '}
                            <em>{parsed.fileName}</em>
                        </div>

                        {problems.length > 0 ? (
                            <div className="bulk-problems" role="alert">
                                <h3>{problems.length} problem(s) detected — fix them before importing</h3>
                                <ul>
                                    {problems.slice(0, 10).map((problem) => (
                                        <li key={problem}>{problem}</li>
                                    ))}
                                    {problems.length > 10 && <li>…and {problems.length - 10} more</li>}
                                </ul>
                            </div>
                        ) : (
                            <div className="bulk-preview-ok">
                                Validation passed. Ready to import.
                                <div className="form-group" style={{ marginTop: '12px' }}>
                                    <label htmlFor="bulk-mode">Import mode</label>
                                    <select
                                        id="bulk-mode"
                                        className="form-input"
                                        value={importMode}
                                        onChange={(event) => setImportMode(event.target.value)}
                                    >
                                        <option value="insert">Insert only (skip existing slugs)</option>
                                        <option value="upsert">Upsert (replace movies with same slug)</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleImport}
                                    disabled={pending}
                                >
                                    {pending ? 'Importing…' : `Import ${parsed.movies.length} movies`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="admin-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}