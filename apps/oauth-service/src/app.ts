import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);

// Error handling
app.use(errorHandler);

export default app;
