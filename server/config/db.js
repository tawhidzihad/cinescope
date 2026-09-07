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
    await mongoose.connect(uri);
    connected = true;
    console.log('MongoDB connected successfully');
  } catch (err) {
    connected = false;
    console.error('MongoDB connection error:', err.message);
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
