const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function bootstrapAdmin() {
  console.log('--- Admin Bootstrap Script ---');

  const { username, email, password } = config.bootstrapAdmin;

  if (!username || !email || !password) {
    console.error('Error: BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD must be defined.');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      timezone: '+00:00'
    });

    console.log(`Checking existing account for email: ${email} or username: ${username}...`);

    const [existing] = await connection.query(
      'SELECT id, username, email, role FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existing.length > 0) {
      const user = existing[0];
      await connection.query(
        'UPDATE users SET role = ?, password_hash = ? WHERE id = ?',
        ['ADMIN', passwordHash, user.id]
      );
      console.log(`[OK] User '${user.username}' (ID: ${user.id}) updated to ADMIN role successfully.`);
    } else {
      const [insertRes] = await connection.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, 'ADMIN']
      );
      console.log(`[OK] Administrator user '${username}' (ID: ${insertRes.insertId}) created successfully with role ADMIN.`);
    }

    console.log('----------------------------------------------------');
    console.log(`Admin Username: ${username}`);
    console.log(`Admin Email:    ${email}`);
    console.log(`Role:           ADMIN`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Admin bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

bootstrapAdmin();
