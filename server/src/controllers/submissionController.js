const db = require('../config/db');
const codeExecutionService = require('../services/codeExecutionService');
const { LANGUAGE_CONFIG, getCompilerConfig } = require('../config/judge0');

/**
 * RUN CODE: Test against visible sample cases only.
 * Returns stdout/stderr for user feedback. Does not record solved status.
 */
async function runCode(req, res, next) {
  try {
    const questionId = req.body.questionId || req.body.question_id;
    let language = req.body.language || req.body.language_slug;
    const sourceCode = req.body.sourceCode || req.body.source_code || req.body.code;
    const compilerId = req.body.compilerId !== undefined ? req.body.compilerId : req.body.compiler_id;

    if (!language && compilerId) {
      const foundLang = Object.entries(LANGUAGE_CONFIG).find(([_, conf]) => conf.judge0Id === parseInt(compilerId, 10));
      if (foundLang) language = foundLang[0];
    }

    if (!questionId || !language || !sourceCode) {
      return res.status(400).json({
        success: false,
        error: 'questionId, language, and sourceCode are required.'
      });
    }

    if (sourceCode.length > 65536) {
      return res.status(400).json({
        success: false,
        error: 'Source code exceeds maximum limit of 64KB.'
      });
    }

    // Verify question exists and is ACTIVE
    const questionRows = await db.query(
      'SELECT id, status, program_id, language_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!questionRows || questionRows.length === 0 || questionRows[0].status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        error: 'This question is currently unavailable for practice or test runs.'
      });
    }

    const question = questionRows[0];
    const langSlug = String(language).toLowerCase().trim();
    const langConfig = LANGUAGE_CONFIG[langSlug];

    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported programming language or compiler runtime: '${language}'.`
      });
    }

    // Verify compiler ID if provided by client against expected real Judge0 runtime ID
    if (req.body.compilerId !== undefined && req.body.compilerId !== null) {
      const providedCompilerId = parseInt(req.body.compilerId, 10);
      if (providedCompilerId !== langConfig.judge0Id) {
        return res.status(400).json({
          success: false,
          error: `Compiler mismatch: The selected language requires compiler '${langConfig.displayName}' (Judge0 ID ${langConfig.judge0Id}). Received ID ${providedCompilerId}.`
        });
      }
    }

    // Enforce Course Allowed Compilers
    if (question.program_id) {
      const progRows = await db.query('SELECT name, course_type FROM programs WHERE id = ?', [question.program_id]);
      const prog = progRows && progRows[0];
      if (prog && prog.course_type === 'THEORY') {
        return res.status(400).json({
          success: false,
          error: `The course '${prog.name}' is a theory course and does not support code execution.`
        });
      }

      const allowedLangs = await db.query(`
        SELECT pl.compiler_id, l.slug
        FROM program_languages pl
        JOIN languages l ON pl.language_id = l.id
        WHERE pl.program_id = ? AND LOWER(l.slug) = LOWER(?)
      `, [question.program_id, langSlug]);

      if (!allowedLangs || allowedLangs.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Compiler '${langConfig.displayName}' is not permitted for questions in this program track / course.`
        });
      }
    }

    // Enforce Per-Question Language Restriction if configured
    if (question.language_id) {
      const [qLang] = await db.query('SELECT slug FROM languages WHERE id = ?', [question.language_id]);
      if (qLang && qLang.slug.toLowerCase() !== langSlug) {
        return res.status(400).json({
          success: false,
          error: `This question only accepts solutions written in ${qLang.slug.toUpperCase()}.`
        });
      }
    }

    // Fetch question and sample cases
    const samples = await db.query(
      'SELECT sample_input, expected_output, explanation FROM question_samples WHERE question_id = ? ORDER BY display_order ASC',
      [questionId]
    );

    if (!samples || samples.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No sample test cases configured for this question.'
      });
    }

    try {
      const runResult = await codeExecutionService.runSamples({
        sourceCode,
        languageSlug: language,
        samples
      });

      res.json({
        success: true,
        ...runResult
      });
    } catch (execError) {
      if (execError.isProviderUnavailable) {
        return res.status(503).json({
          success: false,
          error: execError.message,
          providerOffline: true
        });
      }
      throw execError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * SUBMIT SOLUTION: Evaluate against all private/hidden test cases.
 * Records submission in database and awards solved status if all pass.
 * NEVER returns hidden test data in response!
 */
async function submitSolution(req, res, next) {
  try {
    const userId = req.user.id;
    const questionId = req.body.questionId || req.body.question_id;
    let language = req.body.language || req.body.language_slug;
    const sourceCode = req.body.sourceCode || req.body.source_code || req.body.code;
    const compilerId = req.body.compilerId !== undefined ? req.body.compilerId : req.body.compiler_id;

    if (!language && compilerId) {
      const foundLang = Object.entries(LANGUAGE_CONFIG).find(([_, conf]) => conf.judge0Id === parseInt(compilerId, 10));
      if (foundLang) language = foundLang[0];
    }

    if (!questionId || !language || !sourceCode) {
      return res.status(400).json({
        success: false,
        error: 'questionId, language, and sourceCode are required.'
      });
    }

    if (sourceCode.length > 65536) {
      return res.status(400).json({
        success: false,
        error: 'Source code exceeds maximum limit of 64KB.'
      });
    }

    // Verify question exists and is ACTIVE
    const questionRows = await db.query(
      'SELECT id, status, program_id, language_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!questionRows || questionRows.length === 0 || questionRows[0].status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        error: 'This question is currently unavailable for submissions.'
      });
    }

    const question = questionRows[0];
    const langSlug = String(language).toLowerCase().trim();
    const langConfig = LANGUAGE_CONFIG[langSlug];

    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported programming language or compiler runtime: '${language}'.`
      });
    }

    // Verify compiler ID if provided by client against expected real Judge0 runtime ID
    if (req.body.compilerId !== undefined && req.body.compilerId !== null) {
      const providedCompilerId = parseInt(req.body.compilerId, 10);
      if (providedCompilerId !== langConfig.judge0Id) {
        return res.status(400).json({
          success: false,
          error: `Compiler mismatch: The selected language requires compiler '${langConfig.displayName}' (Judge0 ID ${langConfig.judge0Id}). Received ID ${providedCompilerId}.`
        });
      }
    }

    // Enforce Course Allowed Compilers
    if (question.program_id) {
      const progRows = await db.query('SELECT name, course_type FROM programs WHERE id = ?', [question.program_id]);
      const prog = progRows && progRows[0];
      if (prog && prog.course_type === 'THEORY') {
        return res.status(400).json({
          success: false,
          error: `The course '${prog.name}' is a theory course and does not support code execution.`
        });
      }

      const allowedLangs = await db.query(`
        SELECT pl.compiler_id, l.slug
        FROM program_languages pl
        JOIN languages l ON pl.language_id = l.id
        WHERE pl.program_id = ? AND LOWER(l.slug) = LOWER(?)
      `, [question.program_id, langSlug]);

      if (!allowedLangs || allowedLangs.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Compiler '${langConfig.displayName}' is not permitted for questions in this program track / course.`
        });
      }
    }

    // Enforce Per-Question Language Restriction if configured
    if (question.language_id) {
      const [qLang] = await db.query('SELECT slug FROM languages WHERE id = ?', [question.language_id]);
      if (qLang && qLang.slug.toLowerCase() !== langSlug) {
        return res.status(400).json({
          success: false,
          error: `This question only accepts solutions written in ${qLang.slug.toUpperCase()}.`
        });
      }
    }

    // Fetch hidden and public test cases from question_test_cases
    const testCases = await db.query(
      'SELECT id, test_input, expected_output, is_hidden FROM question_test_cases WHERE question_id = ? ORDER BY display_order ASC',
      [questionId]
    );

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'This question does not have test cases configured for evaluation.'
      });
    }

    let evalResult;
    try {
      evalResult = await codeExecutionService.evaluateSubmission({
        sourceCode,
        languageSlug: language,
        testCases
      });
    } catch (execError) {
      if (execError.isProviderUnavailable) {
        return res.status(503).json({
          success: false,
          error: execError.message,
          providerOffline: true
        });
      }
      throw execError;
    }

    // Atomic transaction to record submission and solved record
    const { submissionId, isFirstSolve } = await db.withTransaction(async (conn) => {
      const [insertSub] = await conn.query(`
        INSERT INTO submissions (
          user_id, question_id, language, source_code, verdict,
          passed_test_count, total_test_count, execution_time, memory_used, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        questionId,
        language,
        sourceCode,
        evalResult.verdict,
        evalResult.passedCount,
        evalResult.totalCount,
        evalResult.executionTime,
        evalResult.memoryUsed,
        evalResult.compileOutput || null
      ]);

      const subId = insertSub.insertId;
      let solvedNow = false;

      // Only award solved status if ALL tests pass
      if (evalResult.verdict === 'Accepted') {
        const [existingSolve] = await conn.query(
          'SELECT id FROM user_solved_questions WHERE user_id = ? AND question_id = ?',
          [userId, questionId]
        );

        if (!existingSolve || existingSolve.length === 0) {
          await conn.query(
            'INSERT INTO user_solved_questions (user_id, question_id) VALUES (?, ?)',
            [userId, questionId]
          );
          solvedNow = true;
        }
      }

      return { submissionId: subId, isFirstSolve: solvedNow };
    });

    res.json({
      success: true,
      submissionId,
      verdict: evalResult.verdict,
      passedCount: evalResult.passedCount,
      totalCount: evalResult.totalCount,
      executionTime: evalResult.executionTime,
      memoryUsed: evalResult.memoryUsed,
      compileOutput: evalResult.compileOutput,
      failedTestCaseNumber: evalResult.failedTestCaseNumber,
      isSolved: evalResult.verdict === 'Accepted',
      isFirstSolve
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get submissions for authenticated user
 */
async function getMySubmissions(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = ['s.user_id = ?'];
    const params = [userId];

    if (questionId) {
      conditions.push('s.question_id = ?');
      params.push(questionId);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const submissions = await db.query(`
      SELECT
        s.id,
        s.question_id,
        s.language,
        s.verdict,
        s.passed_test_count,
        s.total_test_count,
        s.execution_time,
        s.memory_used,
        s.created_at,
        q.title AS question_title,
        l.name AS language_name
      FROM submissions s
      JOIN questions q ON s.question_id = q.id
      JOIN languages l ON q.language_id = l.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit, 10), offset]);

    const countRows = await db.query(`
      SELECT COUNT(*) AS total
      FROM submissions s
      ${whereClause}
    `, params);

    const total = (countRows && countRows.length > 0) ? countRows[0].total : 0;

    res.json({
      success: true,
      submissions,
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
 * Get specific submission details
 */
async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const rows = await db.query(`
      SELECT
        s.*,
        q.title AS question_title,
        u.username
      FROM submissions s
      JOIN questions q ON s.question_id = q.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const submission = rows[0];

    // Only owner or admin can view
    if (submission.user_id !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this submission record.'
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  runCode,
  submitSolution,
  getMySubmissions,
  getSubmissionById
};
