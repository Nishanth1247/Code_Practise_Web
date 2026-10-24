const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('CodeCraft — Admin Practice Courses, Compilers, Levels & Contributed Questions', () => {
  let pool;
  let adminUser;
  let standardUser;
  let adminToken;
  let userToken;

  let createdCourseIds = [];
  let createdQuestionIds = [];

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
    // Cleanup any test questions and courses created during test runs
    for (const qId of createdQuestionIds) {
      await pool.query('DELETE FROM question_languages WHERE question_id = ?', [qId]).catch(() => {});
      await pool.query('DELETE FROM question_samples WHERE question_id = ?', [qId]).catch(() => {});
      await pool.query('DELETE FROM test_cases WHERE question_id = ?', [qId]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE id = ?', [qId]).catch(() => {});
    }

    for (const cId of createdCourseIds) {
      await pool.query('DELETE FROM question_languages WHERE question_id IN (SELECT id FROM questions WHERE program_id = ?)', [cId]).catch(() => {});
      await pool.query('DELETE FROM question_samples WHERE question_id IN (SELECT id FROM questions WHERE program_id = ?)', [cId]).catch(() => {});
      await pool.query('DELETE FROM test_cases WHERE question_id IN (SELECT id FROM questions WHERE program_id = ?)', [cId]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE program_id = ?', [cId]).catch(() => {});
      await pool.query('DELETE FROM program_languages WHERE program_id = ?', [cId]).catch(() => {});
      await pool.query('DELETE FROM levels WHERE program_id = ?', [cId]).catch(() => {});
      await pool.query('DELETE FROM programs WHERE id = ?', [cId]).catch(() => {});
    }
  });

  // Test 1: Admin creates course "Sliding Window" selecting C++, Java, and Python with 5 levels
  test('1. Admin can create course "Sliding Window" selecting C++, Java, and Python with 5 levels', async () => {
    const courseName = `Sliding Window ${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: courseName,
        description: 'Advanced sliding window problems in C++, Java, and Python',
        icon: 'GitBranch',
        course_type: 'CODING',
        status: 'ACTIVE',
        compilers: [
          { language_id: 2, compiler_id: 54, compiler_name: 'GCC 9.2.0' }, // C++
          { language_id: 3, compiler_id: 62, compiler_name: 'OpenJDK 13' }, // Java
          { language_id: 4, compiler_id: 71, compiler_name: 'Python 3.8.1' } // Python
        ],
        level_count: 5
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.course).toBeDefined();
    expect(res.body.course.name).toBe(courseName);

    const courseId = res.body.course.id;
    createdCourseIds.push(courseId);

    // Verify database junction rows
    const [compilers] = await pool.query('SELECT * FROM program_languages WHERE program_id = ?', [courseId]);
    expect(compilers).toHaveLength(3);
    const langIds = compilers.map(c => c.language_id);
    expect(langIds).toContain(2); // C++
    expect(langIds).toContain(3); // Java
    expect(langIds).toContain(4); // Python
    expect(langIds).not.toContain(1); // C must not be included

    // Verify 5 levels created
    const [levels] = await pool.query('SELECT * FROM levels WHERE program_id = ? ORDER BY level_number ASC', [courseId]);
    expect(levels).toHaveLength(5);
  });

  // Test 2: Admin can create a Theory course with 0 compilers
  test('2. Admin can create a Theory course with 0 compilers', async () => {
    const courseName = `System Architecture Theory ${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: courseName,
        description: 'Conceptual architecture and design patterns',
        icon: 'BookOpen',
        course_type: 'THEORY',
        status: 'ACTIVE',
        compilers: [],
        level_count: 3
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.course.course_type).toBe('THEORY');

    const courseId = res.body.course.id;
    createdCourseIds.push(courseId);

    // Verify 0 compilers in database
    const [compilers] = await pool.query('SELECT * FROM program_languages WHERE program_id = ?', [courseId]);
    expect(compilers).toHaveLength(0);
  });

  // Test 3: Backend rejects creating a coding course without any compiler
  test('3. Backend rejects creating a coding course without any compiler', async () => {
    const res = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Invalid Coding Course ${Date.now()}`,
        description: 'Should fail because compilers array is empty',
        course_type: 'CODING',
        status: 'ACTIVE',
        compilers: [],
        level_count: 3
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/compiler/i);
  });

  // Test 4: Learner endpoint GET /api/courses/:slug returns course with exactly C++, Java, Python
  test('4. Learner endpoint GET /api/courses/:slug returns course with allowed compilers', async () => {
    const targetCourseId = createdCourseIds[0];
    const [cRows] = await pool.query('SELECT slug FROM programs WHERE id = ?', [targetCourseId]);
    const slug = cRows[0].slug;

    const res = await request(app)
      .get(`/api/courses/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.course).toBeDefined();
    expect(res.body.course.compilers).toHaveLength(3);

    const compilerLangSlugs = res.body.course.compilers.map(c => c.language_slug || c.languageSlug);
    expect(compilerLangSlugs).toContain('cpp');
    expect(compilerLangSlugs).toContain('java');
    expect(compilerLangSlugs).toContain('python');
    expect(compilerLangSlugs).not.toContain('c');
  });

  // Test 5: User can contribute a question to Sliding Window at Level 1 with C++
  test('5. User can contribute a question to Sliding Window at Level 1 with an allowed compiler', async () => {
    const targetCourseId = createdCourseIds[0];
    const [levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 1', [targetCourseId]);
    const level1Id = levels[0].id;

    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Maximum Sum Subarray ${Date.now()}`,
        statement: 'Find the maximum sum of any contiguous subarray of size k.',
        course_id: targetCourseId,
        level_id: level1Id,
        language_id: 2, // C++
        compiler_id: 54, // C++ GCC 9.2.0
        input_format: 'An array of N integers followed by k',
        output_format: 'Single integer max sum',
        constraints_text: '1 <= k <= N <= 10^5',
        samples: [
          { sample_input: '5 3\n2 1 5 1 3', expected_output: '9', explanation: 'Subarray [5, 1, 3] gives sum 9' }
        ],
        test_cases: [
          { test_input: '5 3\n2 1 5 1 3', expected_output: '9', is_hidden: true },
          { test_input: '4 2\n2 3 4 1', expected_output: '7', is_hidden: true }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.questionId).toBeDefined();

    createdQuestionIds.push(res.body.questionId);
  });

  // Test 6: Backend rejects contributing question to a level belonging to another course
  test('6. Backend rejects contributing question to a level belonging to another course', async () => {
    const course1Id = createdCourseIds[0];
    const course2Id = createdCourseIds[1];

    // Grab Level from Course 2
    const [c2Levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? LIMIT 1', [course2Id]);
    const levelFromCourse2 = c2Levels[0].id;

    // Try contributing to Course 1 with Course 2's level
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Invalid Cross Course Question ${Date.now()}`,
        statement: 'This should be rejected due to course mismatch',
        course_id: course1Id,
        level_id: levelFromCourse2,
        language_id: 2,
        compiler_id: 54,
        input_format: 'N/A',
        output_format: 'N/A',
        constraints_text: 'N/A',
        samples: [{ sample_input: '1', expected_output: '1' }],
        test_cases: [{ test_input: '1', expected_output: '1', is_hidden: true }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/another course/i);
  });

  // Test 7: Backend rejects contributing question with a compiler not permitted by the course
  test('7. Backend rejects contributing question with unpermitted compiler (e.g. C to Sliding Window)', async () => {
    const targetCourseId = createdCourseIds[0];
    const [levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 1', [targetCourseId]);
    const level1Id = levels[0].id;

    // Language 1 (C) is NOT permitted in Sliding Window (only C++, Java, Python)
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Invalid C in Sliding Window ${Date.now()}`,
        statement: 'This question attempts to use C which is not in the course compilers.',
        course_id: targetCourseId,
        level_id: level1Id,
        language_id: 1, // C
        compiler_id: 50,
        input_format: 'N/A',
        output_format: 'N/A',
        constraints_text: 'N/A',
        samples: [{ sample_input: '1', expected_output: '1' }],
        test_cases: [{ test_input: '1', expected_output: '1', is_hidden: true }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not permitted for this course/i);
  });

  // Test 8: Code execution on Sliding Window question strictly rejects C runtime with 400
  test('8. Code execution on Sliding Window question strictly rejects unallowed runtime (C)', async () => {
    const questionId = createdQuestionIds[0];

    const res = await request(app)
      .post('/api/submissions/run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId: questionId,
        language: 'c',
        sourceCode: '#include <stdio.h>\nint main() { return 0; }'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not permitted for questions in this/i);
  });

  // Test 9: Code execution on Theory question is rejected with 400
  test('9. Code execution on Theory question is rejected with 400', async () => {
    const theoryCourseId = createdCourseIds[1];
    const [levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? LIMIT 1', [theoryCourseId]);
    const theoryLevelId = levels[0].id;

    // Create a question in Theory Course
    const qRes = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Theory Concept Question ${Date.now()}`,
        statement: 'Explain the difference between microservices and monoliths in distributed systems.',
        course_id: theoryCourseId,
        level_id: theoryLevelId,
        input_format: 'N/A',
        output_format: 'N/A',
        constraints_text: 'N/A'
      });

    expect(qRes.status).toBe(201);
    const theoryQuestionId = qRes.body.questionId;
    createdQuestionIds.push(theoryQuestionId);

    // Attempt to run code on theory question
    const execRes = await request(app)
      .post('/api/submissions/run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId: theoryQuestionId,
        language: 'cpp',
        sourceCode: '#include <iostream>\nint main() { return 0; }'
      });

    expect(execRes.status).toBe(400);
    expect(execRes.body.success).toBe(false);
    expect(execRes.body.error).toMatch(/theory course/i);
  });

  // Test 10: Populated level reduction requires confirm_level_reduction = true
  test('10. Populated level reduction requires confirm_level_reduction = true', async () => {
    const courseId = createdCourseIds[0];

    // Attempt reducing to 0 or 1 level while level 1 has a question
    const res = await request(app)
      .patch(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sliding Window Level Reduction',
        level_count: 1, // Truncates levels 2-5
        confirm_level_reduction: false
      });

    // If level 2-5 were empty, it would succeed; let's add a question to Level 5 to trigger warning
    const [l5] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 5', [courseId]);
    if (l5 && l5.length > 0) {
      const q5Res = await pool.query(`
        INSERT INTO questions (program_id, title, statement, input_format, output_format, constraints_text, level_id, contributor_id, status)
        VALUES (?, 'L5 Question', 'Testing level 5 reduction warning', 'N/A', 'N/A', 'N/A', ?, ?, 'ACTIVE')
      `, [courseId, l5[0].id, standardUser.id]);
      createdQuestionIds.push(q5Res[0].insertId);

      // Now attempt truncating to 4 levels
      const rejectRes = await request(app)
        .patch(`/api/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sliding Window Level Reduction',
          level_count: 4,
          confirm_level_reduction: false
        });

      expect(rejectRes.status).toBe(409);
      expect(rejectRes.body.code).toBe('POPULATED_LEVEL_REDUCTION');

      // Now retry with confirm_level_reduction = true
      const confirmRes = await request(app)
        .patch(`/api/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sliding Window Level Reduction Confirmed',
          level_count: 4,
          confirm_level_reduction: true
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
    }
  });

  // Test 11: Contributor can create question with multiple allowed languages (C++ & Python)
  test('11. Contributor can submit question supporting multiple languages (C++ & Python)', async () => {
    const courseId = createdCourseIds[0];
    const [levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 1', [courseId]);
    const level1Id = levels[0].id;

    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Multi-Language Sliding Window Problem ${Date.now()}`,
        statement: 'Find longest substring without repeating characters.',
        course_id: courseId,
        level_id: level1Id,
        language_ids: [2, 4], // C++ (2) and Python (4)
        input_format: 'String s',
        output_format: 'Integer length',
        constraints_text: '0 <= s.length <= 5 * 10^4',
        samples: [{ sample_input: 'abcabcbb', expected_output: '3' }],
        test_cases: [{ test_input: 'bbbbb', expected_output: '1', is_hidden: true }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const newQId = res.body.questionId;
    createdQuestionIds.push(newQId);

    // Verify question_languages has both mappings
    const [qlRows] = await pool.query('SELECT language_id FROM question_languages WHERE question_id = ? ORDER BY language_id ASC', [newQId]);
    expect(qlRows.map(r => r.language_id)).toEqual([2, 4]);

    // Verify GET /api/questions/:id returns languages and filtered allowedCompilers
    const getRes = await request(app).get(`/api/questions/${newQId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.question.languageIds).toEqual([2, 4]);
    const compilerSlugs = getRes.body.question.allowedCompilers.map(c => c.languageSlug);
    expect(compilerSlugs).toContain('cpp');
    expect(compilerSlugs).toContain('python');
    expect(compilerSlugs).not.toContain('java'); // Java was not selected for this question
  });

  // Test 12: Question contribution with unpermitted language in language_ids is rejected
  test('12. Question contribution is rejected if any selected language is not allowed in course', async () => {
    const courseId = createdCourseIds[0];
    const [levels] = await pool.query('SELECT id FROM levels WHERE program_id = ? AND level_number = 1', [courseId]);
    const level1Id = levels[0].id;

    // Language 1 (C) is NOT allowed in courseId (only 2, 3, 4 are allowed)
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Invalid Multi-Language Question ${Date.now()}`,
        statement: 'Attempts to use C along with C++',
        course_id: courseId,
        level_id: level1Id,
        language_ids: [1, 2], // 1 is invalid
        input_format: 'N/A',
        output_format: 'N/A',
        constraints_text: 'N/A',
        samples: [{ sample_input: '1', expected_output: '1' }],
        test_cases: [{ test_input: '1', expected_output: '1', is_hidden: true }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not permitted for this course/i);
  });

  // Test 13: Submissions check enforces question-level language restriction
  test('13. Submissions enforce question-level language restrictions', async () => {
    // The question created in Test 11 only permits C++ (2) and Python (4)
    const multiLangQId = createdQuestionIds[createdQuestionIds.length - 1];

    // Running with Java (which is in the course but NOT enabled for this question) should be rejected
    const javaRes = await request(app)
      .post('/api/submissions/run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId: multiLangQId,
        language: 'java',
        sourceCode: 'public class Main { public static void main(String[] args) {} }'
      });

    expect(javaRes.status).toBe(400);
    expect(javaRes.body.success).toBe(false);
    expect(javaRes.body.error).toMatch(/not permitted/i);
  });

  // Test 14: Admin can manage course levels dynamically (list, add, edit, reorder, delete)
  test('14. Admin can manage course levels dynamically (list, add, edit, reorder, delete)', async () => {
    const courseId = createdCourseIds[0];

    // 1. List levels for course
    const listRes = await request(app)
      .get(`/api/admin/courses/${courseId}/levels`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.levels)).toBe(true);
    const initialCount = listRes.body.levels.length;

    // 2. Create new level
    const addRes = await request(app)
      .post(`/api/admin/courses/${courseId}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Dynamic Test Level',
        description: 'Testing dynamic level creation by admin',
        enabled: true
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.success).toBe(true);
    const createdLevelId = addRes.body.level.id;
    const createdLevelNum = addRes.body.level.levelNumber;

    // 3. Edit the level
    const editRes = await request(app)
      .patch(`/api/admin/courses/${courseId}/levels/${createdLevelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Dynamic Level Title',
        description: 'Updated description'
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.success).toBe(true);

    // 4. Reorder levels
    const reorderRes = await request(app)
      .put(`/api/admin/courses/${courseId}/levels/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        levels: [
          { id: createdLevelId, levelNumber: 10 }
        ]
      });

    expect(reorderRes.status).toBe(200);
    expect(reorderRes.body.success).toBe(true);

    // 5. Delete the newly created empty level
    const deleteRes = await request(app)
      .delete(`/api/admin/courses/${courseId}/levels/${createdLevelId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
