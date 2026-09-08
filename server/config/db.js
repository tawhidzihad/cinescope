import mongoose from 'mongoose';

let connected = false;

export async function connectDB() {
  if (connected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Pin the database name so we never fall back to Mongoose's `test`
    // default (dangerous on shared Atlas clusters). Override with MONGODB_DB.
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'cinescope',
      // Fail fast instead of hanging past the serverless function timeout when
      // the cluster is unreachable (e.g. Atlas IP allowlist blocks us).
      serverSelectionTimeoutMS: 8000
    });
    connected = true;
    console.log(`MongoDB connected successfully (db: ${mongoose.connection.name})`);
  } catch (err) {
    connected = false;
    console.error('MongoDB connection error:', err.message);
    console.error('Hints: verify MONGODB_URI is set (in .env locally, or in Netlify Site configuration → Environment variables) and that MongoDB Atlas Network Access allows connections from 0.0.0.0/0, since serverless platforms use dynamic outbound IPs.');
    if (process.env.NETLIFY) {
      throw err;
    }
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    connected = false;
    console.log('MongoDB disconnected');
  });
}

export function isConnected() {
  return connected;
}
