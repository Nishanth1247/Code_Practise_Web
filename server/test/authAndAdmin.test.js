const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');

jest.mock('../src/config/db');

describe('Authentication, Authorization & API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createTestToken = (user) => {
    return jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  };

  test('Normal USER cannot access admin endpoints (403 Forbidden)', async () => {
    const normalUser = { id: 5, username: 'testuser', email: 'test@user.dev', role: 'USER' };
    const token = createTestToken(normalUser);

    db.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE id = ?')) {
        return [normalUser];
      }
      return [];
    });

    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Administrator privileges required');
  });

  test('Unauthenticated user cannot access admin endpoints (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Public question details API NEVER exposes hidden test cases', async () => {
    const mockQuestion = {
      id: 1,
      title: 'Sum of Two Numbers',
      statement: 'Add A and B',
      input_format: 'Two integers',
      output_format: 'One integer',
      constraints_text: '1 <= A, B <= 100',
      explanation: 'Simple sum',
      language_id: 1,
      language_name: 'C',
      language_slug: 'c',
      level_id: 1,
      level_number: 1,
      level_title: 'Fundamentals',
      contributor_id: 99,
      contributor_username: 'curator',
      status: 'ACTIVE',
      useful_votes_count: 5
    };

    const mockSamples = [
      { id: 1, sample_input: '1 2\n', expected_output: '3\n', explanation: '1+2=3', display_order: 1 }
    ];

    db.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM questions q')) {
        return [mockQuestion];
      }
      if (sql.includes('FROM question_samples')) {
        return mockSamples;
      }
      if (sql.includes('FROM starter_code_templates')) {
        return [];
      }
      return [];
    });

    const res = await request(app).get('/api/questions/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.question).toBeDefined();

    // Verify samples ARE present
    expect(res.body.question.samples).toBeDefined();
    expect(res.body.question.samples.length).toBe(1);

    // CRITICAL SECURITY CHECK: Hidden test cases MUST NOT be present in public response!
    expect(res.body.question.testCases).toBeUndefined();
    expect(res.body.question.test_cases).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('question_test_cases');
  });

  test('Invalid question contribution is rejected by validator with 400', async () => {
    const normalUser = { id: 5, username: 'testuser', email: 'test@user.dev', role: 'USER' };
    const token = createTestToken(normalUser);

    db.query.mockImplementation((sql) => {
      if (sql.includes('SELECT id, username, email, role, created_at FROM users WHERE id = ?')) {
        return [[normalUser]];
      }
      return [[]];
    });

    // Send invalid payload (missing statement, empty samples)
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Too Short'
        // Missing required statement, samples, test_cases, language_id, level_id
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
  });
});
