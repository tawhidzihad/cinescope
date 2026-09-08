import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Single source of truth: reuse the server's Movie model (schema, indexes,
// and Mongoose 9-safe slug hook) instead of duplicating it here.
import { Movie } from '../server/models/Movie.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  try {
    // Match the server's db.js: pin dbName, never fall back to `test`.
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'cinescope'
    });
    console.log(`Connected to MongoDB (db: ${mongoose.connection.name})`);

    const dataPath = join(__dirname, '..', 'js', 'data', 'movies.js');
    const rawContent = readFileSync(dataPath, 'utf-8');

    const match = rawContent.match(/export\s+const\s+movies\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.error('Could not parse movies data from movies.js');
      process.exit(1);
    }

    const moviesData = JSON.parse(match[1]);
    console.log(`Found ${moviesData.length} movies in static data`);

    const newReleases = ['Dune: Part Two', 'Oppenheimer', 'Spider-Man: Across the Spider-Verse', 'Inside Out 2', 'Deadpool & Wolverine', 'Furiosa: A Mad Max Saga'];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const movie of moviesData) {
      try {
        const movieDoc = {
          title: movie.title,
          tmdbId: movie.tmdbId,
          tagline: movie.tagline || '',
          year: movie.year,
          rating: movie.rating || 0,
          votes: movie.votes || '',
          duration: movie.duration || '',
          runtime: movie.runtime || 0,
          genres: movie.genres || [],
          director: movie.director || '',
          cast: movie.cast || [],
          description: movie.description || '',
          fullOverview: movie.fullOverview || '',
          poster: movie.poster || '',
          backdrop: movie.backdrop || '',
          trailerKey: movie.trailerKey || '',
          trailerUrl: movie.trailerUrl || '',
          trailerSource: movie.trailerSource || 'youtube',
          isNewRelease: newReleases.includes(movie.title) || movie.year >= 2024,
          releaseDate: movie.releaseDate || '',
          featured: movie.featured || false
        };

        const existing = await Movie.findOne({
          $or: [{ tmdbId: movie.tmdbId }, { slug: movie.id }]
        });

        if (existing) {
          await Movie.findByIdAndUpdate(existing._id, movieDoc);
          updated++;
        } else {
          const m = new Movie(movieDoc);
          m.slug = movie.id || undefined;
          await m.save();
          inserted++;
        }
      } catch (err) {
        skipped++;
        if (err.code !== 11000) {
          console.error(`Error seeding "${movie.title}":`, err.message);
        }
      }
    }

    console.log(`\nSeed complete:`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${moviesData.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
