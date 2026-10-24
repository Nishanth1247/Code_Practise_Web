const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

const validateCreateQuestion = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('statement')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Problem statement must be at least 20 characters'),
  body('input_format')
    .optional({ nullable: true })
    .trim(),
  body('output_format')
    .optional({ nullable: true })
    .trim(),
  body('constraints_text')
    .optional({ nullable: true })
    .trim(),
  body('language_ids')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Language IDs must be an array'),
  body('language_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each language ID must be a positive integer'),
  body('language_id')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === undefined || val === '') return true;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) throw new Error('Valid language ID is required');
      return true;
    }),
  body('level_id')
    .isInt({ min: 1 })
    .withMessage('Valid level ID is required'),
  body('compiler_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Valid compiler ID is required'),
  body('samples')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Samples must be an array'),
  body('samples.*.sample_input')
    .optional({ nullable: true })
    .isString()
    .withMessage('Sample input must be a string'),
  body('samples.*.expected_output')
    .optional({ nullable: true })
    .isString()
    .withMessage('Expected sample output must be a string'),
  body('test_cases')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Test cases must be an array'),
  body('test_cases.*.test_input')
    .optional({ nullable: true })
    .isString()
    .withMessage('Test input must be a string'),
  body('test_cases.*.expected_output')
    .optional({ nullable: true })
    .isString()
    .withMessage('Expected test output must be a string'),
  handleValidationErrors
];

const ALLOWED_REPORT_CATEGORIES = [
  'Incorrect expected output',
  'Incorrect or incomplete test cases',
  'Ambiguous problem statement',
  'Incorrect input/output format',
  'Missing constraints or edge cases',
  'Duplicate question',
  'Incorrect language or level',
  'Other',
  // Backward compatibility with legacy category values
  'Incorrect Statement',
  'Incorrect Sample Output',
  'Incorrect Test Cases',
  'Compilation Issue'
];

const validateReport = [
  body('reason')
    .trim()
    .isIn(ALLOWED_REPORT_CATEGORIES)
    .withMessage('Please select a valid report issue category'),
  body('details')
    .trim()
    .notEmpty()
    .withMessage('Feedback explanation is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Detailed feedback must be between 20 and 1000 characters'),
  handleValidationErrors
];

module.exports = {
  validateCreateQuestion,
  validateReport
};
