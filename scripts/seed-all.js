import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin1234@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'pass1234@#';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

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
movieSchema.index({ title: 'text', director: 'text', description: 'text' });

movieSchema.pre('save', function() {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    if (this.year) this.slug += `-${this.year}`;
  }
});

const Movie = mongoose.model('Movie', movieSchema);

const dummyMovies = [
  {
    title: 'The Dark Knight',
    tmdbId: 155,
    year: 2008,
    rating: 9.0,
    votes: '2.7M',
    duration: '2h 32m',
    runtime: 152,
    genres: ['Action', 'Crime', 'Drama'],
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    description: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    fullOverview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman has been able to keep a tight lid on crime in Gotham City.',
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6D7GRldqbn0.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg',
    trailerKey: 'EXeTwQWrcwY',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    isNewRelease: false,
    releaseDate: '2008-07-18',
    featured: true
  },
  {
    title: 'Inception',
    tmdbId: 27205,
    year: 2010,
    rating: 8.8,
    votes: '2.4M',
    duration: '2h 28m',
    runtime: 148,
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea into the mind of a C.E.O.',
    fullOverview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
    poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEhniJIssEIbN.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    trailerKey: 'YoHD9XEInc0',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    isNewRelease: false,
    releaseDate: '2010-07-16',
    featured: true
  },
  {
    title: 'Interstellar',
    tmdbId: 157336,
    year: 2014,
    rating: 8.6,
    votes: '1.9M',
    duration: '2h 49m',
    runtime: 169,
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    fullOverview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK1CfY5f0.jpg',
    trailerKey: 'zSWdZVtXT7E',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    isNewRelease: false,
    releaseDate: '2014-11-12',
    featured: true
  },
  {
    title: 'Dune: Part Two',
    tmdbId: 693134,
    year: 2024,
    rating: 8.3,
    votes: '1.2M',
    duration: '2h 46m',
    runtime: 166,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Austin Butler'],
    description: 'Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    fullOverview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nez7.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    trailerKey: 'Way9Dexny3w',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    isNewRelease: true,
    releaseDate: '2024-03-01',
    featured: true
  },
  {
    title: 'Oppenheimer',
    tmdbId: 872585,
    year: 2023,
    rating: 8.5,
    votes: '1.5M',
    duration: '3h',
    runtime: 180,
    genres: ['Drama', 'History', 'Thriller'],
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    fullOverview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    trailerKey: 'uYPbbksJxIg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    isNewRelease: true,
    releaseDate: '2023-07-21',
    featured: true
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    tmdbId: 569094,
    year: 2023,
    rating: 8.6,
    votes: '890K',
    duration: '2h 20m',
    runtime: 140,
    genres: ['Animation', 'Action', 'Adventure'],
    director: 'Joaquim Dos Santos',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Brian Tyree Henry'],
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.',
    fullOverview: 'Miles Morales returns for the next chapter of the Oscar-winning Spider-Verse saga. After reuniting with Gwen Stacy, Brooklyn\'s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/f1zMcKvXJV7QKQAM628U4laCdLm.jpg',
    trailerKey: 'cqGjhVJWtEg',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    isNewRelease: true,
    releaseDate: '2023-06-02',
    featured: false
  },
  {
    title: 'Inside Out 2',
    tmdbId: 1022789,
    year: 2024,
    rating: 7.6,
    votes: '650K',
    duration: '1h 40m',
    runtime: 100,
    genres: ['Animation', 'Comedy', 'Family'],
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Ayo Edebiri'],
    description: 'Teenager Riley\'s headquarter is under renovation when unexpected new emotions show up.',
    fullOverview: 'Teenager Riley\'s headquarter is under renovation when unexpected new emotions show up. They\'re not sure how to feel about being a teenager yet.',
    poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/xg27NrXi7VXCGUr7MN75UqLl6Vg.jpg',
    trailerKey: 'LEjhY15eCx0',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    isNewRelease: true,
    releaseDate: '2024-06-14',
    featured: false
  },
  {
    title: 'Deadpool & Wolverine',
    tmdbId: 533535,
    year: 2024,
    rating: 7.7,
    votes: '780K',
    duration: '2h 8m',
    runtime: 128,
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    description: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him.',
    fullOverview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up with an even more reluctant Wolverine.',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    trailerKey: '73_1biulkYk',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    isNewRelease: true,
    releaseDate: '2024-07-26',
    featured: true
  },
  {
    title: 'Parasite',
    tmdbId: 496243,
    year: 2019,
    rating: 8.6,
    votes: '1.6M',
    duration: '2h 12m',
    runtime: 132,
    genres: ['Comedy', 'Thriller', 'Drama'],
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    fullOverview: 'All unemployed, Ki-taek\'s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get intertwined in an unexpected incident.',
    poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/TU9zFrJCLaBZHN4hKcM0Wv7Pz2.jpg',
    trailerKey: '5xH0HfJHsaY',
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY',
    isNewRelease: false,
    releaseDate: '2019-10-11',
    featured: false
  },
  {
    title: 'The Godfather',
    tmdbId: 238,
    year: 1972,
    rating: 8.7,
    votes: '1.9M',
    duration: '2h 55m',
    runtime: 175,
    genres: ['Drama', 'Crime'],
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    fullOverview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    trailerKey: 'UaVTIH8mujA',
    trailerUrl: 'https://www.youtube.com/watch?v=UaVTIH8mujA',
    isNewRelease: false,
    releaseDate: '1972-03-14',
    featured: true
  },
  {
    title: 'Furiosa: A Mad Max Saga',
    tmdbId: 786892,
    year: 2024,
    rating: 7.5,
    votes: '420K',
    duration: '2h 28m',
    runtime: 148,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    director: 'George Miller',
    cast: ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tom Burke'],
    description: 'The origin story of the renegade young Furiosa before she teamed up with Mad Max.',
    fullOverview: 'The origin story of the renegade young Furiosa before she teamed up with Mad Max in the post-apocalyptic Wasteland.',
    poster: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/shrwC6U8Bkst9c9SnP8K1kFYJIT.jpg',
    trailerKey: 'XJMuhwVlca4',
    trailerUrl: 'https://www.youtube.com/watch?v=XJMuhwVlca4',
    isNewRelease: true,
    releaseDate: '2024-05-24',
    featured: false
  },
  {
    title: 'The Matrix',
    tmdbId: 603,
    year: 1999,
    rating: 8.7,
    votes: '2.0M',
    duration: '2h 16m',
    runtime: 136,
    genres: ['Action', 'Sci-Fi'],
    director: 'Lana Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'],
    description: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth.',
    fullOverview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
    trailerKey: 'vKQi3bBA1y8',
    trailerUrl: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
    isNewRelease: false,
    releaseDate: '1999-03-31',
    featured: true
  }
];

