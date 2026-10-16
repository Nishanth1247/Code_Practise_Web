const path = require('path');
const dotenv = require('dotenv');

// Load .env from server directory first, fallback to root if not found
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prac_web',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    ssl: String(process.env.DB_SSL || '').toLowerCase() === 'true',
    sslCa: process.env.DB_SSL_CA || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_development_secret_prac_web_2026_xyz',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Code Execution (Judge0)
  judge0: {
    apiUrl: (process.env.JUDGE0_API_URL || 'http://localhost:2358').replace(/\/+$/, ''),
    apiKey: process.env.JUDGE0_API_KEY || '',
    apiHost: process.env.JUDGE0_API_HOST || '',
  },

  // Bootstrap Admin Credentials
  bootstrapAdmin: {
    username: process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin',
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@pracweb.dev',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@PracWeb2026!',
  }
};

module.exports = config;
