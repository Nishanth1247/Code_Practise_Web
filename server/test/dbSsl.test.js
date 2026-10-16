const fs = require('fs');
const path = require('path');
const config = require('../src/config/env');
const db = require('../src/config/db');

describe('Database SSL Configuration (Aiven / Production Support)', () => {
  const originalSsl = config.db.ssl;
  const originalSslCa = config.db.sslCa;

  afterEach(() => {
    config.db.ssl = originalSsl;
    config.db.sslCa = originalSslCa;
  });

  test('should return undefined when SSL is disabled (local dev default)', () => {
    config.db.ssl = false;
    config.db.sslCa = '';

    const sslConfig = db.getSslConfig();
    expect(sslConfig).toBeUndefined();
  });

  test('should enable TLS with rejectUnauthorized: true when DB_SSL is true and no CA provided', () => {
    config.db.ssl = true;
    config.db.sslCa = '';

    const sslConfig = db.getSslConfig();
    expect(sslConfig).toBeDefined();
    expect(sslConfig.rejectUnauthorized).toBe(true);
    expect(sslConfig.ca).toBeUndefined();
  });

  test('should pass raw PEM certificate string as CA and enforce rejectUnauthorized: true', () => {
    config.db.ssl = true;
    const samplePem = '-----BEGIN CERTIFICATE-----\nMIIB...fake...cert\n-----END CERTIFICATE-----';
    config.db.sslCa = samplePem;

    const sslConfig = db.getSslConfig();
    expect(sslConfig).toBeDefined();
    expect(sslConfig.rejectUnauthorized).toBe(true);
    expect(sslConfig.ca).toBe(samplePem);
  });

  test('should unescape literal \\n in PEM certificate string', () => {
    config.db.ssl = true;
    const escapedPem = '-----BEGIN CERTIFICATE-----\\nMIIC...escaped...cert\\n-----END CERTIFICATE-----';
    config.db.sslCa = escapedPem;

    const sslConfig = db.getSslConfig();
    expect(sslConfig).toBeDefined();
    expect(sslConfig.rejectUnauthorized).toBe(true);
    expect(sslConfig.ca).toBe('-----BEGIN CERTIFICATE-----\nMIIC...escaped...cert\n-----END CERTIFICATE-----');
  });

  test('should read CA certificate from file path if it points to an existing file', () => {
    config.db.ssl = true;
    const tmpCertPath = path.resolve(__dirname, 'temp-test-ca.pem');
    const certContent = '-----BEGIN CERTIFICATE-----\nFILE_BASED_CERT_CONTENT\n-----END CERTIFICATE-----';
    fs.writeFileSync(tmpCertPath, certContent, 'utf8');

    try {
      config.db.sslCa = tmpCertPath;
      const sslConfig = db.getSslConfig();
      expect(sslConfig).toBeDefined();
      expect(sslConfig.rejectUnauthorized).toBe(true);
      expect(sslConfig.ca).toBe(certContent);
    } finally {
      if (fs.existsSync(tmpCertPath)) {
        fs.unlinkSync(tmpCertPath);
      }
    }
  });

  test('rejectUnauthorized must never be false under any circumstance', () => {
    config.db.ssl = true;
    config.db.sslCa = 'some-ca';

    const sslConfig = db.getSslConfig();
    expect(sslConfig.rejectUnauthorized).not.toBe(false);
    expect(sslConfig.rejectUnauthorized).toBe(true);
  });
});
