import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import {githubRouter} from './routes/auth';
import { errorHandler } from './middleware/error-handler.js';
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser()); 

app.use('/health', healthRouter);
app.use('/api/github', githubRouter);
app.use(errorHandler);

export default app;

