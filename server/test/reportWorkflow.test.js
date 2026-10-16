const reportService = require('../src/services/reportService');
const adminService = require('../src/services/adminService');
const db = require('../src/config/db');

// Mock db module for isolated unit testing
jest.mock('../src/config/db');

describe('Reporting and Replacement Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Report rejected when detailed feedback is missing or under 20 characters', async () => {
    await expect(
      reportService.submitQuestionReport({
        questionId: 10,
        userId: 1,
        reason: 'Incorrect expected output',
        details: '' // Missing
      })
    ).rejects.toThrow('Detailed feedback explanation must be at least 20 characters.');

    await expect(
      reportService.submitQuestionReport({
        questionId: 10,
        userId: 1,
        reason: 'Incorrect expected output',
        details: 'Too short' // 9 characters
      })
    ).rejects.toThrow('Detailed feedback explanation must be at least 20 characters.');
  });

  test('Report rejected when issue category is not in allowed list', async () => {
    await expect(
      reportService.submitQuestionReport({
        questionId: 10,
        userId: 1,
        reason: 'Invalid Random Category',
        details: 'This is a long enough explanation of the problem, well over twenty chars.'
      })
    ).rejects.toThrow('Please select a valid report issue category.');
  });

  test('User cannot report their own question', async () => {
    const mockConn = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql.includes('SELECT id, title, language_id, level_id, contributor_id, status FROM questions')) {
          // Question contributed by user 42
          return [[{ id: 10, title: 'Sample Q', language_id: 1, level_id: 2, contributor_id: 42, status: 'ACTIVE' }]];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    await expect(
      reportService.submitQuestionReport({
        questionId: 10,
        userId: 42, // same user as contributor
        reason: 'Incorrect expected output',
        details: 'The test case expected output differs significantly from standard math rules.'
      })
    ).rejects.toThrow('You cannot report a question that you contributed.');
  });

  test('Duplicate reports from the same user are rejected', async () => {
    const mockConn = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql.includes('SELECT id, title, language_id, level_id, contributor_id, status FROM questions')) {
          return [[{ id: 10, title: 'Sample Q', language_id: 1, level_id: 2, contributor_id: 99, status: 'ACTIVE' }]];
        }
        if (sql.includes('SELECT id FROM question_reports WHERE question_id = ? AND reporter_id = ?')) {
          // Report already exists
          return [[{ id: 1 }]];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    await expect(
      reportService.submitQuestionReport({
        questionId: 10,
        userId: 1,
        reason: 'Ambiguous problem statement',
        details: 'The description contradicts the sample output provided in the second test case.'
      })
    ).rejects.toThrow('You have already submitted a report for this question.');
  });

  test('First report keeps question ACTIVE and returns immediate replacement in same level', async () => {
    let updateCalled = false;
    const mockConn = {
      query: jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, title, language_id, level_id, contributor_id, status FROM questions')) {
          return [[{ id: 10, title: 'Question A', language_id: 1, level_id: 2, contributor_id: 99, status: 'ACTIVE' }]];
        }
        if (sql.includes('SELECT id FROM question_reports WHERE question_id = ? AND reporter_id = ?')) {
          return [[]]; // No prior report
        }
        if (sql.includes('INSERT INTO question_reports')) {
          return [{ insertId: 1 }];
        }
        if (sql.includes('SELECT COUNT(DISTINCT reporter_id) AS distinct_count')) {
          return [[{ distinct_count: 1 }]]; // 1st report
        }
        if (sql.includes('UPDATE questions SET status')) {
          updateCalled = true;
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('SELECT q.id, q.title')) {
          // Return replacement question in same language & level
          return [[{ id: 15, title: 'Question B (Replacement)' }]];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    const result = await reportService.submitQuestionReport({
      questionId: 10,
      userId: 1,
      reason: 'Incorrect expected output',
      details: 'Test case 3 expects 42 but according to specification it should be 43.'
    });

    expect(result.success).toBe(true);
    expect(result.distinctReportCount).toBe(1);
    expect(result.transitionedToPending).toBe(false);
    expect(result.currentQuestionStatus).toBe('ACTIVE');
    expect(updateCalled).toBe(false); // Should NOT transition to PENDING_REVIEW yet
    expect(result.replacementQuestion).toBeDefined();
    expect(result.replacementQuestion.id).toBe(15);
  });

  test('Fourth distinct report atomically transitions question to PENDING_REVIEW and logs audit', async () => {
    let updateToPendingCalled = false;
    let auditLogCalled = false;

    const mockConn = {
      query: jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, title, language_id, level_id, contributor_id, status FROM questions')) {
          return [[{ id: 10, title: 'Question A', language_id: 1, level_id: 2, contributor_id: 99, status: 'ACTIVE' }]];
        }
        if (sql.includes('SELECT id FROM question_reports WHERE question_id = ? AND reporter_id = ?')) {
          return [[]];
        }
        if (sql.includes('INSERT INTO question_reports')) {
          return [{ insertId: 4 }];
        }
        if (sql.includes('SELECT COUNT(DISTINCT reporter_id) AS distinct_count')) {
          return [[{ distinct_count: 4 }]]; // Threshold of 4 reached!
        }
        if (sql.includes('UPDATE questions SET status = ? WHERE id = ?')) {
          updateToPendingCalled = true;
          expect(params[0]).toBe('PENDING_REVIEW');
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('INSERT INTO question_audit_logs')) {
          auditLogCalled = true;
          expect(params[2]).toBe('PENDING_REVIEW');
          return [{ insertId: 1 }];
        }
        if (sql.includes('SELECT q.id, q.title')) {
          return [[{ id: 16, title: 'Question C' }]];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    const result = await reportService.submitQuestionReport({
      questionId: 10,
      userId: 4,
      reason: 'Incorrect or incomplete test cases',
      details: 'Fails on hidden edge cases when integer overflow is not accounted for.'
    });

    expect(result.success).toBe(true);
    expect(result.distinctReportCount).toBe(4);
    expect(result.transitionedToPending).toBe(true);
    expect(result.currentQuestionStatus).toBe('PENDING_REVIEW');
    expect(updateToPendingCalled).toBe(true);
    expect(auditLogCalled).toBe(true);
  });

  test('When no alternative question is available in the level, returns graceful fallback', async () => {
    const mockConn = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql.includes('SELECT id, title, language_id, level_id, contributor_id, status FROM questions')) {
          return [[{ id: 10, title: 'Only Question', language_id: 1, level_id: 2, contributor_id: 99, status: 'ACTIVE' }]];
        }
        if (sql.includes('SELECT id FROM question_reports WHERE question_id = ? AND reporter_id = ?')) {
          return [[]];
        }
        if (sql.includes('INSERT INTO question_reports')) {
          return [{ insertId: 1 }];
        }
        if (sql.includes('SELECT COUNT(DISTINCT reporter_id) AS distinct_count')) {
          return [[{ distinct_count: 1 }]];
        }
        if (sql.includes('SELECT q.id, q.title')) {
          return [[]]; // No replacement available
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    const result = await reportService.submitQuestionReport({
      questionId: 10,
      userId: 2,
      reason: 'Missing constraints or edge cases',
      details: 'The problem statement neglects to specify constraints on negative numbers.'
    });

    expect(result.success).toBe(true);
    expect(result.replacementQuestion).toBeNull();
    expect(result.noReplacementAvailable).toBe(true);
    expect(result.fallbackMessage).toContain('No additional practice questions');
  });

  test('Admin can soft-delete question via deleteQuestionAdmin, transitioning status to REMOVED', async () => {
    let updateStatus = null;
    let loggedAudit = false;

    const mockConn = {
      query: jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, title, status FROM questions WHERE id = ?')) {
          return [[{ id: 88, title: 'Flawed Question', status: 'ACTIVE' }]];
        }
        if (sql.includes('UPDATE questions SET status = ? WHERE id = ?')) {
          updateStatus = params[0];
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('INSERT INTO question_audit_logs')) {
          loggedAudit = true;
          return [{ insertId: 1 }];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((callback) => callback(mockConn));

    const result = await adminService.deleteQuestionAdmin({
      questionId: 88,
      adminId: 1,
      reason: 'Inaccurate constraints confirmed'
    });
    expect(result.success).toBe(true);
    expect(result.questionId).toBe(88);
    expect(result.status).toBe('REMOVED');
    expect(updateStatus).toBe('REMOVED');
    expect(loggedAudit).toBe(true);
  });
});
