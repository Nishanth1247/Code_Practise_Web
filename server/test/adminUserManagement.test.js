const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('Admin User Management Feature Tests', () => {
  let adminUser;
  let normalUser;
  let rootAdminUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const pool = db.getPool();
    const [admins] = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'ADMIN' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1");
    adminUser = admins[0] || { id: 3, username: 'admin', email: 'admin@example.com', role: 'ADMIN' };

    const [users] = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'USER' AND (status = 'ACTIVE' OR status IS NULL) AND email != 'admin@example.com' LIMIT 1");
    normalUser = users[0] || { id: 5, username: 'user', email: 'user@example.com', role: 'USER' };

    const [rootAdmins] = await pool.query("SELECT id, username, email, role FROM users WHERE email = 'admin@example.com' LIMIT 1");
    rootAdminUser = rootAdmins[0] || { id: 2, email: 'admin@example.com' };

    adminToken = jwt.sign(
      { userId: adminUser.id, username: adminUser.username, email: adminUser.email, role: 'ADMIN' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: normalUser.id, username: normalUser.username, email: normalUser.email, role: 'USER' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // 1. Authorization checks
  test('Unauthenticated user cannot access GET /api/admin/users (401)', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Standard USER cannot access GET /api/admin/users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Administrator privileges required');
  });

  // 2. Listing users
  test('Admin can list users with pagination, counts, and search', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.counts).toBeDefined();

    // Verify fields of user objects
    const firstUser = res.body.users[0];
    expect(firstUser.id).toBeDefined();
    expect(firstUser.username).toBeDefined();
    expect(firstUser.email).toBeDefined();
    expect(firstUser.role).toBeDefined();
    expect(firstUser.status).toBe('ACTIVE');

    // CRITICAL SECURITY ASSERTION: Password hashes must NEVER be exposed
    res.body.users.forEach(u => {
      expect(u.password_hash).toBeUndefined();
      expect(u.password).toBeUndefined();
    });
  });

  test('Admin can search users by username and filter by role', async () => {
    const res = await request(app)
      .get(`/api/admin/users?search=${encodeURIComponent(adminUser.username)}&role=ADMIN`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach(u => {
      expect(u.role).toBe('ADMIN');
      expect(
        u.username.toLowerCase().includes(adminUser.username.toLowerCase()) ||
        u.email.toLowerCase().includes(adminUser.username.toLowerCase())
      ).toBe(true);
    });
  });

  // 3. Single user details
  test('Admin can fetch single user details (GET /api/admin/users/:id)', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(normalUser.id);
    expect(res.body.user.username).toBe(normalUser.username);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('Fetching non-existent user returns 404', async () => {
    const res = await request(app)
      .get('/api/admin/users/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 4. Update validations
  test('Admin updating user rejects invalid email format (400)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Admin updating user rejects invalid username format (400)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'ab' }); // less than 3 chars

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Admin updating user rejects duplicate email (409)', async () => {
    // Attempt to set normalUser's email to adminUser's email
    const res = await request(app)
      .patch(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: adminUser.email });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Email address is already in use');
  });

  test('Admin cannot demote own account from ADMIN to USER (Lockout Prevention)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser.id}`) // admin user's own ID
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'USER' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('cannot remove administrator privileges from your own account');
  });

  // 5. Successful user edit & verification
  test('Admin can successfully edit a user (username, email, role) and changes persist', async () => {
    // Fetch initial state of normalUser
    const initialRes = await request(app)
      .get(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const originalUsername = initialRes.body.user.username;
    const originalEmail = initialRes.body.user.email;
    const originalRole = initialRes.body.user.role;

    // Update normalUser
    const updatedUsername = `${originalUsername}_Test`.slice(0, 30);
    const updatedEmail = `test_${Date.now()}@pracweb.dev`;

    const updateRes = await request(app)
      .patch(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: updatedUsername,
        email: updatedEmail,
        role: 'USER'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.user.username).toBe(updatedUsername);
    expect(updateRes.body.user.email).toBe(updatedEmail);

    // Verify in database by querying directly or via GET endpoint
    const verifyRes = await request(app)
      .get(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyRes.body.user.username).toBe(updatedUsername);
    expect(verifyRes.body.user.email).toBe(updatedEmail);

    // Restore original state of normalUser
    await request(app)
      .patch(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: originalUsername,
        email: originalEmail,
        role: originalRole
      });
  });

  // 6. User Deletion Tests
  test('Standard USER cannot call DELETE /api/admin/users/:id (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Admin cannot delete their own account (Self-deletion prevention)', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminUser.id}`) // admin user's own ID
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('cannot delete your own administrator account');
  });

  test('Admin cannot delete the primary root administrator account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${rootAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Admin can soft-delete a test user, excluding them from active lists while preserving historical data', async () => {
    // 1. Create a disposable test user directly in DB
    const [createRes] = await db.getPool().query(`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES ('temp_delete_test', 'temp_delete@test.com', 'dummyhash123', 'USER', 'ACTIVE')
    `);
    const testUserId = createRes.insertId;

    try {
      // 2. Admin soft-deletes the user
      const deleteRes = await request(app)
        .delete(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.status).toBe('DELETED');

      // 3. User is excluded from active user list
      const listRes = await request(app)
        .get('/api/admin/users?search=temp_delete_test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.body.users.length).toBe(0);

      // 4. Verify record still exists in DB with status = 'DELETED'
      const [userRows] = await db.getPool().query('SELECT id, status FROM users WHERE id = ?', [testUserId]);
      expect(userRows.length).toBe(1);
      expect(userRows[0].status).toBe('DELETED');
    } finally {
      // Clean up test record completely
      await db.getPool().query('DELETE FROM users WHERE id = ?', [testUserId]);
    }
  });

  afterAll(async () => {
    const pool = db.getPool();
    if (pool) {
      await pool.end();
    }
  });
});
