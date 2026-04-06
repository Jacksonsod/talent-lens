import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

const port = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
	const connected = await connectDB();

	if (!connected) {
	  console.error('MongoDB connection is required. Fix the Atlas connectivity and restart the server.');
	  process.exit(1);
	}

	if (process.env.NODE_ENV !== 'test') {
	  app.listen(port, () => {
		// Keep startup log minimal and explicit for local dev.
		console.log(`TalentLens API listening on http://localhost:${port}`);
	  });
	}
  } catch (error) {
	console.error('Failed to start server:', error);
	process.exit(1);
  }
};

void startServer();

export default app;

