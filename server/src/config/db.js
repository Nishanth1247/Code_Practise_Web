const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
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
    });
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
  testConnection
};
