const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid or corrupt authentication token.'
      });
    }

    // Verify user exists and fetch current role & status
    const users = await db.query(
      'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
      [decoded.userId || decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    if (users[0].status === 'DELETED') {
      return res.status(401).json({
        success: false,
        error: 'User account has been deactivated or deleted.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Admin authorization middleware
 * Requires authenticate to run beforehand
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required.'
    });
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is present and valid, but does not reject request if absent
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const users = await db.query(
          'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
          [decoded.userId || decoded.id]
        );
        if (users && users.length > 0) {
          req.user = users[0];
        }
      } catch (e) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
};
