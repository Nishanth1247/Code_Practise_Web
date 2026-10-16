const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiter');

// RUN CODE (can run with optional auth or auth)
router.post('/run', submissionLimiter, optionalAuth, submissionController.runCode);

// SUBMIT SOLUTION (requires authentication)
router.post('/submit', authenticate, submissionLimiter, submissionController.submitSolution);

// Get user's submission history
router.get('/mine', authenticate, submissionController.getMySubmissions);

// Get specific submission details
router.get('/:id', authenticate, submissionController.getSubmissionById);

module.exports = router;
