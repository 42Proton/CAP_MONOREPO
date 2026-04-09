import app from './app.js';
import { env } from './config/env.js';

const PORT = env.NOTIFICATION_PORT || 8085;

app.listen(PORT, () => {
  console.log(`🚀 Notification Service is live on port ${PORT}`);
  console.log(`🔧 Mode: ${env.NODE_ENV}`);
});