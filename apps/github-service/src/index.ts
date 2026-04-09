import app from './app.js';
import { env } from './config/env.js';

const PORT = env.GITHUB_SERVICE_PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 GitHub Service is live on port ${PORT}`);
  console.log(`🔧 Mode: ${env.NODE_ENV}`);
});