const db = require('../config/db');
const { LANGUAGE_CONFIG, getCompilerConfig, isSupportedCompilerId } = require('../config/judge0');

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
      al.changed_fields,
      al.created_at,
      u.username AS admin_username
    FROM question_audit_logs al
    LEFT JOIN users u ON al.admin_id = u.id
    WHERE al.question_id = ?
    ORDER BY al.created_at DESC
  `, [questionId]);

  // Starter code templates
  const starterTemplates = await db.query(
    'SELECT language_slug, code FROM starter_code_templates WHERE question_id = ?',
    [questionId]
  );
  const starterCode = {};
  for (const st of starterTemplates) {
    starterCode[st.language_slug] = st.code;
  }

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
    starterCode,
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

    // If question is already removed, return status without redundant update
    if (currentQuestion.status === 'REMOVED') {
      return {
        success: true,
        message: `Question #${qId} ("${currentQuestion.title}") is already removed from active practice.`,
        questionId: qId,
        previousStatus: 'REMOVED',
        status: 'REMOVED',
        alreadyRemoved: true
      };
    }

    await conn.query(
      'UPDATE questions SET status = ? WHERE id = ?',
      ['REMOVED', qId]
    );

    await conn.query(
      'INSERT INTO question_audit_logs (question_id, admin_id, previous_status, new_status, reason, changed_fields) VALUES (?, ?, ?, ?, ?, ?)',
      [qId, adminId, previousStatus, 'REMOVED', reason || 'Deleted by administrator', JSON.stringify(['status'])]
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

/**
 * List all questions with comprehensive filtering (search, language, level, status) for Admin
 */
async function getQuestionsAdmin({
  search = '',
  programId = '',
  languageId = '',
  levelId = '',
  status = '',
  page = 1,
  limit = 20,
  sort = 'newest'
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    conditions.push('(q.title LIKE ? OR q.statement LIKE ? OR CAST(q.id AS CHAR) = ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, search.trim());
  }

  if (programId && !isNaN(programId)) {
    conditions.push('q.program_id = ?');
    params.push(parseInt(programId, 10));
  }

  if (languageId && !isNaN(languageId)) {
    conditions.push('q.language_id = ?');
    params.push(parseInt(languageId, 10));
  }

  if (levelId && !isNaN(levelId)) {
    conditions.push('q.level_id = ?');
    params.push(parseInt(levelId, 10));
  }

  if (status && ['ACTIVE', 'PENDING_REVIEW', 'REMOVED'].includes(status.toUpperCase().trim())) {
    conditions.push('q.status = ?');
    params.push(status.toUpperCase().trim());
  }

  let orderClause = 'q.id DESC';
  if (sort === 'oldest') orderClause = 'q.id ASC';
  else if (sort === 'title') orderClause = 'q.title ASC';
  else if (sort === 'reports') orderClause = 'report_count DESC, q.id DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const questions = await db.query(`
    SELECT
      q.id,
      q.title,
      q.statement,
      q.input_format,
      q.output_format,
      q.constraints_text,
      q.explanation,
      q.program_id,
      q.language_id,
      q.level_id,
      q.contributor_id,
      q.status,
      q.created_at,
      q.updated_at,
      p.name AS program_name,
      p.slug AS program_slug,
      p.icon AS program_icon,
      l.name AS language_name,
      l.slug AS language_slug,
      lvl.level_number,
      lvl.title AS level_title,
      u.username AS contributor_username,
      (SELECT COUNT(*) FROM question_reports qr WHERE qr.question_id = q.id) AS report_count,
      (SELECT COUNT(*) FROM question_votes qv WHERE qv.question_id = q.id) AS useful_votes_count,
      (SELECT COUNT(*) FROM question_samples qs WHERE qs.question_id = q.id) AS sample_count,
      (SELECT COUNT(*) FROM question_test_cases qtc WHERE qtc.question_id = q.id) AS test_case_count
    FROM questions q
    LEFT JOIN programs p ON q.program_id = p.id
    LEFT JOIN languages l ON q.language_id = l.id
    LEFT JOIN levels lvl ON q.level_id = lvl.id
    LEFT JOIN users u ON q.contributor_id = u.id
    ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `, [...params, safeLimit, offset]);

  const countRows = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN q.status = 'ACTIVE' THEN 1 END) AS total_active,
      COUNT(CASE WHEN q.status = 'PENDING_REVIEW' THEN 1 END) AS total_pending,
      COUNT(CASE WHEN q.status = 'REMOVED' THEN 1 END) AS total_removed
    FROM questions q
    ${whereClause}
  `, params);

  const c = countRows[0] || {};
  const total = parseInt(c.total || 0, 10);

  // Global counts for filter tabs
  const globalCounts = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active,
      COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) AS pending,
      COUNT(CASE WHEN status = 'REMOVED' THEN 1 END) AS removed
    FROM questions
  `);
  const gc = globalCounts[0] || {};

  return {
    questions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit)
    },
    counts: {
      filteredTotal: total,
      total: parseInt(gc.total || 0, 10),
      active: parseInt(gc.active || 0, 10),
      pending: parseInt(gc.pending || 0, 10),
      removed: parseInt(gc.removed || 0, 10)
    }
  };
}

/**
 * Edit an existing question (admin update)
 * Allows modifying title, statement, input/output format, constraints, samples, test cases,
 * starter code, language, and level.
 * Strictly preserves identifiers, audit history, submissions, and reports.
 * Explicit status handling: does not silently restore or approve.
 */
async function updateQuestionAdmin(questionId, updateData = {}, adminId) {
  const qId = parseInt(questionId, 10);
  if (isNaN(qId) || qId < 1) {
    const err = new Error('Invalid question ID.');
    err.statusCode = 400;
    throw err;
  }

  return await db.withTransaction(async (conn) => {
    const [questions] = await conn.query(
      'SELECT * FROM questions WHERE id = ? FOR UPDATE',
      [qId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found.');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const currentQuestion = questions[0];
    const changedFields = [];

    // Title validation
    let title = currentQuestion.title;
    if (updateData.title !== undefined) {
      const cleanTitle = String(updateData.title).trim();
      if (cleanTitle.length < 5 || cleanTitle.length > 200) {
        const err = new Error('Question title must be between 5 and 200 characters.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanTitle !== currentQuestion.title) {
        changedFields.push('title');
        title = cleanTitle;
      }
    }

    // Statement validation
    let statement = currentQuestion.statement;
    if (updateData.statement !== undefined) {
      const cleanStatement = String(updateData.statement).trim();
      if (cleanStatement.length < 20) {
        const err = new Error('Problem statement must be at least 20 characters.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanStatement !== currentQuestion.statement) {
        changedFields.push('statement');
        statement = cleanStatement;
      }
    }

    // Input format
    let inputFormat = currentQuestion.input_format;
    if (updateData.input_format !== undefined) {
      const cleanInput = String(updateData.input_format).trim();
      if (!cleanInput) {
        const err = new Error('Input format description is required.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanInput !== currentQuestion.input_format) {
        changedFields.push('input_format');
        inputFormat = cleanInput;
      }
    }

    // Output format
    let outputFormat = currentQuestion.output_format;
    if (updateData.output_format !== undefined) {
      const cleanOutput = String(updateData.output_format).trim();
      if (!cleanOutput) {
        const err = new Error('Output format description is required.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanOutput !== currentQuestion.output_format) {
        changedFields.push('output_format');
        outputFormat = cleanOutput;
      }
    }

    // Constraints
    let constraintsText = currentQuestion.constraints_text;
    if (updateData.constraints_text !== undefined) {
      const cleanConstraints = String(updateData.constraints_text).trim();
      if (!cleanConstraints) {
        const err = new Error('Constraints description is required.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanConstraints !== currentQuestion.constraints_text) {
        changedFields.push('constraints_text');
        constraintsText = cleanConstraints;
      }
    }

    // Explanation / reference solution
    let explanation = currentQuestion.explanation;
    if (updateData.explanation !== undefined) {
      const cleanExp = updateData.explanation ? String(updateData.explanation).trim() : '';
      if (cleanExp !== (currentQuestion.explanation || '')) {
        changedFields.push('explanation');
        explanation = cleanExp;
      }
    }

    // Program ID validation
    let programId = currentQuestion.program_id;
    if (updateData.program_id !== undefined) {
      const parsedProgId = updateData.program_id ? parseInt(updateData.program_id, 10) : null;
      if (parsedProgId !== null) {
        if (isNaN(parsedProgId) || parsedProgId < 1) {
          const err = new Error('Valid program ID is required.');
          err.statusCode = 400;
          throw err;
        }
        const [progRows] = await conn.query('SELECT id, name FROM programs WHERE id = ?', [parsedProgId]);
        if (!progRows || progRows.length === 0) {
          const err = new Error('Selected program does not exist.');
          err.statusCode = 400;
          throw err;
        }
      }
      if (parsedProgId !== currentQuestion.program_id) {
        changedFields.push('program_id');
        programId = parsedProgId;
      }
    }

    // Language ID validation
    let languageId = currentQuestion.language_id;
    if (updateData.language_id !== undefined) {
      const parsedLangId = updateData.language_id ? parseInt(updateData.language_id, 10) : null;
      if (parsedLangId !== null) {
        if (isNaN(parsedLangId) || parsedLangId < 1) {
          const err = new Error('Valid language ID is required.');
          err.statusCode = 400;
          throw err;
        }

        const [langRows] = await conn.query(
          'SELECT id, name, slug FROM languages WHERE id = ? AND enabled = TRUE',
          [parsedLangId]
        );
        if (!langRows || langRows.length === 0) {
          const err = new Error('Selected programming language does not exist or is disabled.');
          err.statusCode = 400;
          throw err;
        }

        // If program is set, verify the language is an allowed compiler for this program
        if (programId) {
          const [plRows] = await conn.query(
            'SELECT id FROM program_languages WHERE program_id = ? AND language_id = ?',
            [programId, parsedLangId]
          );
          if (!plRows || plRows.length === 0) {
            const err = new Error('The selected programming language is not supported by this program.');
            err.statusCode = 400;
            throw err;
          }
        }
      }

      if (parsedLangId !== currentQuestion.language_id) {
        changedFields.push('language_id');
        languageId = parsedLangId;
      }
    }

    // Level ID validation (must belong to target program and match language if applicable)
    let levelId = currentQuestion.level_id;
    if (updateData.level_id !== undefined || updateData.program_id !== undefined || updateData.language_id !== undefined) {
      const targetLevelId = updateData.level_id !== undefined ? parseInt(updateData.level_id, 10) : currentQuestion.level_id;
      if (isNaN(targetLevelId) || targetLevelId < 1) {
        const err = new Error('Valid level ID is required.');
        err.statusCode = 400;
        throw err;
      }

      const [lvlRows] = await conn.query(
        'SELECT id, program_id, language_id, level_number, title FROM levels WHERE id = ?',
        [targetLevelId]
      );
      if (!lvlRows || lvlRows.length === 0) {
        const err = new Error('Selected level does not exist.');
        err.statusCode = 400;
        throw err;
      }

      const targetLevel = lvlRows[0];

      // CRITICAL: Prevent assigning a question to a level from another program!
      if (programId && targetLevel.program_id && targetLevel.program_id !== programId) {
        const err = new Error('Cannot assign question to a level from another program.');
        err.statusCode = 400;
        throw err;
      }

      // If level is language-specific and languageId is provided, verify match
      if (targetLevel.language_id && languageId && targetLevel.language_id !== languageId) {
        const err = new Error('Selected level does not belong to the selected programming language.');
        err.statusCode = 400;
        throw err;
      }

      // If programId wasn't explicitly supplied but level has program_id, sync programId
      if (!programId && targetLevel.program_id) {
        programId = targetLevel.program_id;
      }

      if (targetLevelId !== currentQuestion.level_id) {
        changedFields.push('level_id');
        levelId = targetLevelId;
      }
    }

    // Status: explicit update behavior
    // Editing a removed question does NOT silently restore it.
    // Editing a pending-review question does NOT silently approve it.
    let finalStatus = currentQuestion.status;
    if (updateData.status !== undefined && updateData.status !== null) {
      const cleanStatus = String(updateData.status).toUpperCase().trim();
      if (!['ACTIVE', 'PENDING_REVIEW', 'REMOVED'].includes(cleanStatus)) {
        const err = new Error('Invalid status. Must be ACTIVE, PENDING_REVIEW, or REMOVED.');
        err.statusCode = 400;
        throw err;
      }
      if (cleanStatus !== currentQuestion.status) {
        changedFields.push('status');
        finalStatus = cleanStatus;
      }
    }

    // Update questions table
    await conn.query(`
      UPDATE questions
      SET program_id = ?, title = ?, statement = ?, input_format = ?, output_format = ?,
          constraints_text = ?, explanation = ?, language_id = ?, level_id = ?,
          status = ?
      WHERE id = ?
    `, [
      programId, title, statement, inputFormat, outputFormat,
      constraintsText, explanation, languageId, levelId,
      finalStatus, qId
    ]);

    // Update samples if provided
    if (updateData.samples !== undefined) {
      if (!Array.isArray(updateData.samples) || updateData.samples.length === 0) {
        const err = new Error('At least one sample input/output pair is required.');
        err.statusCode = 400;
        throw err;
      }

      for (let i = 0; i < updateData.samples.length; i++) {
        const s = updateData.samples[i];
        if (s.sample_input === undefined || s.expected_output === undefined) {
          const err = new Error(`Sample #${i + 1} must include sample_input and expected_output.`);
          err.statusCode = 400;
          throw err;
        }
      }

      await conn.query('DELETE FROM question_samples WHERE question_id = ?', [qId]);
      for (let i = 0; i < updateData.samples.length; i++) {
        const s = updateData.samples[i];
        await conn.query(`
          INSERT INTO question_samples (question_id, sample_input, expected_output, explanation, display_order)
          VALUES (?, ?, ?, ?, ?)
        `, [qId, String(s.sample_input || ''), String(s.expected_output || ''), String(s.explanation || ''), i + 1]);
      }
      changedFields.push('samples');
    }

    // Update test cases if provided
    if (updateData.test_cases !== undefined) {
      if (!Array.isArray(updateData.test_cases) || updateData.test_cases.length === 0) {
        const err = new Error('At least one test case is required.');
        err.statusCode = 400;
        throw err;
      }

      for (let i = 0; i < updateData.test_cases.length; i++) {
        const tc = updateData.test_cases[i];
        if (tc.test_input === undefined || tc.expected_output === undefined) {
          const err = new Error(`Test case #${i + 1} must include test_input and expected_output.`);
          err.statusCode = 400;
          throw err;
        }
      }

      await conn.query('DELETE FROM question_test_cases WHERE question_id = ?', [qId]);
      for (let i = 0; i < updateData.test_cases.length; i++) {
        const tc = updateData.test_cases[i];
        await conn.query(`
          INSERT INTO question_test_cases (question_id, test_input, expected_output, is_hidden, display_order)
          VALUES (?, ?, ?, ?, ?)
        `, [qId, String(tc.test_input || ''), String(tc.expected_output || ''), tc.is_hidden !== false, i + 1]);
      }
      changedFields.push('test_cases');
    }

    // Update starter code / reference solution templates if provided
    if (updateData.starter_code !== undefined && typeof updateData.starter_code === 'object') {
      await conn.query('DELETE FROM starter_code_templates WHERE question_id = ?', [qId]);
      for (const [langSlug, code] of Object.entries(updateData.starter_code)) {
        if (typeof code === 'string' && code.trim()) {
          await conn.query(`
            INSERT INTO starter_code_templates (question_id, language_slug, code)
            VALUES (?, ?, ?)
          `, [qId, langSlug, code]);
        }
      }
      changedFields.push('starter_code');
    }

    // Record audit event
    const reasonText = updateData.reason || `Question edited by administrator${changedFields.length > 0 ? ` (Changed: ${changedFields.join(', ')})` : ''}`;
    await conn.query(`
      INSERT INTO question_audit_logs (
        question_id, admin_id, previous_status, new_status, reason, changed_fields
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      qId,
      adminId,
      currentQuestion.status,
      finalStatus,
      reasonText,
      JSON.stringify(changedFields)
    ]);

    return {
      success: true,
      message: `Question #${qId} ("${title}") updated successfully.`,
      question: {
        id: qId,
        title,
        statement,
        inputFormat,
        outputFormat,
        constraintsText,
        explanation,
        languageId,
        levelId,
        status: finalStatus
      },
      changedFields
    };
  });
}

