const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { validateCreateQuestion, validateReport } = require('../validators/questionValidator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadLimiter, reportLimiter } = require('../middleware/rateLimiter');

// Questions contributed by current user
router.get('/mine', authenticate, questionController.getMyQuestions);

// Single question details (public or auth)
router.get('/:id', optionalAuth, questionController.getQuestionById);

// Contribute new question (auth required)
router.post('/', authenticate, uploadLimiter, validateCreateQuestion, questionController.createQuestion);

// Mark as useful / Toggle vote (auth required)
router.post('/:id/vote', authenticate, questionController.voteQuestion);

// Report wrong question (auth required)
router.post('/:id/report', authenticate, reportLimiter, validateReport, questionController.reportQuestion);

module.exports = router;
