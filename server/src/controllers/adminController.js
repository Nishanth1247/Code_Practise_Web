const adminService = require('../services/adminService');

/**
 * Admin overview dashboard metrics
 */
async function getOverview(req, res, next) {
  try {
    const stats = await adminService.getAdminOverview();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List reported questions
 */
async function getReportedQuestions(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await adminService.getReportedQuestions({
      status: status || null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * View full question details including hidden test cases for admin review
 */
async function getQuestionDetails(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.getAdminQuestionDetails(parseInt(id, 10));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove question (set to REMOVED)
 */
async function removeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    const result = await adminService.removeQuestion({
      questionId: parseInt(id, 10),
      adminId,
      reason: reason || 'Question removed by administrator'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Restore question to ACTIVE status
 */
async function restoreQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    const result = await adminService.restoreQuestion({
      questionId: parseInt(id, 10),
      adminId,
      reason: reason || 'Question reviewed and restored to ACTIVE by administrator'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit logs for specific question
 */
async function getAuditHistory(req, res, next) {
  try {
    const { page = 1, limit = 30 } = req.query;
    const result = await adminService.getAuditHistory({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all levels for a language (Admin)
 */
async function getLanguageLevels(req, res, next) {
  try {
    const { languageId } = req.params;
    const result = await adminService.getLanguageLevelsAdmin(languageId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new level for a language
 */
async function createLevel(req, res, next) {
  try {
    const { languageId } = req.params;
    const { levelNumber, title, description, enabled } = req.body;
    const result = await adminService.createLanguageLevelAdmin(languageId, {
      levelNumber,
      title,
      description,
      enabled
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing level
 */
async function updateLevel(req, res, next) {
  try {
    const { levelId } = req.params;
    const { levelNumber, title, description } = req.body;
    const result = await adminService.updateLevelAdmin(parseInt(levelId, 10), {
      levelNumber,
      title,
      description
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle or set level status (enabled / disabled)
 */
async function toggleLevelStatus(req, res, next) {
  try {
    const { levelId } = req.params;
    const { enabled } = req.body;
    const result = await adminService.toggleLevelStatusAdmin(
      parseInt(levelId, 10),
      enabled !== undefined ? Boolean(enabled) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a level (only if safe with 0 questions)
 */
async function deleteLevel(req, res, next) {
  try {
    const { levelId } = req.params;
    const result = await adminService.deleteLevelAdmin(parseInt(levelId, 10));
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getReportedQuestions,
  getQuestionDetails,
  removeQuestion,
  restoreQuestion,
  getAuditHistory,
  getLanguageLevels,
  createLevel,
  updateLevel,
  toggleLevelStatus,
  deleteLevel
};

