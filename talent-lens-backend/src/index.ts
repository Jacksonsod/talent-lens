import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicantRoutes from './routes/applicantRoutes';
import screeningRoutes from './routes/screeningRoutes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const allowedOrigins = frontendUrl
	.split(',')
	.map((origin) => origin.trim())
	.filter((origin) => origin.length > 0);
const port = Number(process.env.PORT) || 5000;

// Security headers
app.use(helmet());

// CORS — allows the frontend (Next.js) to call this API
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for multipart form fields

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/screening', screeningRoutes);

// Health check — useful for Railway/Render deployment monitoring
app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes
app.use((_req, res) => {
	res.status(404).json({ message: 'Route not found' });
});


const startServer = async (): Promise<void> => {
	try {
		const connected = await connectDB();
		if (!connected) {
			console.error('MongoDB connection is required. Fix the Atlas connectivity and restart the server.');
			process.exit(1);
		}
		if (process.env.NODE_ENV !== 'test') {
			app.listen(port, () => {
				console.log(`TalentLens API listening on http://localhost:${port}`);
			});
		}
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};

void startServer();