/**
 * List all programs with enabled languages, associated level count, and question count
 */
async function getProgramsAdmin({
  search = '',
  status = '',
  page = 1,
  limit = 20
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase().trim())) {
    conditions.push('p.status = ?');
    params.push(status.toUpperCase().trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const programs = await db.query(`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.icon,
      p.status,
      p.created_at,
      p.updated_at
    FROM programs p
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `, [...params, safeLimit, offset]);

  // Enrich each program with its enabled compilers and direct level/question counts
  const enriched = [];
  for (const prog of programs) {
    const compilers = await db.query(`
      SELECT
        pl.compiler_id,
        pl.compiler_name,
        l.id AS language_id,
        l.name AS language_name,
        l.slug AS language_slug
      FROM program_languages pl
      JOIN languages l ON pl.language_id = l.id
      WHERE pl.program_id = ?
      ORDER BY l.name ASC
    `, [prog.id]);

    const lvlRes = await db.query(`
      SELECT COUNT(*) AS total, COUNT(CASE WHEN enabled = TRUE THEN 1 END) AS enabled_total
      FROM levels
      WHERE program_id = ?
    `, [prog.id]);
    const levelCount = parseInt(lvlRes[0]?.total || 0, 10);
    const enabledLevelCount = parseInt(lvlRes[0]?.enabled_total || 0, 10);

    const qRes = await db.query(`
      SELECT COUNT(*) AS total, COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_total
      FROM questions
      WHERE program_id = ?
    `, [prog.id]);
    const questionCount = parseInt(qRes[0]?.total || 0, 10);
    const activeQuestionCount = parseInt(qRes[0]?.active_total || 0, 10);

    enriched.push({
      ...prog,
      compilers,
      languages: compilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug })),
      compilerCount: compilers.length,
      levelCount,
      enabledLevelCount,
      questionCount,
      activeQuestionCount
    });
  }

  const countRes = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active,
      COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) AS inactive
    FROM programs p
    ${whereClause}
  `, params);

  const c = countRes[0] || {};
  const total = parseInt(c.total || 0, 10);

  return {
    programs: enriched,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit)
    },
    counts: {
      total,
      active: parseInt(c.active || 0, 10),
      inactive: parseInt(c.inactive || 0, 10)
    }
  };
}

/**
 * Get program details by ID, including compilers, independent levels, and associated questions
 */
async function getProgramByIdAdmin(programId) {
  const pId = parseInt(programId, 10);
  if (isNaN(pId) || pId < 1) {
    const err = new Error('Invalid program ID.');
    err.statusCode = 400;
    throw err;
  }

  const programs = await db.query('SELECT * FROM programs WHERE id = ?', [pId]);
  if (!programs || programs.length === 0) {
    const err = new Error('Program not found.');
    err.statusCode = 404;
    throw err;
  }

  const program = programs[0];

  const compilers = await db.query(`
    SELECT
      pl.compiler_id,
      pl.compiler_name,
      l.id AS language_id,
      l.name AS language_name,
      l.slug AS language_slug,
      l.enabled AS language_enabled
    FROM program_languages pl
    JOIN languages l ON pl.language_id = l.id
    WHERE pl.program_id = ?
    ORDER BY l.name ASC
  `, [pId]);

  // Fetch independent levels belonging directly to this program
  const levels = await db.query(`
    SELECT
      lvl.id,
      lvl.program_id,
      lvl.level_number,
      lvl.title,
      lvl.description,
      lvl.enabled,
      COUNT(DISTINCT q.id) AS total_questions,
      COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS active_questions,
      COUNT(DISTINCT CASE WHEN q.status = 'REMOVED' THEN q.id END) AS removed_questions
    FROM levels lvl
    LEFT JOIN questions q ON lvl.id = q.level_id
    WHERE lvl.program_id = ?
    GROUP BY lvl.id, lvl.program_id, lvl.level_number, lvl.title, lvl.description, lvl.enabled
    ORDER BY lvl.level_number ASC
  `, [pId]);

  // Fetch recent questions for this program
  const recentQuestions = await db.query(`
    SELECT
      q.id,
      q.title,
      q.language_id,
      q.level_id,
      q.status,
      q.created_at,
      l.name AS language_name,
      lvl.level_number,
      lvl.title AS level_title
    FROM questions q
    LEFT JOIN languages l ON q.language_id = l.id
    LEFT JOIN levels lvl ON q.level_id = lvl.id
    WHERE q.program_id = ?
    ORDER BY q.id DESC
    LIMIT 20
  `, [pId]);

  return {
    program,
    compilers,
    languages: compilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug })),
    levels,
    recentQuestions,
    totalLevels: levels.length,
    totalQuestions: recentQuestions.length
  };
}

/**
 * Validate compilers / language_ids against system LANGUAGE_CONFIG
 */
async function resolveAndValidateCompilers({ compilers, language_ids, course_type = 'CODING' }) {
  const compilerList = [];
  const isTheory = String(course_type || '').toUpperCase().trim() === 'THEORY';

  if (Array.isArray(compilers) && compilers.length > 0) {
    for (const c of compilers) {
      const compId = parseInt(c.compiler_id, 10);
      if (isNaN(compId) || !isSupportedCompilerId(compId)) {
        const err = new Error(`Unsupported or invalid compiler runtime ID: ${c.compiler_id}. Supported runtimes: C (50), C++ (54), Java (62), Python (71).`);
        err.statusCode = 400;
        throw err;
      }
      const conf = getCompilerConfig(compId);
      const langId = c.language_id ? parseInt(c.language_id, 10) : null;

      let langRecord;
      if (langId) {
        const found = await db.query('SELECT id, name, slug FROM languages WHERE id = ?', [langId]);
        if (!found || found.length === 0) {
          const err = new Error(`Language ID ${langId} does not exist.`);
          err.statusCode = 400;
          throw err;
        }
        langRecord = found[0];
      } else if (conf) {
        const found = await db.query('SELECT id, name, slug FROM languages WHERE slug = ?', [conf.slug]);
        if (!found || found.length === 0) {
          const err = new Error(`Language for compiler ${conf.slug} does not exist.`);
          err.statusCode = 400;
          throw err;
        }
        langRecord = found[0];
      }

      compilerList.push({
        language_id: langRecord.id,
        compiler_id: compId,
        compiler_name: c.compiler_name || conf.compilerName || conf.displayName,
        language_name: langRecord.name,
        language_slug: langRecord.slug
      });
    }
  } else if (Array.isArray(language_ids) && language_ids.length > 0) {
    const parsedLangIds = [...new Set(language_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0))];
    if (parsedLangIds.length === 0) {
      if (isTheory) return [];
      const err = new Error('At least one supported programming language must be selected for the program.');
      err.statusCode = 400;
      throw err;
    }

    const validLangs = await db.query(
      'SELECT id, name, slug FROM languages WHERE id IN (?) AND enabled = TRUE',
      [parsedLangIds]
    );

    if (validLangs.length !== parsedLangIds.length) {
      const err = new Error('One or more selected programming languages are invalid or unsupported.');
      err.statusCode = 400;
      throw err;
    }

    for (const l of validLangs) {
      const conf = getCompilerConfig(l.slug);
      if (!conf) {
        const err = new Error(`No Judge0 compiler configuration found for language '${l.name}'.`);
        err.statusCode = 400;
        throw err;
      }
      compilerList.push({
        language_id: l.id,
        compiler_id: conf.judge0Id,
        compiler_name: conf.compilerName || conf.displayName,
        language_name: l.name,
        language_slug: l.slug
      });
    }
  } else if (isTheory) {
    // Theory-only courses do not require compilers
    return [];
  } else {
    const err = new Error('At least one supported programming language or compiler must be selected for the program.');
    err.statusCode = 400;
    throw err;
  }

  return compilerList;
}

/**
 * Create a new program with independent levels and allowed compilers
 */
async function createProgramAdmin({
  name,
  description = '',
  icon = 'Code',
  image_url = null,
  course_type = 'CODING',
  status = 'ACTIVE',
  compilers = [],
  language_ids = [],
  level_count = 5,
  levels = []
}, adminId) {
  if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
    const err = new Error('Program name must be between 3 and 100 characters.');
    err.statusCode = 400;
    throw err;
  }

  const cleanName = name.trim();

  // Validate duplicate name (case-insensitive)
  const existing = await db.query(
    'SELECT id FROM programs WHERE LOWER(TRIM(name)) = LOWER(?)',
    [cleanName]
  );

  if (existing && existing.length > 0) {
    const err = new Error(`A program with the name '${cleanName}' already exists.`);
    err.statusCode = 409;
    throw err;
  }

  // Validate status
  const cleanStatus = status ? String(status).toUpperCase().trim() : 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE'].includes(cleanStatus)) {
    const err = new Error('Status must be either ACTIVE or INACTIVE.');
    err.statusCode = 400;
    throw err;
  }

  // Validate course type
  const cleanCourseType = String(course_type || 'CODING').toUpperCase().trim();
  if (!['CODING', 'THEORY'].includes(cleanCourseType)) {
    const err = new Error('Course type must be either CODING or THEORY.');
    err.statusCode = 400;
    throw err;
  }

  // Clean icon & image
  const cleanIcon = icon && typeof icon === 'string' && icon.trim() ? icon.trim() : 'Code';
  const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

  // Validate and resolve compilers
  const validatedCompilers = await resolveAndValidateCompilers({ compilers, language_ids, course_type: cleanCourseType });

  // Validate or generate levels
  const levelRecords = [];
  if (Array.isArray(levels) && levels.length > 0) {
    const seenNumbers = new Set();
    for (let i = 0; i < levels.length; i++) {
      const lvl = levels[i];
      const num = parseInt(lvl.level_number || i + 1, 10);
      if (isNaN(num) || num < 1) {
        const err = new Error(`Level #${i + 1} has an invalid level number.`);
        err.statusCode = 400;
        throw err;
      }
      if (seenNumbers.has(num)) {
        const err = new Error(`Duplicate level number ${num} in level list.`);
        err.statusCode = 400;
        throw err;
      }
      seenNumbers.add(num);

      const title = lvl.title ? String(lvl.title).trim() : `Level ${num}`;
      if (title.length < 2 || title.length > 100) {
        const err = new Error(`Level ${num} title must be between 2 and 100 characters.`);
        err.statusCode = 400;
        throw err;
      }

      levelRecords.push({
        level_number: num,
        title,
        description: lvl.description ? String(lvl.description).trim() : '',
        enabled: lvl.enabled !== false
      });
    }
  } else {
    // Generate from level_count
    const count = Math.min(20, Math.max(1, parseInt(level_count, 10) || 5));
    const defaultTitles = [
      'Fundamentals & Basic Syntax',
      'Variables, Operators & Expressions',
      'Control Flow & Decisions',
      'Loops & Iterative Logic',
      'Arrays & Sequence Structures',
      'Functions & Modular Design',
      'Pointers, References & Memory',
      'Object-Oriented Design & Classes',
      'Data Structures & STL Basics',
      'Recursion & Divide and Conquer',
      'Sorting, Searching & Two Pointers',
      'Stacks, Queues & Monotonic Sequences',
      'Trees, Heaps & Priority Queues',
      'Graphs, BFS & DFS Traversals',
      'Dynamic Programming & Greedy Strategies'
    ];
    for (let num = 1; num <= count; num++) {
      levelRecords.push({
        level_number: num,
        title: defaultTitles[num - 1] || `Level ${num}: Advanced Topics`,
        description: `Practice challenges and exercises for level ${num}.`,
        enabled: true
      });
    }
  }

  // Generate unique slug
  let baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'program';
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const slugConflict = await db.query('SELECT id FROM programs WHERE slug = ?', [slug]);
    if (!slugConflict || slugConflict.length === 0) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return await db.withTransaction(async (conn) => {
    const [ins] = await conn.query(
      'INSERT INTO programs (name, slug, description, icon, image_url, course_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cleanName, slug, description ? description.trim() : '', cleanIcon, cleanImageUrl, cleanCourseType, cleanStatus]
    );

    const programId = ins.insertId;

    // Insert compilers
    for (const c of validatedCompilers) {
      await conn.query(
        'INSERT INTO program_languages (program_id, language_id, compiler_id, compiler_name) VALUES (?, ?, ?, ?)',
        [programId, c.language_id, c.compiler_id, c.compiler_name]
      );
    }

    // Insert independent levels
    for (const lvl of levelRecords) {
      await conn.query(
        'INSERT INTO levels (program_id, level_number, title, description, enabled) VALUES (?, ?, ?, ?, ?)',
        [programId, lvl.level_number, lvl.title, lvl.description, lvl.enabled]
      );
    }

    const payload = {
      id: programId,
      name: cleanName,
      slug,
      description: description ? description.trim() : '',
      icon: cleanIcon,
      image_url: cleanImageUrl,
      course_type: cleanCourseType,
      status: cleanStatus,
      compilers: validatedCompilers,
      languages: validatedCompilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug })),
      levels: levelRecords
    };

    return {
      success: true,
      message: `Course '${cleanName}' created successfully with ${levelRecords.length} independent level(s) and ${validatedCompilers.length} compiler(s).`,
      program: payload,
      course: payload
    };
  });
}

