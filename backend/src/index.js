import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import config from './config/env.js';
import authRoutes from './routes/auth.js';
import chainRoutes from './routes/chains.js';
import visitRoutes from './routes/visits.js';
import friendRoutes from './routes/friends.js';
import leaderboardRoutes from './routes/leaderboard.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/chains', chainRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`ChainChaser API running on port ${config.port}`);
});
