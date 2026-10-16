const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

async function startServer() {
  // Test DB connection on startup
  const dbStatus = await db.testConnection();
  if (dbStatus.connected) {
    console.log(`[DB] MySQL database connected successfully to '${config.db.database}' at ${config.db.host}:${config.db.port}`);
  } else {
    console.warn(`[DB WARNING] Could not connect to MySQL: ${dbStatus.message}`);
    console.warn(`[DB WARNING] Please update server/.env with your MySQL credentials and run migrations.`);
  }

  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`   PracWeb Server running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Client URL:  ${config.clientUrl}`);
    console.log(`   Judge0 URL:  ${config.judge0.apiUrl}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
