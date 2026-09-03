#!/usr/bin/env node
// ==========================================================================
// CineScope Movie Catalog Generator
// Fetches movie data from TMDB API and generates js/data/movies.js
// Usage: node scripts/generate-movie-catalog.mjs
// Requires: TMDB_API_TOKEN in .env
// ==========================================================================

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// --- Load environment variables from .env ---
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) {
    console.error('ERROR: .env file not found. Copy .env.example to .env and fill in your TMDB_API_TOKEN.');
    process.exit(1);
  }
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

loadEnv();

const TMDB_TOKEN = process.env.TMDB_API_TOKEN;
if (!TMDB_TOKEN) {
  console.error('ERROR: TMDB_API_TOKEN is not set in .env');
  process.exit(1);
}

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const TMDB_IMG_W1280 = 'https://image.tmdb.org/t/p/w1280';

// --- Load existing movies to preserve them ---
function loadExistingMovies() {
  const moviesPath = join(ROOT, 'js', 'data', 'movies.js');
  const content = readFileSync(moviesPath, 'utf8');
  // Extract the array using eval-like approach (safe since it's our own file)
  const match = content.match(/export const movies = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse existing movies.js');
  // Use Function constructor to safely evaluate the array literal
  return new Function(`return ${match[1]}`)();
}

// --- TMDB API helper ---
async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`);
  return res.json();
}

// --- Format duration ---
function formatDuration(minutes) {
  if (!minutes) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

// --- Format votes ---
function formatVotes(count) {
  if (!count) return 'N/A';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

// --- Slugify a title into an id ---
function slugify(title, year) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + (year ? `-${year}` : '');
}

// --- Select best YouTube trailer from TMDB videos ---
function selectTrailer(videos) {
  if (!videos || !videos.results || videos.results.length === 0) return null;
  
  const ytVideos = videos.results.filter(v => v.site === 'YouTube');
  if (ytVideos.length === 0) return null;

  // Priority: official trailers > trailers > teasers
  const priorities = [
    v => v.type === 'Trailer' && v.official === true,
    v => v.type === 'Trailer',
    v => v.type === 'Teaser' && v.official === true,
    v => v.type === 'Teaser',
  ];

  for (const pred of priorities) {
    const found = ytVideos.find(pred);
    if (found) return found.key;
  }
  return ytVideos[0].key;
}

// --- Map TMDB genre IDs to genre names ---
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

// --- Fetch full movie details + credits + videos ---
async function fetchMovieDetails(tmdbId) {
  try {
    const data = await tmdbFetch(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos'
    });
    return data;
  } catch (e) {
    console.warn(`  WARN: Failed to fetch TMDB ID ${tmdbId}: ${e.message}`);
    return null;
  }
}

// --- Convert TMDB detail to CineScope schema ---
function toMovieRecord(tmdbData, existingId = null) {
  const title = tmdbData.title || tmdbData.original_title;
  const year = tmdbData.release_date ? parseInt(tmdbData.release_date.split('-')[0]) : null;
  const id = existingId || slugify(title, year);

  const genres = (tmdbData.genres || [])
    .map(g => GENRE_MAP[g.id] || g.name)
    .filter(Boolean)
    .slice(0, 4);

  const director = (tmdbData.credits?.crew || [])
    .filter(c => c.job === 'Director')
    .map(c => c.name)
    .join(', ') || 'Unknown';

  const cast = (tmdbData.credits?.cast || [])
    .slice(0, 5)
    .map(c => c.name);

  const trailerKey = selectTrailer(tmdbData.videos);

  return {
    id,
    tmdbId: tmdbData.id,
    title,
    tagline: tmdbData.tagline || '',
    year,
    rating: Math.round(tmdbData.vote_average * 10) / 10,
    votes: formatVotes(tmdbData.vote_count),
    duration: formatDuration(tmdbData.runtime),
    genres,
    director,
    cast,
    description: tmdbData.overview
      ? tmdbData.overview.substring(0, 180).trimEnd() + (tmdbData.overview.length > 180 ? '...' : '')
      : '',
    fullOverview: tmdbData.overview || '',
    poster: tmdbData.poster_path ? `${TMDB_IMG_W500}${tmdbData.poster_path}` : null,
    backdrop: tmdbData.backdrop_path ? `${TMDB_IMG_W1280}${tmdbData.backdrop_path}` : null,
    trailerKey: trailerKey || null,
    trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
    trailerSource: trailerKey ? 'youtube' : null,
    featured: false,
  };
}

// --- Fetch top movies from TMDB discover endpoint ---
async function fetchDiscoverPage(page, sortBy = 'vote_count.desc') {
  return tmdbFetch('/discover/movie', {
    sort_by: sortBy,
    'vote_count.gte': 10000,
    'vote_average.gte': 6.0,
    with_original_language: 'en',
    page,
  });
}

// --- Main generation function ---
async function main() {
  console.log('CineScope Movie Catalog Generator');
  console.log('==================================');

  // Load existing movies
  console.log('\n[1] Loading existing movies...');
  let existingMovies;
  try {
    existingMovies = loadExistingMovies();
    console.log(`    Found ${existingMovies.length} existing movies`);
  } catch (e) {
    console.error('Failed to load existing movies:', e.message);
    process.exit(1);
  }

  const existingTmdbIds = new Set(existingMovies.filter(m => m.tmdbId).map(m => m.tmdbId));
  const existingTitles = new Set(existingMovies.map(m => m.title.toLowerCase()));

  // Enrich existing movies without tmdbId
  console.log('\n[2] Enriching existing movies with TMDB data...');
  const enrichedExisting = [];
  for (const movie of existingMovies) {
    if (movie.tmdbId && (movie.trailerKey !== undefined)) {
      enrichedExisting.push(movie);
      console.log(`    [SKIP] ${movie.title} — already has TMDB data`);
      continue;
    }

    // Search for the movie on TMDB
    try {
      const searchResult = await tmdbFetch('/search/movie', { query: movie.title });
      const match = searchResult.results?.find(r =>
        r.title.toLowerCase() === movie.title.toLowerCase() ||
        (r.release_date && parseInt(r.release_date) === movie.year)
      ) || searchResult.results?.[0];

      if (match) {
        const details = await fetchMovieDetails(match.id);
        if (details) {
          const enriched = toMovieRecord(details, movie.id);
          enriched.featured = movie.featured || false;
          enrichedExisting.push(enriched);
          existingTmdbIds.add(details.id);
          console.log(`    [OK] ${movie.title} → TMDB ${details.id}, trailer: ${enriched.trailerKey ? '✓' : '✗'}`);
        } else {
          enrichedExisting.push(movie);
        }
      } else {
        enrichedExisting.push(movie);
        console.log(`    [MISS] ${movie.title} — no TMDB match found`);
      }
    } catch (e) {
      enrichedExisting.push(movie);
      console.warn(`    [ERR] ${movie.title}: ${e.message}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 250));
  }

  // Collect new movies
  console.log('\n[3] Fetching new movies from TMDB...');
  const newMovies = [];
  const TARGET_NEW = 200;
  let page = 1;

  while (newMovies.length < TARGET_NEW && page <= 20) {
    console.log(`    Page ${page} (have ${newMovies.length}/${TARGET_NEW})...`);

    let discoverData;
    try {
      discoverData = await fetchDiscoverPage(page);
    } catch (e) {
      console.warn(`    WARN: Discover page ${page} failed: ${e.message}`);
      break;
    }

    for (const movie of (discoverData.results || [])) {
      if (newMovies.length >= TARGET_NEW) break;
      if (existingTmdbIds.has(movie.id)) continue;
      if (existingTitles.has(movie.title.toLowerCase())) continue;
      if (!movie.poster_path) continue;
      if (movie.vote_count < 10000) continue;

      try {
        const details = await fetchMovieDetails(movie.id);
        if (!details || !details.poster_path) continue;

        const record = toMovieRecord(details);
        if (!record.poster || !record.genres.length) continue;

        newMovies.push(record);
        existingTmdbIds.add(details.id);
        existingTitles.add(record.title.toLowerCase());
        console.log(`    [+] ${record.title} (${record.year}) — trailer: ${record.trailerKey ? '✓' : '✗'}`);

        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.warn(`    [ERR] ${movie.title}: ${e.message}`);
      }
    }

    page++;
    await new Promise(r => setTimeout(r, 500));
  }

  // Combine all movies
  const allMovies = [...enrichedExisting, ...newMovies];
  console.log(`\n[4] Total movies: ${allMovies.length} (${enrichedExisting.length} existing + ${newMovies.length} new)`);

  // Derive all genres for the export
  const genreSet = new Set(['All']);
  for (const m of allMovies) {
    for (const g of m.genres) genreSet.add(g);
  }
  const sortedGenres = ['All', ...Array.from(genreSet).filter(g => g !== 'All').sort()];

  // Generate output
  const output = generateMoviesFile(allMovies, sortedGenres);

  const outPath = join(ROOT, 'js', 'data', 'movies.js');
  writeFileSync(outPath, output, 'utf8');
  console.log(`\n[5] Written to ${outPath}`);
  console.log('\nDone! Run: npm run data:validate');
}

