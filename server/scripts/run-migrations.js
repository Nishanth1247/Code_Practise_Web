const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');
const { getSslConfig } = require('../src/config/db');

async function runMigrations() {
  console.log('--- Starting Database Migration ---');
  console.log(`Connecting to MySQL host: ${config.db.host}:${config.db.port} as user: ${config.db.user}`);

  let connection;
  try {
    const connConfig = {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      multipleStatements: true,
      timezone: '+00:00'
    };

    const ssl = getSslConfig();
    if (ssl) {
      connConfig.ssl = ssl;
    }

    // Connect without specifying database first to create database if not exists
    connection = await mysql.createConnection(connConfig);

    console.log('[OK] Connected to MySQL server.');

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${config.db.database}\`;`);
    console.log(`[OK] Selected database '${config.db.database}'.`);

    // Read schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split and execute SQL statements
    console.log('[INFO] Applying schema tables...');
    await connection.query(schemaSql);

    // Safe migration: check existing questions table columns and indexes
    try {
      const [colRows] = await connection.query(`
        SELECT COLUMN_NAME, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions'
      `, [config.db.database]);

      const colNames = colRows.map(r => r.COLUMN_NAME);

      if (colNames.includes('difficulty')) {
        console.log('[MIGRATION] Making difficulty column nullable for backward compatibility...');
        await connection.query(`ALTER TABLE \`questions\` MODIFY COLUMN \`difficulty\` VARCHAR(50) NULL DEFAULT NULL;`);
      }

      if (colNames.includes('topic')) {
        console.log('[MIGRATION] Making topic column nullable for backward compatibility...');
        await connection.query(`ALTER TABLE \`questions\` MODIFY COLUMN \`topic\` VARCHAR(100) NULL DEFAULT NULL;`);
      }

      const [indexRows] = await connection.query(`
        SELECT INDEX_NAME
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND INDEX_NAME = 'idx_questions_difficulty'
      `, [config.db.database]);

      if (indexRows.length > 0) {
        console.log('[MIGRATION] Dropping idx_questions_difficulty index...');
        await connection.query(`ALTER TABLE \`questions\` DROP INDEX \`idx_questions_difficulty\`;`);
      }

      // Check levels table for enabled column
      const [levelColRows] = await connection.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'levels' AND COLUMN_NAME = 'enabled'
      `, [config.db.database]);

      if (levelColRows.length === 0) {
        console.log('[MIGRATION] Adding enabled column to levels table...');
        await connection.query(`ALTER TABLE \`levels\` ADD COLUMN \`enabled\` BOOLEAN NOT NULL DEFAULT TRUE;`);
        console.log('[MIGRATION] Added enabled column to levels table successfully.');
      }
    } catch (migErr) {
      console.warn('[MIGRATION NOTICE] Column compatibility check note:', migErr.message);
    }

    console.log('--- Database Migration Completed Successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied for MySQL user. Please check your DB_USER and DB_PASSWORD in server/.env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\nCould not connect to MySQL server. Please ensure the MySQL service is running.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
