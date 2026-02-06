import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);

// Error handling
app.use(errorHandler);

export default app;
