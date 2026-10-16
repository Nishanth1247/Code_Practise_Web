const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');
const { getSslConfig } = require('../src/config/db');
const { runIdempotentMigrations } = require('../src/utils/schemaMigration');

async function runMigrations() {
  console.log('--- Starting Database Migration ---');
  console.log(`Target: MySQL host ${config.db.host}:${config.db.port}, Database: '${config.db.database}'`);

  let connection;
  try {
    const connConfig = {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      multipleStatements: true,
      timezone: '+00:00'
    };

    const ssl = getSslConfig();
    if (ssl) {
      connConfig.ssl = ssl;
      console.log('[INFO] SSL / TLS connection enabled for database.');
    }

    // Attempt direct connection to the target database (recommended for Aiven & cloud MySQL)
    try {
      connection = await mysql.createConnection(connConfig);
      console.log(`[OK] Connected directly to database '${config.db.database}'.`);
    } catch (directConnErr) {
      if (directConnErr.code === 'ER_BAD_DB_ERROR') {
        // Target database does not exist yet (local dev environment)
        console.log(`[INFO] Database '${config.db.database}' does not exist. Connecting to server to create it...`);
        const serverConnConfig = { ...connConfig };
        delete serverConnConfig.database;

        connection = await mysql.createConnection(serverConnConfig);
        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        await connection.query(`USE \`${config.db.database}\`;`);
        console.log(`[OK] Created and selected database '${config.db.database}'.`);
      } else {
        throw directConnErr;
      }
    }

    // 1. Read and apply schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Strip any hardcoded CREATE DATABASE or USE statements to prevent access denied on Aiven
      schemaSql = schemaSql
        .replace(/CREATE\s+DATABASE\s+[^;]+;/gi, '')
        .replace(/USE\s+[^;]+;/gi, '');

      console.log('[INFO] Ensuring core schema tables exist (CREATE TABLE IF NOT EXISTS)...');
      await connection.query(schemaSql);
      console.log('[OK] Core schema tables verified.');
    } else {
      console.warn(`[WARN] Schema file not found at ${schemaPath}; proceeding to column migrations.`);
    }

    // 2. Run idempotent column and index migrations (users.status, questions.status, etc.)
    console.log('[INFO] Running safe idempotent column and index migrations...');
    const result = await runIdempotentMigrations(connection, config.db.database);

    if (result.changes.length > 0) {
      console.log(`[OK] Applied ${result.changes.length} schema update(s):`);
      result.changes.forEach((change) => console.log(`  - ${change}`));
    } else {
      console.log(`[OK] All columns, statuses, indexes, and tables are fully up to date.`);
    }

    console.log('--- Database Migration Completed Successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Please check DB_USER, DB_PASSWORD, and DB_SSL configuration in your environment.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\nCould not connect to MySQL server. Please verify DB_HOST, DB_PORT, and service status.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Execute if run directly from CLI
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
