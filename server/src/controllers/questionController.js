const db = require('../config/db');
const reportService = require('../services/reportService');

/**
 * Get active questions for a specific level with filters, search, sort, and pagination
 */
async function getQuestionsForLevel(req, res, next) {
  try {
    const { levelId } = req.params;
    const userId = req.user ? req.user.id : null;
    const {
      search = '',
      sort = 'newest',
      page = 1,
      limit = 15,
      includeReported = 'false'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = ["q.level_id = ?", "q.status = 'ACTIVE'"];
    const params = [levelId];

    // If authenticated and not explicitly requested, exclude questions reported by this user
    if (userId && includeReported !== 'true') {
      conditions.push('q.id NOT IN (SELECT qr.question_id FROM question_reports qr WHERE qr.reporter_id = ?)');
      params.push(userId);
    }

    if (search.trim()) {
      conditions.push('(q.title LIKE ? OR q.statement LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    let orderBy = 'q.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'q.created_at ASC';
    } else if (sort === 'popularity') {
      orderBy = 'useful_votes_count DESC, q.created_at DESC';
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Query questions
    const questions = await db.query(`
      SELECT
        q.id,
        q.title,
        q.statement,
        q.created_at,
        l.name AS language_name,
        l.slug AS language_slug,
        lvl.level_number,
        lvl.title AS level_title,
        u.username AS contributor_username,
        COUNT(DISTINCT qv.id) AS useful_votes_count,
        COUNT(DISTINCT qr.id) AS report_count,
        CASE WHEN usq.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_solved,
        CASE WHEN my_vote.id IS NOT NULL THEN TRUE ELSE FALSE END AS user_has_voted
      FROM questions q
      JOIN languages l ON q.language_id = l.id
      JOIN levels lvl ON q.level_id = lvl.id
      JOIN users u ON q.contributor_id = u.id
      LEFT JOIN question_votes qv ON q.id = qv.question_id
      LEFT JOIN question_reports qr ON q.id = qr.question_id
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      LEFT JOIN question_votes my_vote ON q.id = my_vote.question_id AND my_vote.user_id = ?
      ${whereClause}
      GROUP BY q.id, l.name, l.slug, lvl.level_number, lvl.title, u.username, usq.id, my_vote.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [userId, userId, ...params, parseInt(limit, 10), offset]);

    // Total count for pagination
    const countRows = await db.query(`
      SELECT COUNT(*) AS total
      FROM questions q
      ${whereClause}
    `, params);

    const total = (countRows && countRows.length > 0) ? countRows[0].total : 0;

    res.json({
      success: true,
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        // Short snippet for list view
        shortDescription: q.statement.length > 140 ? q.statement.slice(0, 140) + '...' : q.statement,
        createdAt: q.created_at,
        languageName: q.language_name,
        languageSlug: q.language_slug,
        levelNumber: q.level_number,
        levelTitle: q.level_title,
        contributor: q.contributor_username,
        usefulVotes: parseInt(q.useful_votes_count, 10),
        reportCount: parseInt(q.report_count, 10),
        isSolved: Boolean(q.is_solved),
        userHasVoted: Boolean(q.user_has_voted)
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get question details by ID for practicing / viewing
 * NEVER returns hidden test cases to users!
 */
async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;

    const questions = await db.query(`
      SELECT
        q.*,
        l.name AS language_name,
        l.slug AS language_slug,
        lvl.level_number,
        lvl.title AS level_title,
        u.username AS contributor_username,
        (SELECT COUNT(*) FROM question_votes WHERE question_id = q.id) AS useful_votes_count
      FROM questions q
      JOIN languages l ON q.language_id = l.id
      JOIN levels lvl ON q.level_id = lvl.id
      JOIN users u ON q.contributor_id = u.id
      WHERE q.id = ?
    `, [id]);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    const question = questions[0];

    // If question is not ACTIVE, only Admin or the Contributor can view it
    if (question.status !== 'ACTIVE') {
      const isAuthor = userId && userId === question.contributor_id;
      const isAdmin = userRole === 'ADMIN';
      if (!isAuthor && !isAdmin) {
        return res.status(404).json({
          success: false,
          error: 'This question is currently unavailable for practice.'
        });
      }
    }

    // Fetch visible sample cases only
    const samples = await db.query(`
      SELECT id, sample_input, expected_output, explanation, display_order
      FROM question_samples
      WHERE question_id = ?
      ORDER BY display_order ASC
    `, [id]);


    // Check user interaction status
    let userHasVoted = false;
    let userHasReported = false;
    let isSolved = false;

    if (userId) {
      const voteCheck = await db.query(
        'SELECT id FROM question_votes WHERE question_id = ? AND user_id = ?',
        [id, userId]
      );
      userHasVoted = Boolean(voteCheck && voteCheck.length > 0);

      const reportCheck = await db.query(
        'SELECT id, reason FROM question_reports WHERE question_id = ? AND reporter_id = ?',
        [id, userId]
      );
      userHasReported = Boolean(reportCheck && reportCheck.length > 0);

      const solvedCheck = await db.query(
        'SELECT id FROM user_solved_questions WHERE question_id = ? AND user_id = ?',
        [id, userId]
      );
      isSolved = Boolean(solvedCheck && solvedCheck.length > 0);
    }

    res.json({
      success: true,
      question: {
        id: question.id,
        title: question.title,
        statement: question.statement,
        inputFormat: question.input_format,
        outputFormat: question.output_format,
        constraintsText: question.constraints_text,
        explanation: question.explanation,
        languageId: question.language_id,
        languageName: question.language_name,
        languageSlug: question.language_slug,
        levelId: question.level_id,
        levelNumber: question.level_number,
        levelTitle: question.level_title,
        contributorId: question.contributor_id,
        contributor: question.contributor_username,
        status: question.status,
        usefulVotes: parseInt(question.useful_votes_count, 10),
        userHasVoted,
        userHasReported,
        isSolved,
        samples,
        starterCode: {}
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload / Contribute a new question
 * Saves immediately as ACTIVE after structural validation
 */
async function createQuestion(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      title,
      statement,
      input_format,
      output_format,
      constraints_text,
      explanation = '',
      language_id,
      level_id,
      samples,
      test_cases,
      starter_code = null
    } = req.body;

    // Verify language exists and is enabled
    const langRows = await db.query(
      'SELECT id, slug FROM languages WHERE id = ? AND enabled = TRUE',
      [language_id]
    );
    if (!langRows || langRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or disabled programming language selected.'
      });
    }

    // Verify level exists for that language
    const levelRows = await db.query(
      'SELECT id FROM levels WHERE id = ? AND language_id = ?',
      [level_id, language_id]
    );
    if (!levelRows || levelRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selected level does not belong to the selected programming language.'
      });
    }

    // Use transaction to insert question and all related samples, test cases, and starter code
    const createdQuestionId = await db.withTransaction(async (conn) => {
      const [insertRes] = await conn.query(`
        INSERT INTO questions (
          title, statement, input_format, output_format, constraints_text,
          explanation, language_id, level_id,
          contributor_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `, [
        title, statement, input_format, output_format, constraints_text,
        explanation, language_id, level_id,
        userId
      ]);

      const qId = insertRes.insertId;

      // Insert visible samples
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        await conn.query(`
          INSERT INTO question_samples (question_id, sample_input, expected_output, explanation, display_order)
          VALUES (?, ?, ?, ?, ?)
        `, [qId, s.sample_input || '', s.expected_output || '', s.explanation || '', i + 1]);
      }

      // Insert private/hidden test cases
      for (let i = 0; i < test_cases.length; i++) {
        const tc = test_cases[i];
        await conn.query(`
          INSERT INTO question_test_cases (question_id, test_input, expected_output, is_hidden, display_order)
          VALUES (?, ?, ?, ?, ?)
        `, [qId, tc.test_input || '', tc.expected_output || '', tc.is_hidden !== false, i + 1]);
      }

      // Insert starter code if provided
      if (starter_code && typeof starter_code === 'object') {
        for (const [langSlug, code] of Object.entries(starter_code)) {
          if (typeof code === 'string' && code.trim()) {
            await conn.query(`
              INSERT INTO starter_code_templates (question_id, language_slug, code)
              VALUES (?, ?, ?)
            `, [qId, langSlug, code]);
          }
        }
      }

      return qId;
    });

    res.status(201).json({
      success: true,
      message: 'Question contributed successfully and is now active in community practice!',
      questionId: createdQuestionId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get questions uploaded by the authenticated user
 */
async function getMyQuestions(req, res, next) {
  try {
    const userId = req.user.id;

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
        (SELECT COUNT(*) FROM question_votes WHERE question_id = q.id) AS useful_votes,
        (SELECT COUNT(DISTINCT reporter_id) FROM question_reports WHERE question_id = q.id) AS report_count,
        (SELECT COUNT(*) FROM submissions WHERE question_id = q.id) AS total_submissions,
        (SELECT COUNT(DISTINCT user_id) FROM user_solved_questions WHERE question_id = q.id) AS total_solves
      FROM questions q
      JOIN languages l ON q.language_id = l.id
      JOIN levels lvl ON q.level_id = lvl.id
      WHERE q.contributor_id = ?
      ORDER BY q.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark as useful / Toggle useful vote
 */
async function voteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await reportService.toggleUsefulVote({
      questionId: parseInt(id, 10),
      userId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Report a question as wrong
 * Evaluates the 4-threshold transition and finds immediate replacement question
 */
async function reportQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason, details } = req.body;

    const result = await reportService.submitQuestionReport({
      questionId: parseInt(id, 10),
      userId,
      reason,
      details
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQuestionsForLevel,
  getQuestionById,
  createQuestion,
  getMyQuestions,
  voteQuestion,
  reportQuestion
};
