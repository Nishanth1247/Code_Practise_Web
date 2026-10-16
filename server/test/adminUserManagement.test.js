const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('Admin User Management Feature Tests', () => {
  const adminUser = { id: 2, username: 'admin', email: 'admin@example.com', role: 'ADMIN' };
  const normalUser = { id: 3, username: 'Nishanth', email: 'nishanthprakash777@gmail.com', role: 'USER' };

  const adminToken = jwt.sign(
    { userId: adminUser.id, username: adminUser.username, email: adminUser.email, role: adminUser.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const userToken = jwt.sign(
    { userId: normalUser.id, username: normalUser.username, email: normalUser.email, role: normalUser.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

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
      .get('/api/admin/users?search=admin&role=ADMIN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach(u => {
      expect(u.role).toBe('ADMIN');
      expect(u.username.toLowerCase().includes('admin') || u.email.toLowerCase().includes('admin')).toBe(true);
    });
  });

  // 3. Single user details
  test('Admin can fetch single user details (GET /api/admin/users/:id)', async () => {
    const res = await request(app)
      .get('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(2);
    expect(res.body.user.username).toBe('admin');
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
      .patch('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Admin updating user rejects invalid username format (400)', async () => {
    const res = await request(app)
      .patch('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'ab' }); // less than 3 chars

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Admin updating user rejects duplicate email (409)', async () => {
    // Attempt to set user 3's email to user 2's email (admin@example.com)
    const res = await request(app)
      .patch('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Email address is already in use');
  });

  test('Admin cannot demote own account from ADMIN to USER (Lockout Prevention)', async () => {
    const res = await request(app)
      .patch('/api/admin/users/2') // admin user's own ID
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'USER' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('cannot remove administrator privileges from your own account');
  });

  // 5. Successful user edit & verification
  test('Admin can successfully edit a user (username, email, role) and changes persist', async () => {
    // Fetch initial state of user 3
    const initialRes = await request(app)
      .get('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`);

    const originalUsername = initialRes.body.user.username;
    const originalEmail = initialRes.body.user.email;
    const originalRole = initialRes.body.user.role;

    // Update user 3
    const updatedUsername = 'Nishanth_Coder';
    const updatedEmail = 'nishanth_test@pracweb.dev';

    const updateRes = await request(app)
      .patch('/api/admin/users/3')
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
      .get('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyRes.body.user.username).toBe(updatedUsername);
    expect(verifyRes.body.user.email).toBe(updatedEmail);

    // Restore original state of user 3
    await request(app)
      .patch('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: originalUsername,
        email: originalEmail,
        role: originalRole
      });
  });

  afterAll(async () => {
    const pool = db.getPool();
    if (pool) {
      await pool.end();
    }
  });
});
