const app = require('./app');
const connectDatabase = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }

  await connectDatabase();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
