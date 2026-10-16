const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const config = require('../config/env');
const { verifyGoogleIdToken } = require('../services/googleAuthService');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Register a new user
 * Default role is strictly 'USER'
 */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existing = await db.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing && existing.length > 0) {
      if (existing.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken.'
        });
      }
      if (existing.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({
          success: false,
          error: 'Email is already registered.'
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Strictly assign USER role
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, 'USER']
    );

    const newUser = {
      id: result.insertId,
      username,
      email,
      role: 'USER'
    };

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in an existing user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const users = await db.query(
      'SELECT id, username, email, password_hash, role, status, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Reject deleted or deactivated accounts
    if (user.status === 'DELETED') {
      return res.status(403).json({
        success: false,
        error: 'This account has been deleted or deactivated. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sign in or sign up with Google ID token
 */
async function googleLogin(req, res, next) {
  try {
    const rawToken = req.body.credential || req.body.idToken || req.body.token;
    if (!rawToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token (credential) is required.'
      });
    }

    // Verify token with Google's official library
    const googleUser = await verifyGoogleIdToken(rawToken);
    const normalizedEmail = googleUser.email.toLowerCase();

    // Check if user already exists
    const users = await db.query(
      'SELECT id, username, email, role, status, created_at FROM users WHERE email = ?',
      [normalizedEmail]
    );

    let user;

    if (users && users.length > 0) {
      user = users[0];

      // Reject deleted or deactivated accounts
      if (user.status === 'DELETED') {
        return res.status(403).json({
          success: false,
          error: 'This account has been deleted or deactivated. Please contact support.'
        });
      }

      // Existing account safely linked to Google login (role preserved)
    } else {
      // Create new user account with default 'USER' role
      let baseUsername = (googleUser.name || normalizedEmail.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase()
        .slice(0, 20);

      if (baseUsername.length < 3) {
        baseUsername = `coder_${baseUsername}`;
      }

      // Ensure username uniqueness
      let candidateUsername = baseUsername;
      const existingUsernames = await db.query(
        'SELECT id FROM users WHERE username = ?',
        [candidateUsername]
      );

      if (existingUsernames && existingUsernames.length > 0) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        candidateUsername = `${baseUsername.slice(0, 15)}_${randomSuffix}`;
      }

      // Generate secure random unmatchable password hash for password_hash NOT NULL constraint
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const result = await db.query(
        'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        [candidateUsername, normalizedEmail, passwordHash, 'USER', 'ACTIVE']
      );

      user = {
        id: result.insertId,
        username: candidateUsername,
        email: normalizedEmail,
        role: 'USER',
        created_at: new Date().toISOString()
      };
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Google authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

/**
 * Get current authenticated user profile and platform stats
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch user stats
    const solvedRows = await db.query(
      'SELECT COUNT(DISTINCT question_id) AS total_solved FROM user_solved_questions WHERE user_id = ?',
      [userId]
    );

    const submissionsRows = await db.query(
      'SELECT COUNT(*) AS total_submissions FROM submissions WHERE user_id = ?',
      [userId]
    );

    const contributionsRows = await db.query(
      'SELECT COUNT(*) AS total_contributed FROM questions WHERE contributor_id = ?',
      [userId]
    );

    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.created_at,
        stats: {
          totalSolved: parseInt(solvedRows[0]?.total_solved || 0, 10),
          totalSubmissions: parseInt(submissionsRows[0]?.total_submissions || 0, 10),
          totalContributed: parseInt(contributionsRows[0]?.total_contributed || 0, 10)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  getMe
};
