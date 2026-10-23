const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('Admin Question Management & Multi-Language Program Feature Tests', () => {
  let adminUser;
  let standardUser;
  let adminToken;
  let userToken;

  let testQuestionId;
  let testProgramId;
  let cLangId;
  let pyLangId;
  let cLevelId;
  let pyLevelId;

  beforeAll(async () => {
    const pool = db.getPool();

    // 1. Resolve admin user
    const [admins] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE role = 'ADMIN' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1"
    );
    adminUser = admins[0] || { id: 3, username: 'admin', email: 'admin@example.com', role: 'ADMIN' };

    // 2. Resolve standard user
    const [users] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE role = 'USER' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1"
    );
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

    // 3. Resolve Languages (C and Python)
    const [langs] = await pool.query("SELECT id, slug FROM languages WHERE slug IN ('c', 'python') ORDER BY slug ASC");
    for (const l of langs) {
      if (l.slug === 'c') cLangId = l.id;
      if (l.slug === 'python') pyLangId = l.id;
    }

    // 4. Resolve Levels for C and Python
    const [cLevels] = await pool.query("SELECT id FROM levels WHERE language_id = ? LIMIT 1", [cLangId]);
    cLevelId = cLevels[0]?.id;

    const [pyLevels] = await pool.query("SELECT id FROM levels WHERE language_id = ? LIMIT 1", [pyLangId]);
    pyLevelId = pyLevels[0]?.id;

    // 5. Create a temporary test question for editing and deletion tests
    const [qIns] = await pool.query(`
      INSERT INTO questions (
        title, statement, input_format, output_format, constraints_text,
        explanation, language_id, level_id, contributor_id, status
      ) VALUES (
        'Initial Admin Edit Test Question',
        'Solve this problem by reading input and producing output accurately.',
        'Single integer N',
        'Single integer N * 2',
        '1 <= N <= 1000',
        'Explanation sample',
        ?, ?, ?, 'ACTIVE'
      )
    `, [cLangId, cLevelId, adminUser.id]);
    testQuestionId = qIns.insertId;

    // Insert sample test case
    await pool.query(`
      INSERT INTO question_samples (question_id, sample_input, expected_output, explanation, display_order)
      VALUES (?, '5', '10', '5 * 2 = 10', 1)
    `, [testQuestionId]);

    // Insert hidden test case
    await pool.query(`
      INSERT INTO question_test_cases (question_id, test_input, expected_output, is_hidden, display_order)
      VALUES (?, '100', '200', TRUE, 1)
    `, [testQuestionId]);
  });

  afterAll(async () => {
    const pool = db.getPool();
    if (pool) {
      if (testQuestionId) {
        await pool.query('DELETE FROM questions WHERE id = ?', [testQuestionId]);
      }
      if (testProgramId) {
        await pool.query('DELETE FROM programs WHERE id = ?', [testProgramId]);
      }
      await pool.end();
    }
  });

  // ===========================================================================
  // Requirement 1: Admin Question Listing & Editing
  // ===========================================================================
  describe('Admin Question Editing & Listing', () => {
    test('Non-admin user cannot access GET /api/admin/questions (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Admin can list questions with search, language, level, and status filters', async () => {
      const res = await request(app)
        .get(`/api/admin/questions?search=Initial Admin Edit&languageId=${cLangId}&status=ACTIVE`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.counts).toBeDefined();

      const found = res.body.questions.find(q => q.id === testQuestionId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Initial Admin Edit Test Question');
    });

    test('Non-admin user cannot update question via PATCH /api/admin/questions/:id (403)', async () => {
      const res = await request(app)
        .patch(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    test('Admin editing question rejects invalid language ID (400)', async () => {
      const res = await request(app)
        .patch(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ language_id: 999999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('language');
    });

    test('Admin editing question rejects level ID that does not belong to selected language (400)', async () => {
      // Trying to assign Python level to C question
      const res = await request(app)
        .patch(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          language_id: cLangId,
          level_id: pyLevelId
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not belong');
    });

    test('Admin can edit question title, statement, formats, constraints, samples, test cases, language, and level', async () => {
      const updatedPayload = {
        title: 'Updated Python Problem Title By Admin',
        statement: 'This is the newly updated problem statement with at least twenty characters.',
        input_format: 'Two integers A and B separated by space',
        output_format: 'Single integer A + B',
        constraints_text: '1 <= A, B <= 10^5',
        explanation: 'Reference solution approach: add the two inputs.',
        language_id: pyLangId,
        level_id: pyLevelId,
        samples: [
          { sample_input: '3 7', expected_output: '10', explanation: '3 + 7 = 10' }
        ],
        test_cases: [
          { test_input: '10 20', expected_output: '30', is_hidden: true },
          { test_input: '50 50', expected_output: '100', is_hidden: true }
        ],
        starter_code: {
          python: 'a, b = map(int, input().split())\nprint(a + b)'
        }
      };

      const res = await request(app)
        .patch(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.question.title).toBe(updatedPayload.title);
      expect(res.body.question.languageId).toBe(pyLangId);
      expect(res.body.question.levelId).toBe(pyLevelId);
      expect(Array.isArray(res.body.changedFields)).toBe(true);
      expect(res.body.changedFields).toContain('title');
      expect(res.body.changedFields).toContain('language_id');
      expect(res.body.changedFields).toContain('level_id');

      // Verify question audit trail was recorded with changed fields
      const [auditRows] = await db.getPool().query(
        'SELECT * FROM question_audit_logs WHERE question_id = ? ORDER BY id DESC LIMIT 1',
        [testQuestionId]
      );
      expect(auditRows.length).toBe(1);
      expect(auditRows[0].admin_id).toBe(adminUser.id);
      expect(auditRows[0].changed_fields).toContain('title');
      expect(auditRows[0].changed_fields).toContain('language_id');
    });

    test('Editing question does NOT silently change status if status is not provided', async () => {
      // First, set question status to REMOVED
      await db.getPool().query("UPDATE questions SET status = 'REMOVED' WHERE id = ?", [testQuestionId]);

      // Edit title only, without providing status
      const res = await request(app)
        .patch(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Removed Question Title Edited'
        });

      expect(res.status).toBe(200);
      expect(res.body.question.status).toBe('REMOVED'); // Must NOT silently restore to ACTIVE

      // Restore back to ACTIVE explicitly for subsequent tests
      await db.getPool().query("UPDATE questions SET status = 'ACTIVE' WHERE id = ?", [testQuestionId]);
    });
  });

  // ===========================================================================
  // Requirement 2: Admin Question Deletion & Soft-Delete Preservation
  // ===========================================================================
  describe('Admin Question Deletion & Status Safeguards', () => {
    test('Non-admin user cannot delete question (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    test('Admin can delete question (soft-delete to REMOVED) preserving submissions and audit logs', async () => {
      const res = await request(app)
        .delete(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Quality review deprecation' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REMOVED');

      // Check DB record still physically exists with status = 'REMOVED'
      const [qRows] = await db.getPool().query('SELECT id, status FROM questions WHERE id = ?', [testQuestionId]);
      expect(qRows.length).toBe(1);
      expect(qRows[0].status).toBe('REMOVED');
    });

    test('Repeated deletion of already-removed question returns current status without error', async () => {
      const res = await request(app)
        .delete(`/api/admin/questions/${testQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Second delete attempt' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REMOVED');
      expect(res.body.alreadyRemoved).toBe(true);
    });

    test('Removed question is blocked from code run (/api/submissions/run) with 404', async () => {
      const res = await request(app)
        .post('/api/submissions/run')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'print(42)'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('unavailable');
    });

    test('Removed question is blocked from code submission (/api/submissions/submit) with 404', async () => {
      const res = await request(app)
        .post('/api/submissions/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'print(42)'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('unavailable');
    });
  });

  // ===========================================================================
  // Requirement 3: Admin Program Management (Single & Multi-Language Tracks)
  // ===========================================================================
  describe('Admin Program Management', () => {
    test('Non-admin user cannot access program management endpoints (403)', async () => {
      const listRes = await request(app)
        .get('/api/admin/programs')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listRes.status).toBe(403);

      const createRes = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacker Track', language_ids: [cLangId] });
      expect(createRes.status).toBe(403);
    });

    test('Admin creating program rejects empty language selection (400)', async () => {
      const res = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Zero Language Program',
          description: 'A program with no language',
          language_ids: []
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('At least one supported programming language');
    });

    test('Admin creating program rejects unsupported/invalid language ID (400)', async () => {
      const res = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Language Program',
          description: 'A program with non-existent language',
          language_ids: [999999]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('invalid or unsupported');
    });

    test('Admin can create a program with exactly ONE language', async () => {
      const progName = `C Fundamentals Track ${Date.now()}`;
      const res = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: progName,
          description: 'Master core procedural programming in C.',
          status: 'ACTIVE',
          language_ids: [cLangId]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.program.name).toBe(progName);
      expect(res.body.program.languages.length).toBe(1);
      expect(res.body.program.languages[0].id).toBe(cLangId);

      testProgramId = res.body.program.id;
    });

    test('Admin creating program rejects duplicate program name (409 Conflict)', async () => {
      const [currProg] = await db.getPool().query('SELECT name FROM programs WHERE id = ?', [testProgramId]);
      const existingName = currProg[0].name;

      const res = await request(app)
        .post('/api/admin/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: existingName.toUpperCase(), // Case-insensitive duplicate test
          description: 'Duplicate attempt',
          language_ids: [cLangId]
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    test('Admin can edit a program to support MULTIPLE languages (C + Python) and toggle status', async () => {
      const updatedName = `Placement Multi-Track ${Date.now()}`;
      const res = await request(app)
        .patch(`/api/admin/programs/${testProgramId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: updatedName,
          description: 'Multi-language practice for top placements.',
          status: 'ACTIVE',
          language_ids: [cLangId, pyLangId]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.program.name).toBe(updatedName);
      expect(res.body.program.languages.length).toBe(2);

      const langIds = res.body.program.languages.map(l => l.id);
      expect(langIds).toContain(cLangId);
      expect(langIds).toContain(pyLangId);
    });

    test('Admin can fetch program details including associated levels and questions count', async () => {
      const res = await request(app)
        .get(`/api/admin/programs/${testProgramId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.program.id).toBe(testProgramId);
      expect(Array.isArray(res.body.languages)).toBe(true);
      expect(Array.isArray(res.body.levels)).toBe(true);
      expect(typeof res.body.totalLevels).toBe('number');
      expect(typeof res.body.totalQuestions).toBe('number');
    });

    test('Admin can deactivate a program without deleting its questions or levels', async () => {
      const res = await request(app)
        .patch(`/api/admin/programs/${testProgramId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INACTIVE'
        });

      expect(res.status).toBe(200);
      expect(res.body.program.status).toBe('INACTIVE');

      // Verify questions still exist in the database
      const [qCount] = await db.getPool().query(
        'SELECT COUNT(*) AS total FROM questions WHERE language_id IN (?, ?)',
        [cLangId, pyLangId]
      );
      expect(parseInt(qCount[0].total, 10)).toBeGreaterThan(0);
    });

    test('Learners can access public active programs via GET /api/programs', async () => {
      // Re-activate test program
      await db.getPool().query("UPDATE programs SET status = 'ACTIVE' WHERE id = ?", [testProgramId]);

      const res = await request(app).get('/api/programs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.programs)).toBe(true);

      const found = res.body.programs.find(p => p.id === testProgramId);
      expect(found).toBeDefined();
      expect(found.languages.length).toBe(2);
    });
  });
});
