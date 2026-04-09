import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import teamRoutes from './routs/team_routes'; 
import { errorHandler } from './middleware/error-handler';
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000', 
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/teams', teamRoutes);

app.use(errorHandler);

export default app;