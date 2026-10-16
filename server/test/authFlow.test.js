const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/config/db');

jest.mock('../src/config/db');

describe('User Registration & Login Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Registration assigns USER role by default and ignores client-provided role', async () => {
    let insertedRole = null;

    db.query.mockImplementation(async (sql, params) => {
      if (sql.includes('SELECT id, username, email FROM users WHERE username = ? OR email = ?')) {
        return []; // No existing user
      }
      if (sql.includes('INSERT INTO users')) {
        insertedRole = params[3]; // 4th param is role
        return { insertId: 101 };
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newcoder',
        email: 'newcoder@example.com',
        password: 'Password123!',
        role: 'ADMIN' // Malicious client attempt to elevate role
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('USER');
    expect(insertedRole).toBe('USER'); // Confirms database received strictly 'USER'
  });

  test('Login succeeds with correct credentials and returns JWT token', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('CorrectPassword123!', salt);

    const mockUser = {
      id: 50,
      username: 'dev_user',
      email: 'dev@example.com',
      password_hash: hash,
      role: 'USER',
      created_at: new Date().toISOString()
    };

    db.query.mockImplementation(async (sql) => {
      if (sql.includes('SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?')) {
        return [mockUser];
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dev@example.com',
        password: 'CorrectPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('dev_user');
  });

  test('Login fails with incorrect password returning 401', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('CorrectPassword123!', salt);

    const mockUser = {
      id: 50,
      username: 'dev_user',
      email: 'dev@example.com',
      password_hash: hash,
      role: 'USER'
    };

    db.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return [mockUser];
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dev@example.com',
        password: 'WrongPasswordXYZ'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid email or password');
  });
});