/**
 * Update an existing program with independent level management and safe populated level checks
 */
async function updateProgramAdmin(programId, {
  name,
  description,
  icon,
  image_url,
  course_type,
  status,
  compilers,
  language_ids,
  level_count,
  levels,
  confirm_level_reduction = false
}, adminId) {
  const pId = parseInt(programId, 10);
  if (isNaN(pId) || pId < 1) {
    const err = new Error('Invalid program ID.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.query('SELECT * FROM programs WHERE id = ?', [pId]);
  if (!existing || existing.length === 0) {
    const err = new Error('Program not found.');
    err.statusCode = 404;
    throw err;
  }

  const currentProgram = existing[0];
  let newName = currentProgram.name;
  let newDescription = currentProgram.description;
  let newIcon = currentProgram.icon || 'Code';
  let newStatus = currentProgram.status;
  let newCourseType = currentProgram.course_type || 'CODING';
  let newImageUrl = currentProgram.image_url || null;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
      const err = new Error('Program name must be between 3 and 100 characters.');
      err.statusCode = 400;
      throw err;
    }
    const cleanName = name.trim();
    if (cleanName.toLowerCase() !== currentProgram.name.toLowerCase()) {
      const nameConflict = await db.query(
        'SELECT id FROM programs WHERE LOWER(TRIM(name)) = LOWER(?) AND id != ?',
        [cleanName, pId]
      );
      if (nameConflict && nameConflict.length > 0) {
        const err = new Error(`A program with the name '${cleanName}' already exists.`);
        err.statusCode = 409;
        throw err;
      }
    }
    newName = cleanName;
  }

  if (description !== undefined) {
    newDescription = typeof description === 'string' ? description.trim() : '';
  }

  if (icon !== undefined) {
    newIcon = typeof icon === 'string' && icon.trim() ? icon.trim() : 'Code';
  }

  if (course_type !== undefined) {
    const cleanCourseType = String(course_type).toUpperCase().trim();
    if (!['CODING', 'THEORY'].includes(cleanCourseType)) {
      const err = new Error('Course type must be either CODING or THEORY.');
      err.statusCode = 400;
      throw err;
    }
    newCourseType = cleanCourseType;
  }

  if (image_url !== undefined) {
    newImageUrl = typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;
  }

  if (status !== undefined) {
    const cleanStatus = String(status).toUpperCase().trim();
    if (!['ACTIVE', 'INACTIVE'].includes(cleanStatus)) {
      const err = new Error('Status must be either ACTIVE or INACTIVE.');
      err.statusCode = 400;
      throw err;
    }
    newStatus = cleanStatus;
  }

  // Validate compilers if provided
  let validatedCompilers = null;
  if (compilers !== undefined || language_ids !== undefined) {
    validatedCompilers = await resolveAndValidateCompilers({ compilers, language_ids, course_type: newCourseType });
  }

  // Handle Level updates safely
  let levelUpdatePlan = null;
  if (levels !== undefined || level_count !== undefined) {
    const currentLevelsWithQuestions = await db.query(`
      SELECT
        lvl.id,
        lvl.level_number,
        lvl.title,
        COUNT(q.id) AS question_count
      FROM levels lvl
      LEFT JOIN questions q ON lvl.id = q.level_id
      WHERE lvl.program_id = ?
      GROUP BY lvl.id, lvl.level_number, lvl.title
    `, [pId]);

    const newLevelList = [];
    if (Array.isArray(levels) && levels.length > 0) {
      const seenNumbers = new Set();
      for (let i = 0; i < levels.length; i++) {
        const lvl = levels[i];
        const num = parseInt(lvl.level_number || i + 1, 10);
        if (isNaN(num) || num < 1) {
          const err = new Error(`Level #${i + 1} has an invalid level number.`);
          err.statusCode = 400;
          throw err;
        }
        if (seenNumbers.has(num)) {
          const err = new Error(`Duplicate level number ${num} in level list.`);
          err.statusCode = 400;
          throw err;
        }
        seenNumbers.add(num);

        const title = lvl.title ? String(lvl.title).trim() : `Level ${num}`;
        if (title.length < 2 || title.length > 100) {
          const err = new Error(`Level ${num} title must be between 2 and 100 characters.`);
          err.statusCode = 400;
          throw err;
        }

        newLevelList.push({
          id: lvl.id ? parseInt(lvl.id, 10) : null,
          level_number: num,
          title,
          description: lvl.description ? String(lvl.description).trim() : '',
          enabled: lvl.enabled !== false
        });
      }
    } else if (level_count !== undefined) {
      const count = Math.min(20, Math.max(1, parseInt(level_count, 10) || 5));
      for (let num = 1; num <= count; num++) {
        const existingLvl = currentLevelsWithQuestions.find(l => l.level_number === num);
        newLevelList.push({
          id: existingLvl?.id || null,
          level_number: num,
          title: existingLvl?.title || `Level ${num}`,
          description: '',
          enabled: true
        });
      }
    }

    // Identify levels that would be deleted
    const newLevelIds = new Set(newLevelList.map(l => l.id).filter(Boolean));
    const levelsToDelete = currentLevelsWithQuestions.filter(
      cur => !newLevelIds.has(cur.id) && !newLevelList.some(nl => nl.level_number === cur.level_number)
    );

    // CRITICAL: Changing a program's level count later must not silently delete levels that already contain questions!
    const populatedToDelete = levelsToDelete.filter(l => parseInt(l.question_count, 10) > 0);
    if (populatedToDelete.length > 0 && !confirm_level_reduction) {
      const summary = populatedToDelete.map(l => `Level ${l.level_number} ("${l.title}", ${l.question_count} questions)`).join(', ');
      const err = new Error(
        `Cannot remove populated levels without explicit confirmation. Populated level(s): ${summary}. Please confirm level reduction or reassign questions before proceeding.`
      );
      err.statusCode = 400;
      err.code = 'POPULATED_LEVEL_REDUCTION';
      err.populatedLevels = populatedToDelete;
      throw err;
    }

    levelUpdatePlan = {
      newLevelList,
      levelsToDelete
    };
  }

  return await db.withTransaction(async (conn) => {
    await conn.query(
      'UPDATE programs SET name = ?, description = ?, icon = ?, image_url = ?, course_type = ?, status = ? WHERE id = ?',
      [newName, newDescription, newIcon, newImageUrl, newCourseType, newStatus, pId]
    );

    if (validatedCompilers !== null) {
      await conn.query('DELETE FROM program_languages WHERE program_id = ?', [pId]);
      for (const c of validatedCompilers) {
        await conn.query(
          'INSERT INTO program_languages (program_id, language_id, compiler_id, compiler_name) VALUES (?, ?, ?, ?)',
          [pId, c.language_id, c.compiler_id, c.compiler_name]
        );
      }
    }

    if (levelUpdatePlan) {
      // Handle deleted levels safely
      for (const delLvl of levelUpdatePlan.levelsToDelete) {
        // Unlink questions rather than deleting them
        await conn.query('UPDATE questions SET level_id = 0 WHERE level_id = ?', [delLvl.id]).catch(() => {});
        await conn.query('DELETE FROM levels WHERE id = ?', [delLvl.id]);
      }

      // Sync updated and new levels
      for (const lvl of levelUpdatePlan.newLevelList) {
        if (lvl.id) {
          await conn.query(
            'UPDATE levels SET level_number = ?, title = ?, description = ?, enabled = ? WHERE id = ? AND program_id = ?',
            [lvl.level_number, lvl.title, lvl.description, lvl.enabled, lvl.id, pId]
          );
        } else {
          await conn.query(
            'INSERT INTO levels (program_id, level_number, title, description, enabled) VALUES (?, ?, ?, ?, ?)',
            [pId, lvl.level_number, lvl.title, lvl.description, lvl.enabled]
          );
        }
      }
    }

    const finalCompilers = validatedCompilers || await db.query(`
      SELECT
        pl.compiler_id,
        pl.compiler_name,
        l.id AS language_id,
        l.name AS language_name,
        l.slug AS language_slug
      FROM program_languages pl
      JOIN languages l ON pl.language_id = l.id
      WHERE pl.program_id = ?
    `, [pId]);

    const payload = {
      id: pId,
      name: newName,
      description: newDescription,
      icon: newIcon,
      image_url: newImageUrl,
      course_type: newCourseType,
      status: newStatus,
      compilers: finalCompilers,
      languages: finalCompilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug }))
    };

    return {
      success: true,
      message: `Course '${newName}' updated successfully.`,
      program: payload,
      course: payload
    };
  });
}

