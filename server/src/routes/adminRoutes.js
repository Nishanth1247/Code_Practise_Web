const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes strictly enforce authentication and ADMIN role
router.use(authenticate, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/questions', adminController.getQuestions);
router.get('/questions/reported', adminController.getReportedQuestions);
router.get('/questions/:id', adminController.getQuestionDetails);
router.patch('/questions/:id', adminController.updateQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.patch('/questions/:id/remove', adminController.removeQuestion);
router.patch('/questions/:id/restore', adminController.restoreQuestion);
router.get('/questions/audit/all', adminController.getAuditHistory);

// Program Management routes
router.get('/programs', adminController.getPrograms);
router.post('/programs', adminController.createProgram);
router.get('/programs/:id', adminController.getProgramById);
router.patch('/programs/:id', adminController.updateProgram);
router.put('/programs/:id', adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

// User Management routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Dynamic Level Management routes
router.get('/languages/:languageId/levels', adminController.getLanguageLevels);
router.post('/languages/:languageId/levels', adminController.createLevel);
router.patch('/levels/:levelId', adminController.updateLevel);
router.patch('/levels/:levelId/status', adminController.toggleLevelStatus);
router.delete('/levels/:levelId', adminController.deleteLevel);

module.exports = router;
