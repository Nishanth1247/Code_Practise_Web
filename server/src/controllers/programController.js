const db = require('../config/db');

/**
 * List all active programs for learners
 */
async function getActivePrograms(req, res, next) {
  try {
    const programs = await db.query(`
      SELECT p.id, p.name, p.slug, p.description, p.created_at
      FROM programs p
      WHERE p.status = 'ACTIVE'
      ORDER BY p.name ASC
    `);

    const enriched = [];
    for (const prog of programs) {
      const langs = await db.query(`
        SELECT l.id, l.name, l.slug
        FROM program_languages pl
        JOIN languages l ON pl.language_id = l.id
        WHERE pl.program_id = ? AND l.enabled = TRUE
        ORDER BY l.name ASC
      `, [prog.id]);

      const langIds = langs.map(l => l.id);
      let questionCount = 0;
      let levelCount = 0;

      if (langIds.length > 0) {
        const lvlRes = await db.query(`
          SELECT COUNT(*) AS total FROM levels WHERE language_id IN (?) AND enabled = TRUE
        `, [langIds]);
        levelCount = parseInt(lvlRes[0]?.total || 0, 10);

        const qRes = await db.query(`
          SELECT COUNT(*) AS total FROM questions WHERE language_id IN (?) AND status = 'ACTIVE'
        `, [langIds]);
        questionCount = parseInt(qRes[0]?.total || 0, 10);
      }

      enriched.push({
        ...prog,
        languages: langs,
        levelCount,
        questionCount
      });
    }

    res.json({
      success: true,
      programs: enriched
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active program details with enabled languages and levels
 */
async function getProgramBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const isNumeric = /^\d+$/.test(slug);

    const programs = await db.query(
      isNumeric
        ? 'SELECT * FROM programs WHERE id = ? AND status = "ACTIVE"'
        : 'SELECT * FROM programs WHERE slug = ? AND status = "ACTIVE"',
      [slug]
    );

    if (!programs || programs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found or currently inactive.'
      });
    }

    const program = programs[0];
    const languages = await db.query(`
      SELECT l.id, l.name, l.slug
      FROM program_languages pl
      JOIN languages l ON pl.language_id = l.id
      WHERE pl.program_id = ? AND l.enabled = TRUE
      ORDER BY l.name ASC
    `, [program.id]);

    const langIds = languages.map(l => l.id);
    let levels = [];
    if (langIds.length > 0) {
      levels = await db.query(`
        SELECT lvl.id, lvl.language_id, lvl.level_number, lvl.title, lvl.description, l.name AS language_name, l.slug AS language_slug
        FROM levels lvl
        JOIN languages l ON lvl.language_id = l.id
        WHERE lvl.language_id IN (?) AND lvl.enabled = TRUE
        ORDER BY l.name ASC, lvl.level_number ASC
      `, [langIds]);
    }

    res.json({
      success: true,
      program,
      languages,
      levels
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivePrograms,
  getProgramBySlug
};
