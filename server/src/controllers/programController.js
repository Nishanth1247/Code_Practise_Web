const db = require('../config/db');

/**
 * List all active programs for learners with allowed compilers and progress
 */
async function getActivePrograms(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const programs = await db.query(`
      SELECT p.id, p.name, p.slug, p.description, p.icon, p.created_at
      FROM programs p
      WHERE p.status = 'ACTIVE'
      ORDER BY p.id ASC
    `);

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
        WHERE pl.program_id = ? AND l.enabled = TRUE
        ORDER BY l.name ASC
      `, [prog.id]);

      const lvlRes = await db.query(`
        SELECT COUNT(*) AS total
        FROM levels
        WHERE program_id = ? AND enabled = TRUE
      `, [prog.id]);
      const levelCount = parseInt(lvlRes[0]?.total || 0, 10);

      const qRes = await db.query(`
        SELECT
          COUNT(DISTINCT q.id) AS total,
          COUNT(DISTINCT CASE WHEN usq.id IS NOT NULL THEN q.id END) AS solved
        FROM questions q
        LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
        WHERE q.program_id = ? AND q.status = 'ACTIVE'
      `, [userId, prog.id]);
      const questionCount = parseInt(qRes[0]?.total || 0, 10);
      const solvedCount = parseInt(qRes[0]?.solved || 0, 10);

      enriched.push({
        ...prog,
        icon: prog.icon || 'Code',
        compilers,
        languages: compilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug })),
        levelCount,
        questionCount,
        solvedCount,
        progressPercentage: questionCount > 0 ? Math.round((solvedCount / questionCount) * 100) : 0
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
 * Get active program details with compilers, independent levels, and user progress
 */
async function getProgramBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const userId = req.user ? req.user.id : null;
    const isNumeric = /^\d+$/.test(slug);

    const programs = await db.query(
      isNumeric
        ? "SELECT id, name, slug, description, icon, status, created_at FROM programs WHERE id = ? AND status = 'ACTIVE'"
        : "SELECT id, name, slug, description, icon, status, created_at FROM programs WHERE slug = ? AND status = 'ACTIVE'",
      [slug]
    );

    if (!programs || programs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found or currently inactive.'
      });
    }

    const program = programs[0];

    // Fetch allowed compilers
    const compilers = await db.query(`
      SELECT
        pl.compiler_id,
        pl.compiler_name,
        l.id AS language_id,
        l.name AS language_name,
        l.slug AS language_slug
      FROM program_languages pl
      JOIN languages l ON pl.language_id = l.id
      WHERE pl.program_id = ? AND l.enabled = TRUE
      ORDER BY l.name ASC
    `, [program.id]);

    // Fetch independent levels for this program
    const levels = await db.query(`
      SELECT
        lvl.id,
        lvl.program_id,
        lvl.level_number,
        lvl.title,
        lvl.description,
        lvl.enabled,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' THEN q.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN q.status = 'ACTIVE' AND usq.id IS NOT NULL THEN q.id END) AS solved_questions
      FROM levels lvl
      LEFT JOIN questions q ON lvl.id = q.level_id AND q.status = 'ACTIVE'
      LEFT JOIN user_solved_questions usq ON q.id = usq.question_id AND usq.user_id = ?
      WHERE lvl.program_id = ? AND lvl.enabled = TRUE
      GROUP BY lvl.id, lvl.program_id, lvl.level_number, lvl.title, lvl.description, lvl.enabled
      ORDER BY lvl.level_number ASC
    `, [userId, program.id]);

    const formattedLevels = levels.map(lvl => {
      const total = parseInt(lvl.total_questions, 10);
      const solved = parseInt(lvl.solved_questions, 10);
      return {
        id: lvl.id,
        programId: lvl.program_id,
        levelNumber: lvl.level_number,
        title: lvl.title,
        description: lvl.description,
        enabled: Boolean(lvl.enabled),
        totalQuestions: total,
        solvedQuestions: solved,
        completionPercentage: total > 0 ? Math.round((solved / total) * 100) : 0
      };
    });

    const totalQuestions = formattedLevels.reduce((acc, l) => acc + l.totalQuestions, 0);
    const totalSolved = formattedLevels.reduce((acc, l) => acc + l.solvedQuestions, 0);

    res.json({
      success: true,
      program: {
        ...program,
        icon: program.icon || 'Code'
      },
      compilers,
      languages: compilers.map(c => ({ id: c.language_id, name: c.language_name, slug: c.language_slug })),
      levels: formattedLevels,
      userProgress: {
        totalQuestions,
        solvedQuestions: totalSolved,
        completionPercentage: totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error in getProgramBySlug:', error);
    next(error);
  }
}

module.exports = {
  getActivePrograms,
  getProgramBySlug
};
