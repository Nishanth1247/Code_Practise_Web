const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');

router.get('/overview', authenticate, progressController.getOverview);
router.get('/languages/:languageId', authenticate, progressController.getLanguageProgress);

module.exports = router;
