const adminService = require('../src/services/adminService');
const db = require('../src/config/db');

jest.mock('../src/config/db');

describe('Admin Moderation Actions and Audit Trail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can remove a question (status -> REMOVED) and logs audit entry', async () => {
    let updateSql = '';
    let auditSql = '';

    const mockConn = {
      query: jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, status FROM questions WHERE id = ? FOR UPDATE')) {
          return [[{ id: 25, status: 'PENDING_REVIEW' }]];
        }
        if (sql.includes('UPDATE questions SET status = ? WHERE id = ?')) {
          updateSql = sql;
          expect(params[0]).toBe('REMOVED');
          expect(params[1]).toBe(25);
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('INSERT INTO question_audit_logs')) {
          auditSql = sql;
          expect(params[0]).toBe(25); // questionId
          expect(params[1]).toBe(1);  // adminId
          expect(params[2]).toBe('PENDING_REVIEW'); // prev
          expect(params[3]).toBe('REMOVED');        // new
          return [{ insertId: 10 }];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((cb) => cb(mockConn));

    const result = await adminService.removeQuestion({
      questionId: 25,
      adminId: 1,
      reason: 'Violates quality guidelines'
    });

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe('PENDING_REVIEW');
    expect(result.newStatus).toBe('REMOVED');
    expect(updateSql).toContain('UPDATE questions SET status = ?');
    expect(auditSql).toContain('INSERT INTO question_audit_logs');
  });

  test('Admin can restore a question (status -> ACTIVE), clears active reports, and logs audit', async () => {
    let deleteReportsCalled = false;
    let restoreStatusCalled = false;

    const mockConn = {
      query: jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, status FROM questions WHERE id = ? FOR UPDATE')) {
          return [[{ id: 25, status: 'PENDING_REVIEW' }]];
        }
        if (sql.includes('UPDATE questions SET status = ? WHERE id = ?')) {
          restoreStatusCalled = true;
          expect(params[0]).toBe('ACTIVE');
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('DELETE FROM question_reports WHERE question_id = ?')) {
          deleteReportsCalled = true;
          expect(params[0]).toBe(25);
          return [{ affectedRows: 4 }];
        }
        if (sql.includes('INSERT INTO question_audit_logs')) {
          return [{ insertId: 11 }];
        }
        return [[]];
      })
    };

    db.withTransaction.mockImplementation((cb) => cb(mockConn));

    const result = await adminService.restoreQuestion({
      questionId: 25,
      adminId: 1,
      reason: 'Issue investigated and statement corrected'
    });

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('ACTIVE');
    expect(restoreStatusCalled).toBe(true);
    expect(deleteReportsCalled).toBe(true);
  });
});
