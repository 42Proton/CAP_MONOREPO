import 'dotenv/config';

import app from './app';
import { env } from './config/env.js';

const port = env.PORT;

app.listen(port, () => {
  console.info(`oauth-service running on http://localhost:${port}`);
  console.info(`Environment: ${env.NODE_ENV}`);
});
