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

// Course & Program Management routes
router.get('/programs', adminController.getPrograms);
router.post('/programs', adminController.createProgram);
router.get('/programs/:id', adminController.getProgramById);
router.patch('/programs/:id', adminController.updateProgram);
router.put('/programs/:id', adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

router.get('/courses', adminController.getPrograms);
router.post('/courses', adminController.createProgram);
router.get('/courses/:id', adminController.getProgramById);
router.patch('/courses/:id', adminController.updateProgram);
router.put('/courses/:id', adminController.updateProgram);
router.delete('/courses/:id', adminController.deleteProgram);

// Course / Program Level Management routes
router.get('/programs/:programId/levels', adminController.getProgramLevels);
router.post('/programs/:programId/levels', adminController.createProgramLevel);
router.patch('/programs/:programId/levels/:levelId', adminController.updateProgramLevel);
router.put('/programs/:programId/levels/:levelId', adminController.updateProgramLevel);
router.delete('/programs/:programId/levels/:levelId', adminController.deleteProgramLevel);

router.get('/courses/:programId/levels', adminController.getProgramLevels);
router.post('/courses/:programId/levels', adminController.createProgramLevel);
router.patch('/courses/:programId/levels/:levelId', adminController.updateProgramLevel);
router.put('/courses/:programId/levels/:levelId', adminController.updateProgramLevel);
router.delete('/courses/:programId/levels/:levelId', adminController.deleteProgramLevel);

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
