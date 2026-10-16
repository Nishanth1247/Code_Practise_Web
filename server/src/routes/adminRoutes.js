const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes strictly enforce authentication and ADMIN role
router.use(authenticate, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/questions/reported', adminController.getReportedQuestions);
router.get('/questions/:id', adminController.getQuestionDetails);
router.patch('/questions/:id/remove', adminController.removeQuestion);
router.patch('/questions/:id/restore', adminController.restoreQuestion);
router.get('/questions/audit/all', adminController.getAuditHistory);

// User Management routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);

// Dynamic Level Management routes
router.get('/languages/:languageId/levels', adminController.getLanguageLevels);
router.post('/languages/:languageId/levels', adminController.createLevel);
router.patch('/levels/:levelId', adminController.updateLevel);
router.patch('/levels/:levelId/status', adminController.toggleLevelStatus);
router.delete('/levels/:levelId', adminController.deleteLevel);

module.exports = router;
