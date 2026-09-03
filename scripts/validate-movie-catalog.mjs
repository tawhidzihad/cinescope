#!/usr/bin/env node
// ==========================================================================
// CineScope Movie Catalog Validator
// Usage: node scripts/validate-movie-catalog.mjs
// ==========================================================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Read and parse movies.js
function loadMovies() {
  const moviesPath = join(ROOT, 'js', 'data', 'movies.js');
  const content = readFileSync(moviesPath, 'utf8');
  const match = content.match(/export const movies = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse movies.js');
  return new Function(`return ${match[1]}`)();
}

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function check(label, value, message) {
  if (value) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.error(`  ✗ ${label}: ${message}`);
    failCount++;
  }
}

function warn(label, condition, message) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.warn(`  ⚠ ${label}: ${message}`);
    warnCount++;
  }
}

async function main() {
  console.log('CineScope Catalog Validator');
  console.log('===========================\n');

  let movies;
  try {
    movies = loadMovies();
    console.log(`Loaded ${movies.length} movies from js/data/movies.js\n`);
  } catch (e) {
    console.error('FATAL: Could not load movies.js:', e.message);
    process.exit(1);
  }

  // --- Global checks ---
  console.log('## Global Checks');
  check('Total movies >= 216', movies.length >= 216, `Only ${movies.length} movies found`);

  const ids = movies.map(m => m.id);
  const uniqueIds = new Set(ids);
  check('Unique IDs = total movies', uniqueIds.size === movies.length,
    `${movies.length - uniqueIds.size} duplicate IDs found`);

  const tmdbIds = movies.filter(m => m.tmdbId).map(m => m.tmdbId);
  const uniqueTmdbIds = new Set(tmdbIds);
  warn('No duplicate TMDB IDs', uniqueTmdbIds.size === tmdbIds.length,
    `${tmdbIds.length - uniqueTmdbIds.size} duplicate TMDB IDs found`);

  // --- Per-movie checks ---
  console.log('\n## Per-Movie Data Quality Checks');
  let missingTitle = 0, missingYear = 0, invalidRating = 0, missingGenres = 0;
  let missingPoster = 0, missingDescription = 0, invalidTrailerKey = 0;

  const YOUTUBE_KEY_RE = /^[A-Za-z0-9_-]{11}$/;
  const knownBadMovies = [];

  for (const m of movies) {
    const errors = [];

    if (!m.title) { missingTitle++; errors.push('missing title'); }
    if (!m.year || m.year < 1888 || m.year > new Date().getFullYear() + 2) {
      missingYear++; errors.push(`invalid year: ${m.year}`);
    }
    if (typeof m.rating !== 'number' || m.rating < 0 || m.rating > 10) {
      invalidRating++; errors.push(`invalid rating: ${m.rating}`);
    }
    if (!m.genres || !Array.isArray(m.genres) || m.genres.length === 0) {
      missingGenres++; errors.push('missing/empty genres');
    }
    if (!m.poster) {
      missingPoster++; errors.push('missing poster URL');
    }
    if (!m.description && !m.fullOverview) {
      missingDescription++; errors.push('missing description/overview');
    }

    // Trailer validation
    if (m.trailerKey !== null && m.trailerKey !== undefined) {
      if (!YOUTUBE_KEY_RE.test(m.trailerKey)) {
        invalidTrailerKey++;
        errors.push(`invalid YouTube key: "${m.trailerKey}"`);
      }
      if (m.trailerSource !== 'youtube') {
        errors.push(`trailerSource should be "youtube" when trailerKey is set`);
      }
    }

    if (errors.length > 0) {
      knownBadMovies.push({ id: m.id, title: m.title, errors });
    }
  }

  check('All movies have titles', missingTitle === 0, `${missingTitle} missing`);
  check('All movies have valid years', missingYear === 0, `${missingYear} invalid`);
  check('All movies have valid ratings', invalidRating === 0, `${invalidRating} invalid`);
  check('All movies have genres', missingGenres === 0, `${missingGenres} empty`);
  check('All movies have posters', missingPoster === 0, `${missingPoster} missing`);
  check('All movies have descriptions', missingDescription === 0, `${missingDescription} missing`);
  check('All trailer keys are valid YouTube IDs', invalidTrailerKey === 0, `${invalidTrailerKey} invalid`);

  // --- Trailer statistics ---
  const withTrailer = movies.filter(m => m.trailerKey).length;
  const withoutTrailer = movies.filter(m => !m.trailerKey).length;
  console.log(`\n## Trailer Statistics`);
  console.log(`  Movies with trailer:    ${withTrailer} (${Math.round(withTrailer/movies.length*100)}%)`);
  console.log(`  Movies without trailer: ${withoutTrailer} (${Math.round(withoutTrailer/movies.length*100)}%)`);

  // Fake trailer keys check
  const FAKE_KEYS = ['placeholder', 'dQw4w9WgXcQ', 'trailer', 'none', 'fake', 'test'];
  const fakeCount = movies.filter(m => m.trailerKey && FAKE_KEYS.includes(m.trailerKey)).length;
  check('No fake/placeholder trailer keys', fakeCount === 0, `${fakeCount} fake keys found`);

  // --- Genre coverage ---
  const allGenres = new Set();
  movies.forEach(m => (m.genres || []).forEach(g => allGenres.add(g)));
  const requiredGenres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Sci-Fi', 'Thriller'];
  const missingRequired = requiredGenres.filter(g => !allGenres.has(g));
  console.log(`\n## Genre Coverage`);
  console.log(`  Total unique genres: ${allGenres.size}`);
  console.log(`  Genres found: ${Array.from(allGenres).sort().join(', ')}`);
  check('Required genres present', missingRequired.length === 0,
    `Missing: ${missingRequired.join(', ')}`);

  // --- Known problematic movies ---
  if (knownBadMovies.length > 0) {
    console.log(`\n## Issues Found in ${knownBadMovies.length} Movie(s):`);
    for (const { id, title, errors } of knownBadMovies.slice(0, 20)) {
      console.log(`  - [${id}] "${title}": ${errors.join('; ')}`);
    }
    if (knownBadMovies.length > 20) {
      console.log(`  ... and ${knownBadMovies.length - 20} more`);
    }
  }

  // --- Summary ---
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
  if (failCount > 0) {
    console.error('\nVALIDATION FAILED — fix the issues above before deployment.');
    process.exit(1);
  } else if (warnCount > 0) {
    console.warn('\nVALIDATION PASSED WITH WARNINGS — review warnings above.');
  } else {
    console.log('\nVALIDATION PASSED ✓ — catalog is production-ready.');
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
