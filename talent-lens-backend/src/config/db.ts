import mongoose from 'mongoose';

const getEnvNumber = (key: string, fallback: number): number => {
	const value = Number(process.env[key]);
	return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI;
  const serverSelectionTimeoutMS = getEnvNumber('MONGO_SERVER_SELECTION_TIMEOUT_MS', 5000);
  const connectTimeoutMS = getEnvNumber('MONGO_CONNECT_TIMEOUT_MS', 5000);

  if (!mongoUri || mongoUri.trim().length === 0) {
	throw new Error('MONGO_URI is not defined.');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS,
      connectTimeoutMS,
    });
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
};