function generateMoviesFile(movies, genres) {
  const moviesJson = movies.map(m => {
    return `  {
    id: ${JSON.stringify(m.id)},
    tmdbId: ${m.tmdbId || null},
    title: ${JSON.stringify(m.title)},
    tagline: ${JSON.stringify(m.tagline || '')},
    year: ${m.year},
    rating: ${m.rating},
    votes: ${JSON.stringify(m.votes)},
    duration: ${JSON.stringify(m.duration)},
    genres: ${JSON.stringify(m.genres)},
    director: ${JSON.stringify(m.director)},
    cast: ${JSON.stringify(m.cast)},
    description: ${JSON.stringify(m.description)},
    fullOverview: ${JSON.stringify(m.fullOverview)},
    poster: ${JSON.stringify(m.poster)},
    backdrop: ${JSON.stringify(m.backdrop)},
    trailerKey: ${JSON.stringify(m.trailerKey)},
    trailerUrl: ${JSON.stringify(m.trailerUrl)},
    trailerSource: ${JSON.stringify(m.trailerSource)},
    featured: ${!!m.featured}
  }`;
  }).join(',\n');

  return `// ==========================================================================
// CineScope Movie Catalog — Generated by scripts/generate-movie-catalog.mjs
// DO NOT EDIT MANUALLY — Re-run: npm run data:generate
// Generated: ${new Date().toISOString()}
// Total: ${movies.length} movies
// ==========================================================================

export const movies = [
${moviesJson}
];

// Available genres derived from catalog (keep existing ones first for backwards compat)
export const availableGenres = ${JSON.stringify(genres, null, 2)};
`;
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
