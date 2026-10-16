const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;

/**
 * Build SSL configuration for MySQL connection/pool.
 * Enforces certificate verification when SSL is enabled.
 */
function getSslConfig() {
  if (!config.db.ssl) {
    return undefined;
  }

  // Certificate verification is strictly enforced
  const sslOptions = {
    rejectUnauthorized: true
  };

  if (config.db.sslCa) {
    let caContent = config.db.sslCa;

    // Check if sslCa is a path to an existing certificate file or relative path
    try {
      if (typeof caContent === 'string' && !caContent.includes('-----BEGIN CERTIFICATE-----')) {
        // Build candidate paths considering different cwd contexts (root or server dir)
        const candidates = [
          path.isAbsolute(caContent) ? caContent : null,
          path.resolve(process.cwd(), caContent),
          path.resolve(__dirname, '../../', caContent), // relative to server/
          path.resolve(__dirname, '../../../', caContent), // relative to project root
          // Handle when caContent has 'server/' prefix but cwd is already inside server/
          caContent.startsWith('./server/') || caContent.startsWith('server/')
            ? path.resolve(__dirname, '../../', caContent.replace(/^(\.\/)?server\//, ''))
            : null,
          // Handle when caContent is 'ca.pem' or './ca.pem' residing in server/
          path.resolve(__dirname, '../../ca.pem')
        ].filter(Boolean);

        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            caContent = fs.readFileSync(candidate, 'utf8');
            break;
          }
        }
      }
    } catch (e) {
      // If filesystem check fails, treat as raw certificate string
    }

    // If PEM certificate contains literal escaped newlines "\n", unescape them
    if (typeof caContent === 'string' && caContent.includes('\\n')) {
      caContent = caContent.replace(/\\n/g, '\n');
    }

    sslOptions.ca = caContent;
  }

  return sslOptions;
}

function getPool() {
  if (!pool) {
    const poolConfig = {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      timezone: '+00:00',
      dateStrings: true
    };

    const ssl = getSslConfig();
    if (ssl) {
      poolConfig.ssl = ssl;
    }

    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

/**
 * Execute parameterized query with connection from pool
 */
async function query(sql, params = []) {
  const currentPool = getPool();
  const [results] = await currentPool.query(sql, params);
  return results;
}

/**
 * Get a dedicated connection from the pool (for transactions)
 */
async function getConnection() {
  const currentPool = getPool();
  return await currentPool.getConnection();
}

/**
 * Helper to execute a callback within a managed transaction
 */
async function withTransaction(callback) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Test MySQL connection
 */
async function testConnection() {
  try {
    const conn = await getConnection();
    await conn.ping();
    conn.release();
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      message: err.message,
      code: err.code
    };
  }
}

module.exports = {
  getPool,
  query,
  getConnection,
  withTransaction,
  testConnection,
  getSslConfig
};
