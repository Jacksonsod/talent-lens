import mongoose from 'mongoose';

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.trim().length === 0) {
	throw new Error('MONGO_URI is not defined.');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
};

