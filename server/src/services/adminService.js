const db = require('../config/db');

/**
 * Fetch high-level platform statistics for Admin Dashboard
 */
async function getAdminOverview() {
  const usersCount = await db.query('SELECT COUNT(*) AS total FROM users');
  const questionsCount = await db.query('SELECT COUNT(*) AS total FROM questions');
  const activeQuestions = await db.query("SELECT COUNT(*) AS total FROM questions WHERE status = 'ACTIVE'");
  const pendingReview = await db.query("SELECT COUNT(*) AS total FROM questions WHERE status = 'PENDING_REVIEW'");
  const removedQuestions = await db.query("SELECT COUNT(*) AS total FROM questions WHERE status = 'REMOVED'");
  const submissionsCount = await db.query('SELECT COUNT(*) AS total FROM submissions');
  const acceptedCount = await db.query("SELECT COUNT(*) AS total FROM submissions WHERE verdict = 'Accepted'");

  // Recent reports with question and reporter details
  const recentReports = await db.query(`
    SELECT
      qr.id AS report_id,
      qr.question_id,
      qr.reason,
      qr.details,
      qr.created_at,
      q.title AS question_title,
      q.status AS question_status,
      l.name AS language_name,
      u.username AS reporter_username
    FROM question_reports qr
    JOIN questions q ON qr.question_id = q.id
    JOIN languages l ON q.language_id = l.id
    JOIN users u ON qr.reporter_id = u.id
    ORDER BY qr.created_at DESC
    LIMIT 10
  `);

  const totalSubs = parseInt(submissionsCount[0]?.total || 0, 10);
  const totalAcc = parseInt(acceptedCount[0]?.total || 0, 10);

  return {
    totalUsers: parseInt(usersCount[0]?.total || 0, 10),
    totalQuestions: parseInt(questionsCount[0]?.total || 0, 10),
    activeQuestions: parseInt(activeQuestions[0]?.total || 0, 10),
    pendingReviewQuestions: parseInt(pendingReview[0]?.total || 0, 10),
    removedQuestions: parseInt(removedQuestions[0]?.total || 0, 10),
    totalSubmissions: totalSubs,
    acceptedSubmissions: totalAcc,
    acceptanceRate: totalSubs > 0
      ? Math.round((totalAcc / totalSubs) * 100)
      : 0,
    recentReports
  };
}

/**
 * Fetch list of reported questions (both PENDING_REVIEW and ACTIVE questions with reports)
 */
