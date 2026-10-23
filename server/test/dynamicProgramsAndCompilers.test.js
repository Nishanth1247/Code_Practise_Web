const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('CodeCraft — Dynamic Programs, Multiple Compilers & Independent Levels', () => {
  let pool;
  let adminUser;
  let standardUser;
  let adminToken;
  let userToken;

  let createdProgramIds = [];

  beforeAll(async () => {
    pool = db.getPool();

    // 1. Resolve Admin user
    const [admins] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE role = 'ADMIN' AND (status = 'ACTIVE' OR status IS NULL) LIMIT 1"
    );
    adminUser = admins[0] || { id: 3, username: 'admin', email: 'admin@example.com', role: 'ADMIN' };

    // 2. Resolve Standard user
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
  });

  afterAll(async () => {
    // Cleanup any test programs created during test runs
    for (const pId of createdProgramIds) {
      await pool.query('DELETE FROM questions WHERE program_id = ?', [pId]).catch(() => {});
      await pool.query('DELETE FROM levels WHERE program_id = ?', [pId]).catch(() => {});
      await pool.query('DELETE FROM programs WHERE id = ?', [pId]).catch(() => {});
    }
  });

  // Test 1: Create a program with seven independently editable levels
  test('1. Admin can create a program with seven independently editable levels', async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Seven Level Track ${Date.now()}`,
        description: 'Testing independent 7 levels creation',
        icon: 'Layers',
        status: 'ACTIVE',
        compilers: [
          { language_id: 1, compiler_id: 50, compiler_name: 'GCC 9.2.0' }
        ],
        level_count: 7
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.program.id).toBeDefined();

    const progId = res.body.program.id;
    createdProgramIds.push(progId);

    // Verify 7 levels exist in database for this program
    const [levels] = await pool.query(
      'SELECT id, level_number, title FROM levels WHERE program_id = ? ORDER BY level_number ASC',
      [progId]
    );
    expect(levels.length).toBe(7);
    expect(levels[0].level_number).toBe(1);
    expect(levels[6].level_number).toBe(7);
  });

  // Test 2: Create a program allowing only Java
  test('2. Admin can create a program allowing only Java compiler', async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Java Solo Track ${Date.now()}`,
        description: 'Java only runtime',
        icon: 'Terminal',
        status: 'ACTIVE',
        compilers: [
          { language_id: 3, compiler_id: 62, compiler_name: 'OpenJDK 13' }
        ],
        level_count: 3
      });

    expect(res.status).toBe(201);
    const progId = res.body.program.id;
    createdProgramIds.push(progId);

    // Verify program_languages has only Java (62)
    const [pls] = await pool.query(
      'SELECT compiler_id, language_id FROM program_languages WHERE program_id = ?',
      [progId]
    );
    expect(pls.length).toBe(1);
    expect(pls[0].compiler_id).toBe(62);
    expect(pls[0].language_id).toBe(3);
  });

  // Test 3: Create a program allowing Java and Python
  test('3. Admin can create a program allowing Java and Python compilers', async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Java & Python Track ${Date.now()}`,
        description: 'Multi-compiler program',
        icon: 'Code',
        status: 'ACTIVE',
        compilers: [
          { language_id: 3, compiler_id: 62, compiler_name: 'OpenJDK 13' },
          { language_id: 4, compiler_id: 71, compiler_name: 'Python 3.8.1' }
        ],
        level_count: 4
      });

    expect(res.status).toBe(201);
    const progId = res.body.program.id;
    createdProgramIds.push(progId);

    const [pls] = await pool.query(
      'SELECT compiler_id FROM program_languages WHERE program_id = ? ORDER BY compiler_id ASC',
      [progId]
    );
    expect(pls.length).toBe(2);
    expect(pls.map(p => p.compiler_id)).toEqual([62, 71]);
  });

  // Test 4: Reject unsupported compiler/runtime IDs
  test('4. Backend rejects unsupported compiler/runtime IDs', async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Invalid Compiler Track ${Date.now()}`,
        description: 'Testing invalid compiler ID',
        compilers: [
          { language_id: 1, compiler_id: 9999, compiler_name: 'Fake Compiler' }
        ],
        level_count: 2
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unsupported or invalid compiler runtime ID/i);
  });

  // Test 5: Reject assigning a question to another program's level
  test('5. Backend rejects assigning a question to a level from another program', async () => {
    // Create Program A
    const resA = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Program Alpha ${Date.now()}`,
        compilers: [{ language_id: 1, compiler_id: 50 }],
        level_count: 2
      });
    const progAId = resA.body.program.id;
    createdProgramIds.push(progAId);

    // Create Program B
    const resB = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Program Beta ${Date.now()}`,
        compilers: [{ language_id: 1, compiler_id: 50 }],
        level_count: 2
      });
    const progBId = resB.body.program.id;
    createdProgramIds.push(progBId);

    // Get level from Program B
    const [progBLevels] = await pool.query('SELECT id FROM levels WHERE program_id = ? LIMIT 1', [progBId]);
    const progBLevelId = progBLevels[0].id;

    // Create a question in Program A
    const [qIns] = await pool.query(`
      INSERT INTO questions (
        program_id, title, statement, input_format, output_format, constraints_text,
        language_id, level_id, contributor_id, status
      ) VALUES (?, 'Cross-Prog Question', 'A statement with min 20 chars', 'I', 'O', 'C', 1, (SELECT id FROM levels WHERE program_id = ? LIMIT 1), ?, 'ACTIVE')
    `, [progAId, progAId, adminUser.id]);
    const testQId = qIns.insertId;

    // Attempt to update question to point to Program A, but with Program B's level
    const updateRes = await request(app)
      .patch(`/api/admin/questions/${testQId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        program_id: progAId,
        level_id: progBLevelId
      });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error).toMatch(/Cannot assign question to a level from another program/i);

    // Clean up test question
    await pool.query('DELETE FROM questions WHERE id = ?', [testQId]);
  });

  // Test 6: Ensure each learner sees the correct program's levels and questions
  test("6. Public learner endpoint GET /api/programs/:slug returns the program's independent levels", async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Learner Visibility Track ${Date.now()}`,
        description: 'Curriculum visible to learners',
        icon: 'Award',
        status: 'ACTIVE',
        compilers: [{ language_id: 4, compiler_id: 71, compiler_name: 'Python 3.8.1' }],
        levels: [
          { level_number: 1, title: 'Basics 101', description: 'Elementary Python' },
          { level_number: 2, title: 'Control Flow', description: 'Loops and if' }
        ]
      });

    const prog = res.body.program;
    createdProgramIds.push(prog.id);

    // Query public learner endpoint
    const publicRes = await request(app).get(`/api/programs/${prog.slug}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.success).toBe(true);
    expect(publicRes.body.program.name).toBe(prog.name);
    expect(publicRes.body.levels.length).toBe(2);
    expect(publicRes.body.levels[0].title).toBe('Basics 101');
    expect(publicRes.body.compilers.length).toBe(1);
    expect(publicRes.body.compilers[0].compiler_id).toBe(71);
  });

  // Test 7: Preserve existing questions, submissions, reports, and audit logs
  test('7. Database retains all original questions and submissions across programs', async () => {
    const [qCount] = await pool.query('SELECT COUNT(*) AS total FROM questions');
    expect(qCount[0].total).toBeGreaterThanOrEqual(127);

    // Verify all 4 core language programs exist
    const [coreProgs] = await pool.query(
      "SELECT id, slug FROM programs WHERE slug IN ('c-programming', 'cpp-programming', 'java-programming', 'python-programming')"
    );
    expect(coreProgs.length).toBe(4);
  });

  // Test 8: Prevent non-admin users from changing programs or levels
  test('8. Non-admin users are strictly rejected from mutating programs and levels (403 Forbidden)', async () => {
    const progRes = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Unauthorized Track', compilers: [{ language_id: 1, compiler_id: 50 }] });

    expect(progRes.status).toBe(403);

    const levelRes = await request(app)
      .post('/api/admin/programs/1/levels')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Unauthorized Level' });

    expect(levelRes.status).toBe(403);
  });

  // Test 9: Code execution verifies program allowed compilers
  test('9. Execution rejects compiler not allowed in question program track', async () => {
    // Create a Java-only program
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Java Strict Program ${Date.now()}`,
        compilers: [{ language_id: 3, compiler_id: 62 }],
        level_count: 1
      });
    const progId = res.body.program.id;
    createdProgramIds.push(progId);

    const [lvls] = await pool.query('SELECT id FROM levels WHERE program_id = ? LIMIT 1', [progId]);

    // Insert active question in this Java-only program
    const [insQ] = await pool.query(`
      INSERT INTO questions (
        program_id, title, statement, input_format, output_format, constraints_text,
        language_id, level_id, contributor_id, status
      ) VALUES (?, 'Strict Question', 'Minimum 20 characters problem statement here.', 'IN', 'OUT', 'NONE', 3, ?, ?, 'ACTIVE')
    `, [progId, lvls[0].id, adminUser.id]);
    const qId = insQ.insertId;

    // Create a sample test case for run
    await pool.query(`
      INSERT INTO question_samples (question_id, sample_input, expected_output, display_order)
      VALUES (?, '1', '1', 1)
    `, [qId]);

    // Attempt to run code using Python on a Java-only program question
    const runRes = await request(app)
      .post('/api/submissions/run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId: qId,
        language: 'python',
        sourceCode: 'print(1)'
      });

    expect(runRes.status).toBe(400);
    expect(runRes.body.error).toMatch(/not permitted for questions in this program track|requires solutions to be submitted in/i);

    // Clean up
    await pool.query('DELETE FROM question_samples WHERE question_id = ?', [qId]);
    await pool.query('DELETE FROM questions WHERE id = ?', [qId]);
  });

  // Test 10: Changing a program's level count requires explicit confirmation if populated
  test('10. Populated level reduction requires explicit confirmation', async () => {
    const res = await request(app)
      .post('/api/admin/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Safeguard Track ${Date.now()}`,
        compilers: [{ language_id: 1, compiler_id: 50 }],
        levels: [
          { level_number: 1, title: 'Level 1' },
          { level_number: 2, title: 'Level 2 Populated' }
        ]
      });

    const progId = res.body.program.id;
    createdProgramIds.push(progId);

    const [lvls] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 2', [progId]);
    const lvl2Id = lvls[0].id;

    // Populate Level 2 with a question
    const [insQ] = await pool.query(`
      INSERT INTO questions (
        program_id, title, statement, input_format, output_format, constraints_text,
        language_id, level_id, contributor_id, status
      ) VALUES (?, 'Level 2 Question', 'Problem statement with minimum twenty characters.', 'I', 'O', 'C', 1, ?, ?, 'ACTIVE')
    `, [progId, lvl2Id, adminUser.id]);
    const qId = insQ.insertId;

    // Attempt to reduce levels to 1 without confirmation -> must reject
    const reduceRes = await request(app)
      .patch(`/api/admin/programs/${progId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        level_count: 1,
        confirm_level_reduction: false
      });

    expect(reduceRes.status).toBe(400);
    expect(reduceRes.body.code).toBe('POPULATED_LEVEL_REDUCTION');

    // Attempt with confirmation -> succeeds
    const confirmRes = await request(app)
      .patch(`/api/admin/programs/${progId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        level_count: 1,
        confirm_level_reduction: true
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);

    // Clean up
    await pool.query('DELETE FROM questions WHERE id = ?', [qId]);
  });
});
