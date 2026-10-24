const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');
const { runIdempotentMigrations } = require('../src/utils/schemaMigration');

describe('Schema Migration & Soft-Delete Production Resilience Tests', () => {
  let adminUser;
  let standardUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const pool = db.getPool();
    const [admins] = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'ADMIN' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1");
    adminUser = admins[0] || { id: 3, username: 'admin', email: 'admin@example.com', role: 'ADMIN' };

    const [users] = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'USER' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1");
    standardUser = users[0] || { id: 2, username: 'user', email: 'user@example.com', role: 'USER' };

    adminToken = jwt.sign(
      { userId: adminUser.id, username: adminUser.username, email: adminUser.email, role: 'ADMIN' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: standardUser.id, username: standardUser.username, email: standardUser.email, role: 'USER' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // ---------------------------------------------------------------------------
  // 1. Idempotency and Schema Inspection
  // ---------------------------------------------------------------------------
  test('runIdempotentMigrations runs cleanly and reports up-to-date schema without errors', async () => {
    const pool = db.getPool();
    const result = await runIdempotentMigrations(pool, config.db.database);

    expect(result.success).toBe(true);
    expect(result.database).toBe(config.db.database);
    expect(Array.isArray(result.changes)).toBe(true);

    // Verify both columns exist in INFORMATION_SCHEMA
    const [userStatusCols] = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
    `, [config.db.database]);

    expect(userStatusCols.length).toBe(1);
    expect(userStatusCols[0].COLUMN_TYPE.toLowerCase()).toContain('active');
    expect(userStatusCols[0].COLUMN_TYPE.toLowerCase()).toContain('deleted');

    const [questionStatusCols] = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'status'
    `, [config.db.database]);

    expect(questionStatusCols.length).toBe(1);
    expect(questionStatusCols[0].COLUMN_TYPE.toLowerCase()).toContain('active');
    expect(questionStatusCols[0].COLUMN_TYPE.toLowerCase()).toContain('removed');
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & Soft-Deleted Users
  // ---------------------------------------------------------------------------
  test('Authentication: Login rejects deleted users with 403 Forbidden', async () => {
    // Cleanup any lingering user from previous failed runs
    await db.getPool().query("DELETE FROM users WHERE username IN ('deleted_login_test', 'deleted_token_user')");

    // Create a temporary user with status = 'DELETED'
    const [ins] = await db.getPool().query(`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES ('deleted_login_test', 'deleted_login@test.com', '$2a$10$wT282n0jY6z7C2qG.J5c7u6mYV6Ff4vVwE4x3e7y2o.H5q2x7u4m', 'USER', 'DELETED')
    `);
    const tempId = ins.insertId;

    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'deleted_login@test.com',
          password: 'AnyPassword123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('deleted or deactivated');
    } finally {
      await db.getPool().query('DELETE FROM users WHERE id = ?', [tempId]);
    }
  });

  test('Authentication: Authenticate middleware rejects requests from deleted user token with 401', async () => {
    // Create temporary user with status = 'DELETED'
    const [ins] = await db.getPool().query(`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES ('deleted_token_user', 'deleted_token@test.com', 'dummy_hash', 'USER', 'DELETED')
    `);
    const tempId = ins.insertId;

    const token = jwt.sign(
      { userId: tempId, username: 'deleted_token_user', email: 'deleted_token@test.com', role: 'USER' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    try {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('deactivated or deleted');
    } finally {
      await db.getPool().query('DELETE FROM users WHERE id = ?', [tempId]);
    }
  });

  test('Admin Users List: Excludes deleted users from active-user directory by default', async () => {
    // Create one ACTIVE and one DELETED user
    const [insActive] = await db.getPool().query(`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES ('active_dir_user', 'active_dir@test.com', 'dummy', 'USER', 'ACTIVE')
    `);
    const [insDeleted] = await db.getPool().query(`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES ('deleted_dir_user', 'deleted_dir@test.com', 'dummy', 'USER', 'DELETED')
    `);

    const activeId = insActive.insertId;
    const deletedId = insDeleted.insertId;

    try {
      const res = await request(app)
        .get('/api/admin/users?search=dir_user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const usernames = res.body.users.map(u => u.username);
      expect(usernames).toContain('active_dir_user');
      expect(usernames).not.toContain('deleted_dir_user');
    } finally {
      await db.getPool().query('DELETE FROM users WHERE id IN (?, ?)', [activeId, deletedId]);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Removed Questions & Execution Blocking
  // ---------------------------------------------------------------------------
  test('Practice & Execution: Removed questions are excluded from practice lists and blocked from execution', async () => {
    // Fetch an existing level and contributor
    const [levels] = await db.getPool().query('SELECT id, language_id FROM levels LIMIT 1');
    const [users] = await db.getPool().query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");

    if (levels.length === 0 || users.length === 0) {
      console.warn('Skipping question test: database has no seeded levels or users.');
      return;
    }

    const levelId = levels[0].id;
    const langId = levels[0].language_id;
    const adminId = users[0].id;

    // Create a temporary question with status = 'REMOVED'
    const [qIns] = await db.getPool().query(`
      INSERT INTO questions (
        title, statement, input_format, output_format, constraints_text,
        language_id, level_id, contributor_id, status
      ) VALUES (
        'Removed Question Test', 'Solve this problem', 'Input integer', 'Output integer',
        'N < 100', ?, ?, ?, 'REMOVED'
      )
    `, [langId, levelId, adminId]);

    const removedQuestionId = qIns.insertId;

    try {
      // 1. Verify question does NOT appear in active level questions listing
      const listRes = await request(app)
        .get(`/api/languages/javascript/levels/${levelId}/questions`);

      if (listRes.status === 200 && listRes.body.questions) {
        const ids = listRes.body.questions.map(q => q.id);
        expect(ids).not.toContain(removedQuestionId);
      }

      // 2. Verify runCode on removed question returns 404
      const runRes = await request(app)
        .post('/api/submissions/run')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: removedQuestionId,
          language: 'javascript',
          sourceCode: 'console.log(42);'
        });

      expect(runRes.status).toBe(404);
      expect(runRes.body.success).toBe(false);

      // 3. Verify submitSolution on removed question returns 404
      const submitRes = await request(app)
        .post('/api/submissions/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: removedQuestionId,
          language: 'javascript',
          sourceCode: 'console.log(42);'
        });

      expect(submitRes.status).toBe(404);
      expect(submitRes.body.success).toBe(false);
    } finally {
      await db.getPool().query('DELETE FROM questions WHERE id = ?', [removedQuestionId]);
    }
  });

  afterAll(async () => {
    const pool = db.getPool();
    if (pool) {
      await pool.end();
    }
  });
});
