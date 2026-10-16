const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const levelController = require('../controllers/levelController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, languageController.getAllLanguages);
router.get('/:languageId', optionalAuth, languageController.getLanguageById);
router.get('/:languageId/levels', optionalAuth, levelController.getLevelsByLanguage);

module.exports = router;
