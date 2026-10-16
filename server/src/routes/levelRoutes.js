const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const questionController = require('../controllers/questionController');
const { optionalAuth } = require('../middleware/auth');

router.get('/:levelId', optionalAuth, levelController.getLevelById);
router.get('/:levelId/questions', optionalAuth, questionController.getQuestionsForLevel);

module.exports = router;
