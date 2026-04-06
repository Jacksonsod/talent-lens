import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

const port = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
	// Keep startup log minimal and explicit for local dev.
	console.log(`TalentLens API listening on port ${port}`);
  });
}

export default app;

