#!/usr/bin/env node
// ==========================================================================
// Refresh every catalog record from TMDB while preserving local IDs.
// Usage: node scripts/refresh-movie-catalog.mjs
// Requires: TMDB_API_TOKEN or TMDB_API_KEY in .env (or .env.example fallback)
// ==========================================================================

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

function loadEnv() {
  for (const name of ['.env', '.env.example']) {
    const envPath = join(ROOT, name);
    if (!existsSync(envPath)) continue;
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  }
}

loadEnv();

const TMDB_TOKEN = process.env.TMDB_API_TOKEN || process.env.TMDB_API_KEY;
if (!TMDB_TOKEN) {
  console.error('ERROR: TMDB_API_TOKEN or TMDB_API_KEY is not set.');
  process.exit(1);
}

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_W1280 = 'https://image.tmdb.org/t/p/w1280';

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

function loadExistingMovies() {
  const moviesPath = join(ROOT, 'js', 'data', 'movies.js');
  const content = readFileSync(moviesPath, 'utf8');
  const match = content.match(/export const movies = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse existing movies.js');
  return new Function(`return ${match[1]}`)();
}

function looksLikeJwt(token) {
  return token.split('.').length === 3;
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const headers = { Accept: 'application/json' };
  if (looksLikeJwt(TMDB_TOKEN)) {
    headers.Authorization = `Bearer ${TMDB_TOKEN}`;
  } else {
    url.searchParams.set('api_key', TMDB_TOKEN);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB ${path} → ${res.status} ${body.slice(0, 180)}`);
  }
  return res.json();
}

function formatDuration(minutes) {
  if (!minutes) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

function formatVotes(count) {
  if (!count) return 'N/A';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

function selectTrailer(videos) {
  if (!videos?.results?.length) return null;
  const ytVideos = videos.results.filter((v) => v.site === 'YouTube');
  if (ytVideos.length === 0) return null;

  const priorities = [
    (v) => v.type === 'Trailer' && v.official === true,
    (v) => v.type === 'Trailer',
    (v) => v.type === 'Teaser' && v.official === true,
    (v) => v.type === 'Teaser'
  ];

  for (const pred of priorities) {
    const found = ytVideos.find(pred);
    if (found) return found.key;
  }
  return ytVideos[0].key;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toMovieRecord(tmdbData, existing) {
  const year = tmdbData.release_date
    ? parseInt(tmdbData.release_date.split('-')[0], 10)
    : existing.year;

  const genres = (tmdbData.genres || [])
    .map((g) => GENRE_MAP[g.id] || g.name)
    .filter(Boolean)
    .slice(0, 4);

  const director =
    (tmdbData.credits?.crew || [])
      .filter((c) => c.job === 'Director')
      .map((c) => c.name)
      .join(', ') || existing.director || 'Unknown';

  const cast = (tmdbData.credits?.cast || []).slice(0, 5).map((c) => c.name);
  const trailerKey = selectTrailer(tmdbData.videos);
  const overview = tmdbData.overview || existing.fullOverview || existing.description || '';

  return {
    id: existing.id,
    tmdbId: tmdbData.id,
    title: tmdbData.title || tmdbData.original_title || existing.title,
    tagline: tmdbData.tagline || '',
    year,
    rating: Math.round((tmdbData.vote_average || existing.rating || 0) * 10) / 10,
    votes: formatVotes(tmdbData.vote_count),
    duration: formatDuration(tmdbData.runtime),
    genres: genres.length ? genres : existing.genres,
    director,
    cast: cast.length ? cast : existing.cast,
    description: overview.length > 180 ? `${overview.slice(0, 177).trimEnd()}...` : overview,
    fullOverview: overview,
    poster: tmdbData.poster_path
      ? `${TMDB_IMG_W500}${tmdbData.poster_path}`
      : existing.poster,
    backdrop: tmdbData.backdrop_path
      ? `${TMDB_IMG_W1280}${tmdbData.backdrop_path}`
      : existing.backdrop,
    trailerKey: trailerKey || null,
    trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
    trailerSource: trailerKey ? 'youtube' : null,
    featured: !!existing.featured
  };
}

async function searchMovie(title, year) {
  const data = await tmdbFetch('/search/movie', {
    query: title,
    year: year || '',
    include_adult: 'false'
  });
  const results = data.results || [];
  return (
    results.find((r) => {
      const resultYear = r.release_date ? parseInt(r.release_date.split('-')[0], 10) : null;
      return r.title.toLowerCase() === title.toLowerCase() && (!year || resultYear === year);
    }) ||
    results.find((r) => r.title.toLowerCase() === title.toLowerCase()) ||
    results[0] ||
    null
  );
}

function deriveGenres(movies) {
  const preferred = [
    'All',
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Drama',
    'Sci-Fi',
    'Thriller',
    'Biography',
    'History',
    'Mystery',
    'Music',
    'Horror',
    'Romance',
    'Western',
    'War',
    'Fantasy',
    'Family',
    'Sport'
  ];
  const found = new Set();
  for (const movie of movies) {
    for (const genre of movie.genres || []) found.add(genre);
  }
  const ordered = preferred.filter((g) => g === 'All' || found.has(g));
  const extras = [...found].filter((g) => !preferred.includes(g)).sort();
  return [...ordered, ...extras];
}

function generateMoviesFile(movies, genres) {
  return `// ==========================================================================
// CineScope Movie Catalog — Comprehensive Real Movie Data
// Generated: ${new Date().toISOString()}
// Total records: ${movies.length} movies
// Source: The Movie Database (TMDB)
// ==========================================================================

export const movies = ${JSON.stringify(movies, null, 2)};

// Available genres for filter pills
export const availableGenres = ${JSON.stringify(genres, null, 2)};
`;
}

async function resolveDetails(movie) {
  let tmdbId = movie.tmdbId;

  const tryFetch = async (id) => tmdbFetch(`/movie/${id}`, {
    append_to_response: 'credits,videos'
  });

  if (tmdbId) {
    try {
      return await tryFetch(tmdbId);
    } catch (error) {
      if (!String(error.message).includes('404')) throw error;
    }
  }

  const match = await searchMovie(movie.title, movie.year);
  if (!match?.id) return null;
  return tryFetch(match.id);
}

async function main() {
  const existingMovies = loadExistingMovies();
  const onlyId = process.argv[2];
  const targets = onlyId
    ? existingMovies.filter((movie) => movie.id === onlyId)
    : existingMovies;

  if (onlyId && targets.length === 0) {
    throw new Error(`No movie found with id "${onlyId}"`);
  }

  console.log(`Refreshing ${targets.length} movies from TMDB...\n`);

  const refreshedById = new Map(existingMovies.map((movie) => [movie.id, movie]));
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const movie = targets[i];
    const label = `[${i + 1}/${targets.length}] ${movie.title}`;

    try {
      const details = await resolveDetails(movie);

      if (!details) {
        failed += 1;
        refreshedById.set(movie.id, movie);
        console.warn(`${label} — no TMDB match, kept local record`);
        continue;
      }

      if (!details.poster_path && !movie.poster) {
        failed += 1;
        refreshedById.set(movie.id, movie);
        console.warn(`${label} — missing poster, kept local record`);
      } else {
        refreshedById.set(movie.id, toMovieRecord(details, movie));
        ok += 1;
        console.log(`${label} — OK (${details.poster_path || 'kept poster'})`);
      }
    } catch (error) {
      failed += 1;
      refreshedById.set(movie.id, movie);
      console.warn(`${label} — ${error.message}`);
    }

    await sleep(80);
  }

  const refreshed = existingMovies.map((movie) => refreshedById.get(movie.id) || movie);
  const genres = deriveGenres(refreshed);
  const outPath = join(ROOT, 'js', 'data', 'movies.js');
  writeFileSync(outPath, generateMoviesFile(refreshed, genres), 'utf8');

  const posters = refreshed.map((m) => m.poster).filter(Boolean);
  const uniquePosters = new Set(posters);
  console.log(`\nWrote ${refreshed.length} movies to ${outPath}`);
  console.log(`Updated: ${ok}  Unchanged/failed: ${failed}`);
  console.log(`Unique posters: ${uniquePosters.size}/${posters.length}`);
}

main().catch((error) => {
  console.error('FATAL:', error);
  process.exit(1);
});
