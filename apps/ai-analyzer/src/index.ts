import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { env } from './config/env.js';

const port = env.AI_PORT || 5001;

app.listen(port, () => {
  console.info(`ai-analyzer running on http://localhost:${port}`);
  console.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