async function getReportedQuestions({ status = null, category = null, reportCount = null, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('q.status = ?');
    params.push(status);
  }

  if (category) {
    conditions.push('q.id IN (SELECT DISTINCT qr_sub.question_id FROM question_reports qr_sub WHERE qr_sub.reason = ?)');
    params.push(category);
  } else {
    // Default: show questions that have reports
    conditions.push('q.id IN (SELECT DISTINCT question_id FROM question_reports)');
  }

  if (reportCount === 'threshold' || reportCount === '4+') {
    conditions.push('(SELECT COUNT(DISTINCT qr_cnt.reporter_id) FROM question_reports qr_cnt WHERE qr_cnt.question_id = q.id) >= 4');
  } else if (reportCount === 'under_threshold' || reportCount === '1-3') {
    conditions.push('(SELECT COUNT(DISTINCT qr_cnt.reporter_id) FROM question_reports qr_cnt WHERE qr_cnt.question_id = q.id) < 4');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const questions = await db.query(`
    SELECT
      q.id,
      q.title,
      q.status,
      q.created_at,
      l.name AS language_name,
      l.slug AS language_slug,
      lvl.level_number,
      lvl.title AS level_title,
      u.username AS contributor_username,
      COUNT(DISTINCT qr.reporter_id) AS distinct_report_count
    FROM questions q
    JOIN languages l ON q.language_id = l.id
    JOIN levels lvl ON q.level_id = lvl.id
    JOIN users u ON q.contributor_id = u.id
    LEFT JOIN question_reports qr ON q.id = qr.question_id
    ${whereClause}
    GROUP BY q.id, l.name, l.slug, lvl.level_number, lvl.title, u.username
    ORDER BY
      CASE WHEN q.status = 'PENDING_REVIEW' THEN 0 WHEN q.status = 'ACTIVE' THEN 1 ELSE 2 END,
      distinct_report_count DESC,
      q.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, safeLimit, offset]);

  const totalCountRows = await db.query(`
    SELECT COUNT(DISTINCT q.id) AS total
    FROM questions q
    ${whereClause}
  `, params);

  const total = (totalCountRows && totalCountRows.length > 0) ? totalCountRows[0].total : 0;

  // Fetch full report feedbacks for the retrieved questions so admin can inspect without page transitions
  if (questions.length > 0) {
    const questionIds = questions.map(q => q.id);
    const reportRows = await db.query(`
      SELECT
        qr.id,
        qr.question_id,
        qr.reason,
        qr.details,
        qr.created_at,
        u.username AS reporter_username
      FROM question_reports qr
      JOIN users u ON qr.reporter_id = u.id
      WHERE qr.question_id IN (?)
      ORDER BY qr.created_at DESC
    `, [questionIds]);

    const reportsByQuestion = {};
    for (const r of reportRows) {
      if (!reportsByQuestion[r.question_id]) {
        reportsByQuestion[r.question_id] = [];
      }
      reportsByQuestion[r.question_id].push({
        id: r.id,
        reason: r.reason,
        details: r.details,
        reporterUsername: r.reporter_username,
        createdAt: r.created_at
      });
    }

    for (const q of questions) {
      q.reports = reportsByQuestion[q.id] || [];
      q.categories = [...new Set(q.reports.map(r => r.reason))];
    }
  }

  return {
    questions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
}

/**
 * Fetch complete details of a question for Admin Review
 * Includes HIDDEN test cases (only accessible to authorized admin!),
 * full report history, submission diagnostics, and audit logs.
 */
async function getAdminQuestionDetails(questionId) {
  const questions = await db.query(`
    SELECT
      q.*,
      l.name AS language_name,
      l.slug AS language_slug,
      lvl.level_number,
      lvl.title AS level_title,
      u.username AS contributor_username,
      u.email AS contributor_email,
      (SELECT COUNT(DISTINCT reporter_id) FROM question_reports WHERE question_id = q.id) AS distinct_report_count,
      (SELECT COUNT(*) FROM question_votes WHERE question_id = q.id) AS useful_votes_count
    FROM questions q
    JOIN languages l ON q.language_id = l.id
    JOIN levels lvl ON q.level_id = lvl.id
    JOIN users u ON q.contributor_id = u.id
    WHERE q.id = ?
  `, [questionId]);

  if (!questions || questions.length === 0) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }

  const question = questions[0];

  // Samples
  const samples = await db.query(
    'SELECT * FROM question_samples WHERE question_id = ? ORDER BY display_order ASC',
    [questionId]
  );

  // Hidden and public test cases (ADMIN ONLY)
  const testCases = await db.query(
    'SELECT * FROM question_test_cases WHERE question_id = ? ORDER BY display_order ASC',
    [questionId]
  );

  // Reports
  const reports = await db.query(`
    SELECT
      qr.id,
      qr.reason,
      qr.details,
      qr.created_at,
      u.id AS reporter_id,
      u.username AS reporter_username
    FROM question_reports qr
    JOIN users u ON qr.reporter_id = u.id
    WHERE qr.question_id = ?
    ORDER BY qr.created_at DESC
  `, [questionId]);

  // Audit Logs
  const auditLogs = await db.query(`
    SELECT
      al.id,
      al.previous_status,
      al.new_status,
      al.reason,
      al.created_at,
      u.username AS admin_username
    FROM question_audit_logs al
    LEFT JOIN users u ON al.admin_id = u.id
    WHERE al.question_id = ?
    ORDER BY al.created_at DESC
  `, [questionId]);

  // Recent Submissions summary
  const submissions = await db.query(`
    SELECT
      s.id,
      s.language,
      s.verdict,
      s.passed_test_count,
      s.total_test_count,
      s.execution_time,
      s.created_at,
      u.username
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    WHERE s.question_id = ?
    ORDER BY s.created_at DESC
    LIMIT 10
  `, [questionId]);

  return {
    question,
    samples,
    testCases,
    reports,
    auditLogs,
    submissions
  };
}

/**
 * Remove a question (sets status to 'REMOVED', records audit log)
 */
async function removeQuestion({ questionId, adminId, reason = 'Removed by administrator' }) {
  return await db.withTransaction(async (conn) => {
    const [questions] = await conn.query(
      'SELECT id, status FROM questions WHERE id = ? FOR UPDATE',
      [questionId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found');
      err.status = 404;
      throw err;
    }

    const currentStatus = questions[0].status;

    await conn.query(
      'UPDATE questions SET status = ? WHERE id = ?',
      ['REMOVED', questionId]
    );

    await conn.query(
      'INSERT INTO question_audit_logs (question_id, admin_id, previous_status, new_status, reason) VALUES (?, ?, ?, ?, ?)',
      [questionId, adminId, currentStatus, 'REMOVED', reason]
    );

    return {
      success: true,
      message: 'Question removed successfully.',
      previousStatus: currentStatus,
      newStatus: 'REMOVED'
    };
  });
}

/**
 * Restore a question to ACTIVE status
 * Records audit trail and clears/resets active community reports so it can be practiced again
 */
async function restoreQuestion({ questionId, adminId, reason = 'Restored by administrator after review' }) {
  return await db.withTransaction(async (conn) => {
    const [questions] = await conn.query(
      'SELECT id, status FROM questions WHERE id = ? FOR UPDATE',
      [questionId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found');
      err.status = 404;
      throw err;
    }

    const currentStatus = questions[0].status;

    // Reset status to ACTIVE
    await conn.query(
      'UPDATE questions SET status = ? WHERE id = ?',
      ['ACTIVE', questionId]
    );

    // Delete existing reports for this question so old reports do not immediately re-trigger PENDING_REVIEW,
    // while keeping historical audit log intact!
    await conn.query(
      'DELETE FROM question_reports WHERE question_id = ?',
      [questionId]
    );

    await conn.query(
      'INSERT INTO question_audit_logs (question_id, admin_id, previous_status, new_status, reason) VALUES (?, ?, ?, ?, ?)',
      [questionId, adminId, currentStatus, 'ACTIVE', reason]
    );

    return {
      success: true,
      message: 'Question restored to ACTIVE status and practice queue.',
      previousStatus: currentStatus,
      newStatus: 'ACTIVE'
    };
  });
}

/**
 * Get full audit history across all questions
 */
async function getAuditHistory({ page = 1, limit = 30 }) {
  const offset = (page - 1) * limit;

  const logs = await db.query(`
    SELECT
      al.id,
      al.question_id,
      q.title AS question_title,
      al.previous_status,
      al.new_status,
      al.reason,
      al.created_at,
      u.username AS admin_username
    FROM question_audit_logs al
    JOIN questions q ON al.question_id = q.id
    LEFT JOIN users u ON al.admin_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  const countRows = await db.query('SELECT COUNT(*) AS total FROM question_audit_logs');
  const total = (countRows && countRows.length > 0) ? countRows[0].total : 0;

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Fetch all levels for a language (Admin view including disabled and active/total question counts)
 */
async function getLanguageLevelsAdmin(languageId) {
  const isNumeric = /^\d+$/.test(languageId);
  const langRows = await db.query(
    isNumeric
      ? 'SELECT id, name, slug, enabled FROM languages WHERE id = ?'
      : 'SELECT id, name, slug, enabled FROM languages WHERE slug = ?',
    [languageId]
  );

  if (!langRows || langRows.length === 0) {
    const error = new Error('Language not found');
    error.statusCode = 404;
    throw error;
  }

  const language = langRows[0];

  const levels = await db.query(`
    SELECT
      lvl.id,
      lvl.language_id,
      lvl.level_number,
      lvl.title,
      lvl.description,
      lvl.enabled,
      lvl.created_at,
      COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS active_questions,
      COUNT(DISTINCT q.id) AS total_questions
    FROM levels lvl
    LEFT JOIN questions q ON lvl.id = q.level_id
    WHERE lvl.language_id = ?
    GROUP BY lvl.id, lvl.language_id, lvl.level_number, lvl.title, lvl.description, lvl.enabled, lvl.created_at
    ORDER BY lvl.level_number ASC
  `, [language.id]);

  return {
    language,
    levels: levels.map(lvl => ({
      id: lvl.id,
      languageId: lvl.language_id,
      levelNumber: lvl.level_number,
      title: lvl.title,
      description: lvl.description || '',
      enabled: Boolean(lvl.enabled),
      activeQuestions: parseInt(lvl.active_questions, 10),
      totalQuestions: parseInt(lvl.total_questions, 10),
      isEmpty: parseInt(lvl.active_questions, 10) === 0,
      createdAt: lvl.created_at
    }))
  };
}

/**
 * Create a new level for a language
 */
async function createLanguageLevelAdmin(languageId, { levelNumber, title, description, enabled = true }) {
  const isNumeric = /^\d+$/.test(languageId);
  const langRows = await db.query(
    isNumeric
      ? 'SELECT id, name, slug, enabled FROM languages WHERE id = ?'
      : 'SELECT id, name, slug, enabled FROM languages WHERE slug = ?',
    [languageId]
  );

  if (!langRows || langRows.length === 0) {
    const error = new Error('Language not found');
    error.statusCode = 404;
    throw error;
  }

  const language = langRows[0];

  if (!title || typeof title !== 'string' || !title.trim()) {
    const error = new Error('Level title is required (up to 100 characters)');
    error.statusCode = 400;
    throw error;
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 100) {
    const error = new Error('Level title cannot exceed 100 characters');
    error.statusCode = 400;
    throw error;
  }

  let finalLevelNumber;
  if (levelNumber !== undefined && levelNumber !== null && String(levelNumber).trim() !== '') {
    finalLevelNumber = parseInt(levelNumber, 10);
    if (isNaN(finalLevelNumber) || finalLevelNumber < 1) {
      const error = new Error('Level number must be a positive integer greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }
  } else {
    // Auto-calculate next level number
    const maxRows = await db.query(
      'SELECT MAX(level_number) AS max_num FROM levels WHERE language_id = ?',
      [language.id]
    );
    finalLevelNumber = (maxRows[0]?.max_num || 0) + 1;
  }

  // Prevent duplicate level numbers within the same language
  const existing = await db.query(
    'SELECT id FROM levels WHERE language_id = ? AND level_number = ?',
    [language.id, finalLevelNumber]
  );

  if (existing.length > 0) {
    const error = new Error(`Level ${finalLevelNumber} already exists for ${language.name}. Please select a different level number.`);
    error.statusCode = 400;
    throw error;
  }

  const trimmedDesc = description ? description.trim() : '';
  const isEnabled = enabled !== false;

  const insertResult = await db.query(`
    INSERT INTO levels (language_id, level_number, title, description, enabled)
    VALUES (?, ?, ?, ?, ?)
  `, [language.id, finalLevelNumber, trimmedTitle, trimmedDesc, isEnabled]);

  return {
    success: true,
    message: `Level ${finalLevelNumber} created successfully.`,
    level: {
      id: insertResult.insertId,
      languageId: language.id,
      levelNumber: finalLevelNumber,
      title: trimmedTitle,
      description: trimmedDesc,
      enabled: isEnabled,
      activeQuestions: 0,
      totalQuestions: 0,
      isEmpty: true
    }
  };
}

/**
 * Update an existing level's title, description, or level_number
 */
async function updateLevelAdmin(levelId, { title, description, levelNumber }) {
  const existingRows = await db.query(
    'SELECT id, language_id, level_number, title, description, enabled FROM levels WHERE id = ?',
    [levelId]
  );

  if (!existingRows || existingRows.length === 0) {
    const error = new Error('Level not found');
    error.statusCode = 404;
    throw error;
  }

  const current = existingRows[0];
  let finalTitle = current.title;
  let finalDesc = current.description;
  let finalLevelNum = current.level_number;

  if (title !== undefined) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      const error = new Error('Level title cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    if (title.trim().length > 100) {
      const error = new Error('Level title cannot exceed 100 characters');
      error.statusCode = 400;
      throw error;
    }
    finalTitle = title.trim();
  }

  if (description !== undefined) {
    finalDesc = description ? description.trim() : '';
  }

  if (levelNumber !== undefined && levelNumber !== null && String(levelNumber).trim() !== '') {
    const parsedNum = parseInt(levelNumber, 10);
    if (isNaN(parsedNum) || parsedNum < 1) {
      const error = new Error('Level number must be a positive integer greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }

    if (parsedNum !== current.level_number) {
      const conflict = await db.query(
        'SELECT id FROM levels WHERE language_id = ? AND level_number = ? AND id != ?',
        [current.language_id, parsedNum, levelId]
      );
      if (conflict.length > 0) {
        const error = new Error(`Level number ${parsedNum} is already in use for this language`);
        error.statusCode = 400;
        throw error;
      }
      finalLevelNum = parsedNum;
    }
  }

  await db.query(`
    UPDATE levels
    SET title = ?, description = ?, level_number = ?
    WHERE id = ?
  `, [finalTitle, finalDesc, finalLevelNum, levelId]);

  return {
    success: true,
    message: 'Level updated successfully',
    level: {
      id: current.id,
      languageId: current.language_id,
      levelNumber: finalLevelNum,
      title: finalTitle,
      description: finalDesc,
      enabled: Boolean(current.enabled)
    }
  };
}

/**
 * Toggle or set enabled status for a level
 */
async function toggleLevelStatusAdmin(levelId, enabled = undefined) {
  const existingRows = await db.query(
    'SELECT id, language_id, level_number, title, enabled FROM levels WHERE id = ?',
    [levelId]
  );

  if (!existingRows || existingRows.length === 0) {
    const error = new Error('Level not found');
    error.statusCode = 404;
    throw error;
  }

  const current = existingRows[0];
  const newStatus = enabled !== undefined ? Boolean(enabled) : !Boolean(current.enabled);

  await db.query('UPDATE levels SET enabled = ? WHERE id = ?', [newStatus, levelId]);

  return {
    success: true,
    message: `Level ${current.level_number} has been ${newStatus ? 'enabled' : 'disabled'} for practice.`,
    level: {
      id: current.id,
      levelNumber: current.level_number,
      enabled: newStatus
    }
  };
}

/**
 * Delete a level if safe (no existing questions or submissions)
 */
async function deleteLevelAdmin(levelId) {
  const existingRows = await db.query(
    'SELECT id, level_number, language_id FROM levels WHERE id = ?',
    [levelId]
  );

  if (!existingRows || existingRows.length === 0) {
    const error = new Error('Level not found');
    error.statusCode = 404;
    throw error;
  }

  const current = existingRows[0];

  // Check for any questions linked to this level
  const questionCount = await db.query(
    'SELECT COUNT(*) AS total FROM questions WHERE level_id = ?',
    [levelId]
  );

  const totalQuestions = parseInt(questionCount[0]?.total || 0, 10);
  if (totalQuestions > 0) {
    const error = new Error(`Cannot delete Level ${current.level_number} because it contains ${totalQuestions} question(s). Disable the level instead to preserve question and submission records.`);
    error.statusCode = 400;
    throw error;
  }

  await db.query('DELETE FROM levels WHERE id = ?', [levelId]);

  return {
    success: true,
    message: `Level ${current.level_number} deleted successfully.`
  };
}

/**
 * List registered users with search, role filter, sorting, and pagination for Admin Console
 */
async function getUsersAdmin({ search = '', role = '', status = '', page = 1, limit = 20, sort = 'newest' } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    conditions.push('(u.username LIKE ? OR u.email LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (role && (role.toUpperCase() === 'USER' || role.toUpperCase() === 'ADMIN')) {
    conditions.push('u.role = ?');
    params.push(role.toUpperCase());
  }

  // Handle account status filter (defaults to active accounts so deleted users disappear)
  if (status && status.toUpperCase() === 'DELETED') {
    conditions.push("u.status = 'DELETED'");
  } else if (status && status.toUpperCase() === 'ALL') {
    // Show all accounts
  } else {
    // Default active accounts
    conditions.push("(u.status = 'ACTIVE' OR u.status IS NULL)");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderClause = 'u.created_at DESC';
  if (sort === 'oldest') orderClause = 'u.created_at ASC';
  else if (sort === 'username_asc') orderClause = 'u.username ASC';
  else if (sort === 'username_desc') orderClause = 'u.username DESC';
  else if (sort === 'email_asc') orderClause = 'u.email ASC';

  // Count matching total
  const countRows = await db.query(
    `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
    params
  );
  const total = parseInt(countRows[0]?.total || 0, 10);

  // Overall platform user role distribution (active users)
  const roleCounts = await db.query(`
    SELECT
      COUNT(*) AS total_all,
      SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS total_admins,
      SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) AS total_users
    FROM users
    WHERE status = 'ACTIVE' OR status IS NULL
  `);

  // Query users without exposing password_hash
  const users = await db.query(
    `
    SELECT
      u.id,
      u.username,
      u.email,
      u.role,
      u.status,
      u.created_at,
      u.updated_at,
      (SELECT COUNT(*) FROM user_solved_questions usq WHERE usq.user_id = u.id) AS solved_count,
      (SELECT COUNT(*) FROM questions q WHERE q.contributor_id = u.id) AS contributed_count,
      (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) AS submission_count
    FROM users u
    ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset]
  );

  return {
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status || 'ACTIVE',
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      solvedCount: parseInt(u.solved_count || 0, 10),
      contributedCount: parseInt(u.contributed_count || 0, 10),
      submissionCount: parseInt(u.submission_count || 0, 10)
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    },
    counts: {
      totalAll: parseInt(roleCounts[0]?.total_all || 0, 10),
      totalAdmins: parseInt(roleCounts[0]?.total_admins || 0, 10),
      totalUsers: parseInt(roleCounts[0]?.total_users || 0, 10)
    }
  };
}

/**
 * Retrieve a single user's safe profile by ID for Admin Console
 */
async function getUserByIdAdmin(userId) {
  const users = await db.query(
    `
    SELECT
      u.id,
      u.username,
      u.email,
      u.role,
      u.status,
      u.created_at,
      u.updated_at,
      (SELECT COUNT(*) FROM user_solved_questions usq WHERE usq.user_id = u.id) AS solved_count,
      (SELECT COUNT(*) FROM questions q WHERE q.contributor_id = u.id) AS contributed_count,
      (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) AS submission_count
    FROM users u
    WHERE u.id = ?
    `,
    [userId]
  );

  if (!users || users.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const u = users[0];
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status || 'ACTIVE',
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    solvedCount: parseInt(u.solved_count || 0, 10),
    contributedCount: parseInt(u.contributed_count || 0, 10),
    submissionCount: parseInt(u.submission_count || 0, 10)
  };
}

/**
 * Update permitted user fields (username, email, role)
 * Enforces field validation, unique constraints, and prevents admin lockout
 */
async function updateUserAdmin(userId, updateData = {}, currentAdminUserId) {
  const existingRows = await db.query(
    'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  if (!existingRows || existingRows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const existing = existingRows[0];

  const newUsername = updateData.username !== undefined ? String(updateData.username).trim() : existing.username;
  const newEmail = updateData.email !== undefined ? String(updateData.email).trim().toLowerCase() : existing.email;
  const newRole = updateData.role !== undefined ? String(updateData.role).toUpperCase().trim() : existing.role;

  // Validate username
  if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
    const error = new Error('Username must be between 3 and 50 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
    const error = new Error('Username may only contain letters, numbers, and underscores.');
    error.statusCode = 400;
    throw error;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail || !emailRegex.test(newEmail)) {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    throw error;
  }

  // Validate role
  if (newRole !== 'USER' && newRole !== 'ADMIN') {
    const error = new Error('Role must be either USER or ADMIN.');
    error.statusCode = 400;
    throw error;
  }

  // Lockout prevention: if editing own account, admin cannot demote themselves to USER
  if (parseInt(userId, 10) === parseInt(currentAdminUserId, 10)) {
    if (newRole !== 'ADMIN') {
      const error = new Error('You cannot remove administrator privileges from your own account.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Uniqueness check for email
  if (newEmail !== existing.email) {
    const emailConflict = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [newEmail, userId]
    );
    if (emailConflict && emailConflict.length > 0) {
      const error = new Error('Email address is already in use by another account.');
      error.statusCode = 409;
      throw error;
    }
  }

  // Uniqueness check for username
  if (newUsername !== existing.username) {
    const usernameConflict = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [newUsername, userId]
    );
    if (usernameConflict && usernameConflict.length > 0) {
      const error = new Error('Username is already taken by another account.');
      error.statusCode = 409;
      throw error;
    }
  }

  // Update in database using parameterized query
  await db.query(
    'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
    [newUsername, newEmail, newRole, userId]
  );

  return {
    success: true,
    message: `User '${newUsername}' updated successfully.`,
    user: {
      id: existing.id,
      username: newUsername,
      email: newEmail,
      role: newRole,
      status: existing.status || 'ACTIVE',
      createdAt: existing.created_at,
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Delete a user account (safe soft deletion)
 * Marks user as 'DELETED' so user immediately disappears from the active user list,
 * while strictly preserving all historical submissions, solved records, questions contributed,
 * votes, reports, and audit logs without foreign-key cascade destruction.
 */
async function deleteUserAdmin(userId, currentAdminUserId) {
  if (!userId || isNaN(userId) || parseInt(userId, 10) < 1) {
    const error = new Error('Invalid user ID.');
    error.statusCode = 400;
    throw error;
  }

  const targetId = parseInt(userId, 10);
  const adminId = parseInt(currentAdminUserId, 10);

  // Self-deletion safeguard
  if (targetId === adminId) {
    const error = new Error('You cannot delete your own administrator account.');
    error.statusCode = 400;
    throw error;
  }

  const existingRows = await db.query(
    'SELECT id, username, email, role, status FROM users WHERE id = ?',
    [targetId]
  );

  if (!existingRows || existingRows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const targetUser = existingRows[0];

  // Primary system administrator safeguard
  if (targetUser.email === 'admin@example.com') {
    const error = new Error('The primary system administrator account cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  // Safeguard against deleting the last remaining active administrator
  if (targetUser.role === 'ADMIN') {
    const adminCountRows = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN' AND (status = 'ACTIVE' OR status IS NULL) AND id != ?",
      [targetId]
    );
    const remainingAdmins = parseInt(adminCountRows[0]?.total || 0, 10);
    if (remainingAdmins === 0) {
      const error = new Error('Cannot delete the last active administrator account.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Soft delete: marks status as 'DELETED'
  await db.query(
    "UPDATE users SET status = 'DELETED', updated_at = NOW() WHERE id = ?",
    [targetId]
  );

  return {
    success: true,
    message: `User account "${targetUser.username}" (${targetUser.email}) has been successfully deleted.`,
    deletedUserId: targetId,
    status: 'DELETED'
  };
}

/**
 * Delete a question from active practice
 * Sets status to 'REMOVED' and logs the audit event.
 * Preserves all historical submissions, tests, reports, and solutions.
 * Permanently prevents question from being loaded for practice or accepting new submissions.
 */
async function deleteQuestionAdmin({ questionId, adminId, reason = 'Deleted by administrator' }) {
  if (!questionId || isNaN(questionId) || parseInt(questionId, 10) < 1) {
    const error = new Error('Invalid question ID.');
    error.statusCode = 400;
    throw error;
  }

  const qId = parseInt(questionId, 10);

  return await db.withTransaction(async (conn) => {
    const [questions] = await conn.query(
      'SELECT id, title, status FROM questions WHERE id = ? FOR UPDATE',
      [qId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found.');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const currentQuestion = questions[0];
    const previousStatus = currentQuestion.status;

    await conn.query(
      'UPDATE questions SET status = ? WHERE id = ?',
      ['REMOVED', qId]
    );

    await conn.query(
      'INSERT INTO question_audit_logs (question_id, admin_id, previous_status, new_status, reason) VALUES (?, ?, ?, ?, ?)',
      [qId, adminId, previousStatus, 'REMOVED', reason || 'Deleted by administrator']
    );

    return {
      success: true,
      message: `Question #${qId} ("${currentQuestion.title}") has been deleted and removed from active practice. All historical submissions, test cases, and audit logs are safely preserved.`,
      questionId: qId,
      previousStatus,
      status: 'REMOVED'
    };
  });
}

module.exports = {
  getAdminOverview,
  getReportedQuestions,
  getAdminQuestionDetails,
  removeQuestion,
  restoreQuestion,
  deleteQuestionAdmin,
  getAuditHistory,
  getLanguageLevelsAdmin,
  createLanguageLevelAdmin,
  updateLevelAdmin,
  toggleLevelStatusAdmin,
  deleteLevelAdmin,
  getUsersAdmin,
  getUserByIdAdmin,
  updateUserAdmin,
  deleteUserAdmin
};