/**
 * Delete a program safely
 * Preserves all questions and submissions by disassociating them.
 */
async function deleteProgramAdmin(programId, adminId) {
  const pId = parseInt(programId, 10);
  if (isNaN(pId) || pId < 1) {
    const err = new Error('Invalid program ID.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.query('SELECT id, name FROM programs WHERE id = ?', [pId]);
  if (!existing || existing.length === 0) {
    const err = new Error('Program not found.');
    err.statusCode = 404;
    throw err;
  }

  await db.withTransaction(async (conn) => {
    // Unlink program_id on questions so questions are NEVER lost
    await conn.query('UPDATE questions SET program_id = NULL WHERE program_id = ?', [pId]);
    await conn.query('UPDATE levels SET program_id = NULL WHERE program_id = ?', [pId]);
    await conn.query('DELETE FROM programs WHERE id = ?', [pId]);
  });

  return {
    success: true,
    message: `Program '${existing[0].name}' deleted successfully. Associated questions remain preserved in the system.`
  };
}

/**
 * Program Level Sub-resources: List levels for a program
 */
async function getProgramLevelsAdmin(programId) {
  const pId = parseInt(programId, 10);
  if (isNaN(pId) || pId < 1) {
    const err = new Error('Invalid program ID.');
    err.statusCode = 400;
    throw err;
  }

  const levels = await db.query(`
    SELECT
      lvl.id,
      lvl.program_id,
      lvl.level_number,
      lvl.title,
      lvl.description,
      lvl.enabled,
      COUNT(DISTINCT q.id) AS total_questions,
      COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS active_questions,
      COUNT(DISTINCT CASE WHEN q.status = 'REMOVED' THEN q.id END) AS removed_questions
    FROM levels lvl
    LEFT JOIN questions q ON lvl.id = q.level_id
    WHERE lvl.program_id = ?
    GROUP BY lvl.id, lvl.program_id, lvl.level_number, lvl.title, lvl.description, lvl.enabled
    ORDER BY lvl.level_number ASC
  `, [pId]);

  return levels.map(l => ({
    id: l.id,
    programId: l.program_id,
    levelNumber: l.level_number,
    title: l.title,
    description: l.description,
    enabled: Boolean(l.enabled),
    totalQuestions: parseInt(l.total_questions, 10),
    activeQuestions: parseInt(l.active_questions, 10),
    removedQuestions: parseInt(l.removed_questions, 10),
    isEmpty: parseInt(l.total_questions, 10) === 0
  }));
}

/**
 * Program Level Sub-resources: Create an independent level in a program
 */
async function createProgramLevelAdmin(programId, { level_number, title, description = '', enabled = true }) {
  const pId = parseInt(programId, 10);
  if (isNaN(pId) || pId < 1) {
    const err = new Error('Invalid program ID.');
    err.statusCode = 400;
    throw err;
  }

  const [progRows] = await db.query('SELECT id, name FROM programs WHERE id = ?', [pId]);
  if (!progRows || progRows.length === 0) {
    const err = new Error('Program not found.');
    err.statusCode = 404;
    throw err;
  }

  let finalNumber = parseInt(level_number, 10);
  if (isNaN(finalNumber) || finalNumber < 1) {
    const [maxRes] = await db.query('SELECT MAX(level_number) AS max_num FROM levels WHERE program_id = ?', [pId]);
    finalNumber = (maxRes[0]?.max_num || 0) + 1;
  }

  const cleanTitle = title ? String(title).trim() : `Level ${finalNumber}`;
  if (cleanTitle.length < 2 || cleanTitle.length > 100) {
    const err = new Error('Level title must be between 2 and 100 characters.');
    err.statusCode = 400;
    throw err;
  }

  const [existing] = await db.query(
    'SELECT id FROM levels WHERE program_id = ? AND level_number = ?',
    [pId, finalNumber]
  );
  if (existing && existing.length > 0) {
    const err = new Error(`Level number ${finalNumber} already exists in this program.`);
    err.statusCode = 409;
    throw err;
  }

  const [res] = await db.query(
    'INSERT INTO levels (program_id, level_number, title, description, enabled) VALUES (?, ?, ?, ?, ?)',
    [pId, finalNumber, cleanTitle, description ? String(description).trim() : '', Boolean(enabled)]
  );

  return {
    success: true,
    message: `Level ${finalNumber} created successfully in program '${progRows[0].name}'.`,
    level: {
      id: res.insertId,
      programId: pId,
      levelNumber: finalNumber,
      title: cleanTitle,
      description: description ? String(description).trim() : '',
      enabled: Boolean(enabled)
    }
  };
}

/**
 * Program Level Sub-resources: Update a level in a program
 */
async function updateProgramLevelAdmin(programId, levelId, { level_number, title, description, enabled }) {
  const pId = parseInt(programId, 10);
  const lId = parseInt(levelId, 10);

  const [current] = await db.query('SELECT * FROM levels WHERE id = ? AND program_id = ?', [lId, pId]);
  if (!current || current.length === 0) {
    const err = new Error('Level not found in the specified program.');
    err.statusCode = 404;
    throw err;
  }

  const cur = current[0];
  let newNum = cur.level_number;
  if (level_number !== undefined) {
    const num = parseInt(level_number, 10);
    if (isNaN(num) || num < 1) {
      const err = new Error('Invalid level number.');
      err.statusCode = 400;
      throw err;
    }
    if (num !== cur.level_number) {
      const [conflict] = await db.query('SELECT id FROM levels WHERE program_id = ? AND level_number = ? AND id != ?', [pId, num, lId]);
      if (conflict && conflict.length > 0) {
        const err = new Error(`Level number ${num} is already used in this program.`);
        err.statusCode = 409;
        throw err;
      }
      newNum = num;
    }
  }

  let newTitle = cur.title;
  if (title !== undefined) {
    const clean = String(title).trim();
    if (clean.length < 2 || clean.length > 100) {
      const err = new Error('Level title must be between 2 and 100 characters.');
      err.statusCode = 400;
      throw err;
    }
    newTitle = clean;
  }

  let newDesc = cur.description;
  if (description !== undefined) {
    newDesc = typeof description === 'string' ? description.trim() : '';
  }

  let newEnabled = cur.enabled;
  if (enabled !== undefined) {
    newEnabled = Boolean(enabled);
  }

  await db.query(
    'UPDATE levels SET level_number = ?, title = ?, description = ?, enabled = ? WHERE id = ?',
    [newNum, newTitle, newDesc, newEnabled, lId]
  );

  return {
    success: true,
    message: `Level ${newNum} updated successfully.`,
    level: {
      id: lId,
      programId: pId,
      levelNumber: newNum,
      title: newTitle,
      description: newDesc,
      enabled: Boolean(newEnabled)
    }
  };
}

/**
 * Program Level Sub-resources: Delete a level with populated question safeguard
 */
async function deleteProgramLevelAdmin(programId, levelId, { force = false } = {}) {
  const pId = parseInt(programId, 10);
  const lId = parseInt(levelId, 10);

  const [current] = await db.query('SELECT * FROM levels WHERE id = ? AND program_id = ?', [lId, pId]);
  if (!current || current.length === 0) {
    const err = new Error('Level not found in the specified program.');
    err.statusCode = 404;
    throw err;
  }

  const [qCountRes] = await db.query('SELECT COUNT(*) AS total FROM questions WHERE level_id = ?', [lId]);
  const questionCount = parseInt(qCountRes[0]?.total || 0, 10);

  if (questionCount > 0 && !force) {
    const err = new Error(`Cannot delete Level ${current[0].level_number} ("${current[0].title}") because it contains ${questionCount} question(s). Reassign questions or confirm force deletion.`);
    err.statusCode = 400;
    err.code = 'POPULATED_LEVEL_DELETION';
    err.questionCount = questionCount;
    throw err;
  }

  await db.withTransaction(async (conn) => {
    if (questionCount > 0) {
      await conn.query('UPDATE questions SET level_id = 0 WHERE level_id = ?', [lId]).catch(() => {});
    }
    await conn.query('DELETE FROM levels WHERE id = ?', [lId]);
  });

  return {
    success: true,
    message: `Level ${current[0].level_number} deleted successfully.`
  };
}

module.exports = {
  getAdminOverview,
  getReportedQuestions,
  getAdminQuestionDetails,
  getQuestionsAdmin,
  updateQuestionAdmin,
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
  deleteUserAdmin,
  getProgramsAdmin,
  getProgramByIdAdmin,
  createProgramAdmin,
  updateProgramAdmin,
  deleteProgramAdmin,
  getProgramLevelsAdmin,
  createProgramLevelAdmin,
  updateProgramLevelAdmin,
  deleteProgramLevelAdmin
};

