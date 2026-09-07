import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  tmdbId: { type: Number, unique: true, sparse: true },
  tagline: { type: String, default: '' },
  year: { type: Number },
  rating: { type: Number, default: 0 },
  votes: { type: String, default: '' },
  duration: { type: String, default: '' },
  runtime: { type: Number, default: 0 },
  genres: [{ type: String }],
  director: { type: String, default: '' },
  cast: [{ type: String }],
  description: { type: String, default: '' },
  fullOverview: { type: String, default: '' },
  poster: { type: String, default: '' },
  backdrop: { type: String, default: '' },
  trailerKey: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  trailerSource: { type: String, default: 'youtube' },
  isNewRelease: { type: Boolean, default: false },
  releaseDate: { type: String, default: '' },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

movieSchema.index({ slug: 1 });
movieSchema.index({ tmdbId: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isNewRelease: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ rating: -1 });
movieSchema.index({ title: 'text', director: 'text', description: 'text' });

movieSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    if (this.year) this.slug += `-${this.year}`;
  }
  next();
});

const Movie = mongoose.model('Movie', movieSchema);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

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
