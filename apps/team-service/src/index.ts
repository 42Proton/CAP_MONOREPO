import 'dotenv/config';
import app from './app';

const PORT = process.env.TEAM_PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Team Service is running on http://localhost:${PORT}`);
});