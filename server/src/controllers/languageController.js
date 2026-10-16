const db = require('../config/db');

/**
 * Get all available programming languages with statistics
 */
async function getAllLanguages(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;

    const languages = await db.query(`
      SELECT
        l.id,
        l.name,
        l.slug,
        l.enabled,
        COUNT(DISTINCT lvl.id) AS total_levels,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM languages l
      LEFT JOIN levels lvl ON l.id = lvl.language_id
      LEFT JOIN questions q ON l.id = q.language_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE l.enabled = TRUE
      GROUP BY l.id, l.name, l.slug, l.enabled
      ORDER BY l.id ASC
    `, [userId]);

    res.json({
      success: true,
      languages: languages.map(lang => ({
        id: lang.id,
        name: lang.name,
        slug: lang.slug,
        enabled: Boolean(lang.enabled),
        totalLevels: parseInt(lang.total_levels, 10),
        totalQuestions: parseInt(lang.total_questions, 10),
        solvedQuestions: parseInt(lang.solved_questions, 10),
        completionPercentage: lang.total_questions > 0
          ? Math.round((lang.solved_questions / lang.total_questions) * 100)
          : 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get language by ID or slug
 */
async function getLanguageById(req, res, next) {
  try {
    const { languageId } = req.params;
    const isNumeric = /^\d+$/.test(languageId);

    const languages = await db.query(
      isNumeric
        ? 'SELECT id, name, slug, enabled FROM languages WHERE id = ?'
        : 'SELECT id, name, slug, enabled FROM languages WHERE slug = ?',
      [languageId]
    );

    if (!languages || languages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Language not found'
      });
    }

    res.json({
      success: true,
      language: languages[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllLanguages,
  getLanguageById
};
