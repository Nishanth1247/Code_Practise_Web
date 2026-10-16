const db = require('../config/db');

/**
 * Get user progress overview across all languages
 */
async function getOverview(req, res, next) {
  try {
    const userId = req.user.id;

    // Total solved questions
    const solvedCount = await db.query(
      'SELECT COUNT(DISTINCT question_id) AS total FROM user_solved_questions WHERE user_id = ?',
      [userId]
    );

    // Total active questions on platform
    const totalQuestions = await db.query(
      "SELECT COUNT(*) AS total FROM questions WHERE status = 'ACTIVE'"
    );

    // Language progress
    const languageProgress = await db.query(`
      SELECT
        l.id,
        l.name,
        l.slug,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM languages l
      LEFT JOIN questions q ON l.id = q.language_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE l.enabled = TRUE
      GROUP BY l.id, l.name, l.slug
      ORDER BY l.id ASC
    `, [userId]);

    // Recent submissions
    const recentSubmissions = await db.query(`
      SELECT
        s.id,
        s.language,
        s.verdict,
        s.created_at,
        q.title AS question_title
      FROM submissions s
      JOIN questions q ON s.question_id = q.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 5
    `, [userId]);

    const totalSolvedVal = parseInt(solvedCount[0]?.total || 0, 10);
    const totalAvailVal = parseInt(totalQuestions[0]?.total || 0, 10);

    res.json({
      success: true,
      stats: {
        totalSolved: totalSolvedVal,
        totalAvailable: totalAvailVal,
        overallPercentage: totalAvailVal > 0
          ? Math.round((totalSolvedVal / totalAvailVal) * 100)
          : 0,
        byLanguage: languageProgress.map(l => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          total: parseInt(l.total_questions, 10),
          solved: parseInt(l.solved_questions, 10),
          percentage: l.total_questions > 0 ? Math.round((l.solved_questions / l.total_questions) * 100) : 0
        })),
        recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get progress for a specific language
 */
async function getLanguageProgress(req, res, next) {
  try {
    const { languageId } = req.params;
    const userId = req.user.id;

    const langRows = await db.query(
      'SELECT id, name, slug FROM languages WHERE id = ?',
      [languageId]
    );

    if (!langRows || langRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Language not found'
      });
    }

    const language = langRows[0];

    const levels = await db.query(`
      SELECT
        lvl.id,
        lvl.level_number,
        lvl.title,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM levels lvl
      LEFT JOIN questions q ON lvl.id = q.level_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE lvl.language_id = ?
      GROUP BY lvl.id, lvl.level_number, lvl.title
      ORDER BY lvl.level_number ASC
    `, [userId, languageId]);

    res.json({
      success: true,
      language,
      levels: levels.map(l => ({
        id: l.id,
        levelNumber: l.level_number,
        title: l.title,
        total: parseInt(l.total_questions, 10),
        solved: parseInt(l.solved_questions, 10),
        percentage: l.total_questions > 0 ? Math.round((l.solved_questions / l.total_questions) * 100) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getLanguageProgress
};
