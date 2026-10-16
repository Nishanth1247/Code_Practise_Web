const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/config/db');
const googleAuthService = require('../src/services/googleAuthService');

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  const mOAuth2Client = {
    verifyIdToken: jest.fn()
  };
  return {
    OAuth2Client: jest.fn(() => mOAuth2Client)
  };
});

describe('Google Sign-In Authentication Tests (POST /api/auth/google)', () => {
  const originalClientId = config.google.clientId;
  const TEST_CLIENT_ID = 'test-client-id-12345.apps.googleusercontent.com';

  let mockClient;

  beforeEach(() => {
    config.google.clientId = TEST_CLIENT_ID;
    mockClient = googleAuthService.getOAuthClient();
    jest.clearAllMocks();
  });

  afterAll(() => {
    config.google.clientId = originalClientId;
  });

  // ---------------------------------------------------------------------------
  // 1. Token Verification Unit & Validation Checks
  // ---------------------------------------------------------------------------
  test('Rejects request without Google credential/ID token with 400', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Google ID token (credential) is required');
  });

  test('Fails with 500 when GOOGLE_CLIENT_ID is not configured on server', async () => {
    config.google.clientId = '';

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'some_google_id_token' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Google OAuth is not configured on the server');
  });

  test('Fails with 401 when Google verifyIdToken rejects invalid token signature', async () => {
    mockClient.verifyIdToken.mockRejectedValue(new Error('Invalid token signature'));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'invalid_signature_token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Google token verification failed');
  });

  test('Fails with 401 when token audience (aud) does not match GOOGLE_CLIENT_ID', async () => {
    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: 'mismatched-client-id.apps.googleusercontent.com',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'Test Coder'
      })
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_looking_token_wrong_aud' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Token audience does not match configured Google Client ID');
  });

  test('Fails with 401 when Google account email is not verified', async () => {
    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: 'unverified@gmail.com',
        email_verified: false, // Unverified email
        name: 'Unverified Coder'
      })
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'token_unverified_email' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Google account email is not verified');
  });

  // ---------------------------------------------------------------------------
  // 2. Account Creation & Linking Tests
  // ---------------------------------------------------------------------------
  test('Creates a new user with default USER role when Google user signs in for first time', async () => {
    const googleEmail = 'new_google_coder@example.com';
    const googleName = 'Alex Mercer';

    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: googleEmail,
        email_verified: true,
        name: googleName,
        sub: 'google-sub-id-998877'
      })
    });

    // Mock DB queries: no user found initially, then insert
    db.query = jest.fn().mockImplementation(async (sql, params) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return []; // No existing user
      }
      if (sql.includes('SELECT id FROM users WHERE username = ?')) {
        return []; // Username available
      }
      if (sql.includes('INSERT INTO users')) {
        return { insertId: 77 };
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_google_id_token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(77);
    expect(res.body.user.email).toBe(googleEmail);
    expect(res.body.user.role).toBe('USER'); // Strictly USER role
  });

  test('Links safely to existing account when email already exists, preserving existing role', async () => {
    const existingEmail = 'existing_admin@example.com';

    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: existingEmail,
        email_verified: true,
        name: 'Existing Admin'
      })
    });

    const existingAdminUser = {
      id: 2,
      username: 'admin',
      email: existingEmail,
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    db.query = jest.fn().mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return [existingAdminUser];
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_google_id_token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.id).toBe(2);
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.role).toBe('ADMIN'); // Admin role safely preserved
  });

  test('Rejects Google sign-in with 403 when existing user account has status DELETED', async () => {
    const deletedEmail = 'deleted_coder@example.com';

    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: deletedEmail,
        email_verified: true,
        name: 'Deleted User'
      })
    });

    const deletedUser = {
      id: 88,
      username: 'former_coder',
      email: deletedEmail,
      role: 'USER',
      status: 'DELETED',
      created_at: new Date().toISOString()
    };

    db.query = jest.fn().mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return [deletedUser];
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_google_id_token' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('deleted or deactivated');
  });

  test('Never trusts client-supplied role or email overrides in request body', async () => {
    const genuineGoogleEmail = 'honest_user@gmail.com';

    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: genuineGoogleEmail,
        email_verified: true,
        name: 'Honest User'
      })
    });

    let insertedRole = null;
    let insertedEmail = null;

    db.query = jest.fn().mockImplementation(async (sql, params) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return [];
      }
      if (sql.includes('SELECT id FROM users WHERE username = ?')) {
        return [];
      }
      if (sql.includes('INSERT INTO users')) {
        // sql: INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)
        insertedEmail = params[1];
        insertedRole = params[3];
        return { insertId: 99 };
      }
      return [];
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({
        credential: 'valid_token',
        email: 'tampered_admin@example.com', // Attempted tampering
        role: 'ADMIN' // Attempted privilege escalation
      });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('USER'); // Must be USER, not ADMIN
    expect(res.body.user.email).toBe(genuineGoogleEmail); // Must be verified email from token
    expect(insertedRole).toBe('USER');
    expect(insertedEmail).toBe(genuineGoogleEmail);
  });

  // ---------------------------------------------------------------------------
  // 3. JWT Access Test
  // ---------------------------------------------------------------------------
  test('Issued JWT token grants access to authenticated endpoints like GET /api/auth/me', async () => {
    const verifiedUser = {
      id: 101,
      username: 'jwt_verified_user',
      email: 'jwt_user@example.com',
      role: 'USER',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: TEST_CLIENT_ID,
        email: verifiedUser.email,
        email_verified: true,
        name: verifiedUser.username
      })
    });

    db.query = jest.fn().mockImplementation(async (sql) => {
      if (sql.includes('FROM users WHERE email = ?')) {
        return [verifiedUser];
      }
      if (sql.includes('FROM users WHERE id = ?')) {
        return [verifiedUser];
      }
      if (sql.includes('COUNT(DISTINCT question_id)')) {
        return [{ total_solved: 5 }];
      }
      if (sql.includes('COUNT(*) AS total_submissions')) {
        return [{ total_submissions: 10 }];
      }
      if (sql.includes('COUNT(*) AS total_contributed')) {
        return [{ total_contributed: 2 }];
      }
      return [];
    });

    // 1. Perform Google Login
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_token' });

    expect(loginRes.status).toBe(200);
    const jwtToken = loginRes.body.token;

    // 2. Use JWT token on GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.id).toBe(101);
    expect(meRes.body.user.email).toBe(verifiedUser.email);
    expect(meRes.body.user.stats.totalSolved).toBe(5);
  });
});
