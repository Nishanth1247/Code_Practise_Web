const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

router.get('/', programController.getActivePrograms);
router.get('/:slug', programController.getProgramBySlug);

module.exports = router;
