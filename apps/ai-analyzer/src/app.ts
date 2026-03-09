import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/error-handler.js';
const app: Application = express();

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000', 
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/ai', aiRouter);
app.use('/health', healthRouter);

app.use(errorHandler);

export default app;