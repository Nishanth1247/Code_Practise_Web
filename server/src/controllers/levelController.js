const db = require('../config/db');

/**
 * Get all levels for a specific language with user progress
 */
async function getLevelsByLanguage(req, res, next) {
  try {
    const { languageId } = req.params;
    const userId = req.user ? req.user.id : null;

    const isNumeric = /^\d+$/.test(languageId);
    let langRows;
    if (isNumeric) {
      langRows = await db.query('SELECT id, name, slug FROM languages WHERE id = ?', [languageId]);
    } else {
      langRows = await db.query('SELECT id, name, slug FROM languages WHERE slug = ?', [languageId]);
    }

    if (!langRows || langRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Language not found'
      });
    }

    const language = langRows[0];

    // Fetch levels for this language (only enabled levels for non-admins)
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const levels = await db.query(`
      SELECT
        lvl.id,
        lvl.language_id,
        lvl.level_number,
        lvl.title,
        lvl.description,
        lvl.enabled,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_active_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM levels lvl
      LEFT JOIN questions q ON lvl.id = q.level_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE lvl.language_id = ? ${isAdmin ? '' : 'AND lvl.enabled = TRUE'}
      GROUP BY lvl.id, lvl.language_id, lvl.level_number, lvl.title, lvl.description, lvl.enabled
      ORDER BY lvl.level_number ASC
    `, [userId, language.id]);

    const formattedLevels = levels.map(lvl => {
      const total = parseInt(lvl.total_active_questions, 10);
      const solved = parseInt(lvl.solved_questions, 10);
      return {
        id: lvl.id,
        languageId: lvl.language_id,
        levelNumber: lvl.level_number,
        title: lvl.title,
        description: lvl.description,
        enabled: Boolean(lvl.enabled),
        totalQuestions: total,
        solvedQuestions: solved,
        completionPercentage: total > 0 ? Math.round((solved / total) * 100) : 0
      };
    });

    res.json({
      success: true,
      language,
      levels: formattedLevels
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get level details by level ID
 */
async function getLevelById(req, res, next) {
  try {
    const { levelId } = req.params;
    const userId = req.user ? req.user.id : null;

    const rows = await db.query(`
      SELECT
        lvl.*,
        p.name AS program_name,
        p.slug AS program_slug,
        p.icon AS program_icon,
        l.name AS language_name,
        l.slug AS language_slug,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM levels lvl
      LEFT JOIN programs p ON lvl.program_id = p.id
      LEFT JOIN languages l ON lvl.language_id = l.id
      LEFT JOIN questions q ON lvl.id = q.level_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE lvl.id = ?
      GROUP BY lvl.id, p.name, p.slug, p.icon, l.name, l.slug
    `, [userId, levelId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Level not found'
      });
    }

    res.json({
      success: true,
      level: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLevelsByLanguage,
  getLevelById
};
