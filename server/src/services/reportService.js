const db = require('../config/db');

const REPORT_THRESHOLD = 4;

const ALLOWED_REPORT_CATEGORIES = [
  'Incorrect expected output',
  'Incorrect or incomplete test cases',
  'Ambiguous problem statement',
  'Incorrect input/output format',
  'Missing constraints or edge cases',
  'Duplicate question',
  'Incorrect language or level',
  'Other',
  // Backward compatibility with legacy category values
  'Incorrect Statement',
  'Incorrect Sample Output',
  'Incorrect Test Cases',
  'Compilation Issue'
];

/**
 * Handle submitting a wrong-question report
 * Implements the atomic threshold check (4 distinct users -> PENDING_REVIEW)
 * and immediately finds an eligible replacement question for the reporting user.
 */
async function submitQuestionReport({ questionId, userId, reason, details = '' }) {
  const trimmedReason = reason ? String(reason).trim() : '';
  const trimmedDetails = details ? String(details).trim() : '';

  if (!trimmedReason || !ALLOWED_REPORT_CATEGORIES.includes(trimmedReason)) {
    const err = new Error('Please select a valid report issue category.');
    err.status = 400;
    throw err;
  }

  if (!trimmedDetails || trimmedDetails.length < 20) {
    const err = new Error('Detailed feedback explanation must be at least 20 characters.');
    err.status = 400;
    throw err;
  }

  if (trimmedDetails.length > 1000) {
    const err = new Error('Detailed feedback explanation cannot exceed 1000 characters.');
    err.status = 400;
    throw err;
  }

  return await db.withTransaction(async (conn) => {
    // 1. Fetch and lock question row
    const [questions] = await conn.query(
      'SELECT id, title, language_id, level_id, contributor_id, status FROM questions WHERE id = ? FOR UPDATE',
      [questionId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found');
      err.status = 404;
      throw err;
    }

    const question = questions[0];

    // 2. Validate author cannot report their own question
    if (question.contributor_id === userId) {
      const err = new Error('You cannot report a question that you contributed.');
      err.status = 400;
      throw err;
    }

    // 3. Check for existing report by this user
    const [existingReports] = await conn.query(
      'SELECT id FROM question_reports WHERE question_id = ? AND reporter_id = ?',
      [questionId, userId]
    );

    if (existingReports && existingReports.length > 0) {
      const err = new Error('You have already submitted a report for this question.');
      err.status = 409;
      throw err;
    }

    // 4. Insert report
    await conn.query(
      'INSERT INTO question_reports (question_id, reporter_id, reason, details) VALUES (?, ?, ?, ?)',
      [questionId, userId, reason, details]
    );

    // 5. Calculate distinct valid reporters for this question
    const [countRows] = await conn.query(
      'SELECT COUNT(DISTINCT reporter_id) AS distinct_count FROM question_reports WHERE question_id = ?',
      [questionId]
    );

    const distinctCount = parseInt(countRows[0].distinct_count, 10);
    let transitionedToPending = false;

    // 6. Check threshold: exactly >= 4 distinct reports atomically moves question to PENDING_REVIEW
    if (distinctCount >= REPORT_THRESHOLD && question.status === 'ACTIVE') {
      await conn.query(
        'UPDATE questions SET status = ? WHERE id = ?',
        ['PENDING_REVIEW', questionId]
      );

      await conn.query(
        'INSERT INTO question_audit_logs (question_id, admin_id, previous_status, new_status, reason) VALUES (?, NULL, ?, ?, ?)',
        [
          questionId,
          'ACTIVE',
          'PENDING_REVIEW',
          `Automated transition: ${distinctCount} distinct community reports reached (threshold: ${REPORT_THRESHOLD})`
        ]
      );

      transitionedToPending = true;
    }

    // 7. Find eligible replacement question for the reporter:
    // - Same language_id and level_id
    // - status = 'ACTIVE'
    // - id != current questionId
    // - id NOT in questions reported by this user
    const [replacementRows] = await conn.query(
      `SELECT q.id, q.title
       FROM questions q
       WHERE q.language_id = ?
         AND q.level_id = ?
         AND q.status = 'ACTIVE'
         AND q.id != ?
         AND q.id NOT IN (
           SELECT qr.question_id FROM question_reports qr WHERE qr.reporter_id = ?
         )
       ORDER BY q.id ASC
       LIMIT 1`,
      [question.language_id, question.level_id, questionId, userId]
    );

    const replacement = replacementRows.length > 0 ? replacementRows[0] : null;

    return {
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep our question library accurate.',
      distinctReportCount: distinctCount,
      transitionedToPending,
      currentQuestionStatus: transitionedToPending ? 'PENDING_REVIEW' : question.status,
      replacementQuestion: replacement,
      noReplacementAvailable: !replacement,
      fallbackMessage: !replacement
        ? 'No additional practice questions are currently available in this level. Please check back later or explore other levels.'
        : null
    };
  });
}

/**
 * Handle useful vote toggle/cast
 */
async function toggleUsefulVote({ questionId, userId }) {
  return await db.withTransaction(async (conn) => {
    // Check if question exists and is active
    const [questions] = await conn.query(
      'SELECT id, status FROM questions WHERE id = ?',
      [questionId]
    );

    if (!questions || questions.length === 0) {
      const err = new Error('Question not found');
      err.status = 404;
      throw err;
    }

    // Check if user already voted
    const [existingVotes] = await conn.query(
      'SELECT id FROM question_votes WHERE question_id = ? AND user_id = ?',
      [questionId, userId]
    );

    let hasVoted = false;
    if (existingVotes && existingVotes.length > 0) {
      // Remove vote (toggle off)
      await conn.query(
        'DELETE FROM question_votes WHERE question_id = ? AND user_id = ?',
        [questionId, userId]
      );
      hasVoted = false;
    } else {
      // Add vote
      await conn.query(
        'INSERT INTO question_votes (question_id, user_id, vote_type) VALUES (?, ?, ?)',
        [questionId, userId, 'USEFUL']
      );
      hasVoted = true;
    }

    // Get updated total vote count
    const [countRows] = await conn.query(
      'SELECT COUNT(*) AS total_votes FROM question_votes WHERE question_id = ?',
      [questionId]
    );

    return {
      success: true,
      hasVoted,
      totalVotes: parseInt(countRows[0].total_votes, 10)
    };
  });
}

module.exports = {
  submitQuestionReport,
  toggleUsefulVote,
  REPORT_THRESHOLD
};
