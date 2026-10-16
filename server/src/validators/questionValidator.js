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
    .trim()
    .notEmpty()
    .withMessage('Input format description is required'),
  body('output_format')
    .trim()
    .notEmpty()
    .withMessage('Output format description is required'),
  body('constraints_text')
    .trim()
    .notEmpty()
    .withMessage('Constraints are required'),
  body('language_id')
    .isInt({ min: 1 })
    .withMessage('Valid language ID is required'),
  body('level_id')
    .isInt({ min: 1 })
    .withMessage('Valid level ID is required'),
  body('samples')
    .isArray({ min: 1 })
    .withMessage('At least one sample input/output pair is required'),
  body('samples.*.sample_input')
    .isString()
    .withMessage('Sample input must be a string'),
  body('samples.*.expected_output')
    .isString()
    .withMessage('Expected sample output must be a string'),
  body('test_cases')
    .isArray({ min: 1 })
    .withMessage('At least one test case is required'),
  body('test_cases.*.test_input')
    .isString()
    .withMessage('Test input must be a string'),
  body('test_cases.*.expected_output')
    .isString()
    .withMessage('Expected test output must be a string'),
  handleValidationErrors
];

const validateReport = [
  body('reason')
    .isIn([
      'Incorrect Statement',
      'Incorrect Sample Output',
      'Incorrect Test Cases',
      'Compilation Issue',
      'Other'
    ])
    .withMessage('Please select a valid report reason'),
  body('details')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Details must be under 1000 characters'),
  handleValidationErrors
];

module.exports = {
  validateCreateQuestion,
  validateReport
};
