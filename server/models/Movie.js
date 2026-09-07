import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 300
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  tmdbId: {
    type: Number,
    unique: true,
    sparse: true
  },
  tagline: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    min: 1888,
    max: 2100
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  votes: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  runtime: {
    type: Number,
    min: 0,
    default: 0
  },
  genres: [{
    type: String,
    trim: true
  }],
  director: {
    type: String,
    trim: true,
    default: ''
  },
  cast: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    default: ''
  },
  fullOverview: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  backdrop: {
    type: String,
    default: ''
  },
  trailerKey: {
    type: String,
    default: ''
  },
  trailerUrl: {
    type: String,
    default: ''
  },
  trailerSource: {
    type: String,
    default: 'youtube'
  },
  isNewRelease: {
    type: Boolean,
    default: false
  },
  releaseDate: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

movieSchema.index({ title: 'text', director: 'text', description: 'text' });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isNewRelease: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ rating: -1 });
movieSchema.index({ createdAt: -1 });

movieSchema.pre('save', function() {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    if (this.year) {
      this.slug += `-${this.year}`;
    }
  }
});

export const Movie = mongoose.model('Movie', movieSchema);
