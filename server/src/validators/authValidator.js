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

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  // Explicitly ignore or reject any role tampering
  (req, res, next) => {
    if (req.body.role) {
      delete req.body.role; // Never allow client to specify role
    }
    handleValidationErrors(req, res, next);
  }
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateGoogleAuth = [
  (req, res, next) => {
    const token = req.body.credential || req.body.idToken || req.body.token;
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token (credential) is required.'
      });
    }
    // Prevent client tampering: strip any client-supplied role, status, or email
    delete req.body.role;
    delete req.body.status;
    delete req.body.email;
    delete req.body.user;
    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  handleValidationErrors
};