async function seedAll() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed admin user
    console.log('\n--- Seeding Admin User ---');
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
    if (existingAdmin) {
      console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    } else {
      const hashedPw = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const admin = new User({
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password: hashedPw,
        role: 'admin'
      });
      await admin.save();
      console.log(`Admin user created: ${ADMIN_EMAIL}`);
    }

    // Verify admin password works
    const adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() }).select('+password');
    if (adminUser) {
      const pwMatch = await adminUser.comparePassword(ADMIN_PASSWORD);
      console.log(`Admin password verification: ${pwMatch ? 'PASS' : 'FAIL'}`);
      if (!pwMatch) {
        console.log('Resetting admin password...');
        const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await User.updateOne({ _id: adminUser._id }, { password: newHash });
        console.log('Admin password reset successfully');
      }
    }

    // Seed movies
    console.log('\n--- Seeding Movies ---');
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const movie of dummyMovies) {
      try {
        const existing = await Movie.findOne({
          $or: [{ tmdbId: movie.tmdbId }, { slug: movie.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') + '-' + movie.year }]
        });

        if (existing) {
          await Movie.findByIdAndUpdate(existing._id, movie);
          updated++;
        } else {
          const m = new Movie(movie);
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

    console.log(`\nMovie seed complete:`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${dummyMovies.length}`);

    const totalMovies = await Movie.countDocuments();
    console.log(`\nTotal movies in database: ${totalMovies}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('\nDone! You can now start the server with: npm start');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedAll();
