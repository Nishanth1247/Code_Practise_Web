const { OAuth2Client } = require('google-auth-library');
const config = require('../config/env');

let oauthClientInstance = null;

function getOAuthClient() {
  if (!oauthClientInstance) {
    const clientId = config.google.clientId;
    oauthClientInstance = new OAuth2Client(clientId);
  }
  return oauthClientInstance;
}

/**
 * For testing purposes: allows injecting a mock OAuth2Client
 */
function setOAuthClient(client) {
  oauthClientInstance = client;
}

/**
 * Verify Google ID Token (Credential) server-side
 * Ensures:
 * 1. Signature is valid and issued by Google
 * 2. Audience matches GOOGLE_CLIENT_ID
 * 3. Email is verified by Google
 *
 * @param {string} idToken - The Google ID Token from Google Identity Services
 * @returns {Promise<{email: string, name: string, sub: string, picture: string}>}
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    const error = new Error('Google ID token is required.');
    error.statusCode = 400;
    throw error;
  }

  const clientId = config.google.clientId;
  if (!clientId) {
    const error = new Error('Google OAuth is not configured on the server. Please configure GOOGLE_CLIENT_ID in server environment variables.');
    error.statusCode = 500;
    throw error;
  }

  const client = getOAuthClient();
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience: clientId,
    });
  } catch (err) {
    const error = new Error(`Google token verification failed: ${err.message}`);
    error.statusCode = 401;
    throw error;
  }

  const payload = ticket.getPayload();
  if (!payload) {
    const error = new Error('Invalid Google token: payload missing.');
    error.statusCode = 401;
    throw error;
  }

  // Double check audience matches configured client ID
  if (payload.aud !== clientId) {
    const error = new Error('Token audience does not match configured Google Client ID.');
    error.statusCode = 401;
    throw error;
  }

  // Require verified email
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    const error = new Error('Google account email is not verified by Google.');
    error.statusCode = 401;
    throw error;
  }

  const verifiedEmail = (payload.email || '').trim().toLowerCase();
  if (!verifiedEmail) {
    const error = new Error('Verified email address missing in Google token payload.');
    error.statusCode = 401;
    throw error;
  }

  return {
    email: verifiedEmail,
    name: payload.name || '',
    givenName: payload.given_name || '',
    picture: payload.picture || '',
    sub: payload.sub
  };
}

module.exports = {
  verifyGoogleIdToken,
  getOAuthClient,
  setOAuthClient
};
