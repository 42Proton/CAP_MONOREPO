import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { env } from './config/env.js';

// Cloud Run injects PORT. Fall back to AI_PORT for local/dev compatibility.
const port = Number(process.env.PORT ?? env.AI_PORT ?? 5001);

app.listen(port, () => {
  console.info(`ai-analyzer running on http://localhost:${port}`);
  console.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
