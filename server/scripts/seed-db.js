const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');
const { getSslConfig } = require('../src/config/db');
const { LANGUAGE_CONFIG } = require('../src/config/judge0');

const cQuestions = require('./data/cQuestions');
const cppQuestions = require('./data/cppQuestions');
const javaQuestions = require('./data/javaQuestions');
const pythonQuestions = require('./data/pythonQuestions');

const SEED_QUESTIONS = [
  ...cQuestions,
  ...cppQuestions,
  ...javaQuestions,
  ...pythonQuestions
];

async function seedDatabase() {
  console.log('--- Starting Database Seeding ---');
  console.log(`[INFO] Loaded ${SEED_QUESTIONS.length} practice questions across 4 language tracks.`);

  let connection;
  try {
    const connConfig = {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      multipleStatements: true,
      timezone: '+00:00'
    };

    const ssl = getSslConfig();
    if (ssl) {
      connConfig.ssl = ssl;
    }

    connection = await mysql.createConnection(connConfig);

    console.log('[OK] Connected to database.');

    // 1. Run database/seed.sql (languages & levels)
    const seedSqlPath = path.resolve(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
      await connection.query(seedSql);
      console.log('[OK] Seeded languages and levels.');
    }

    // 2. Ensure default demo curator user exists
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('DemoUser123!', salt);

    const [existingCurator] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['system_curator']
    );

    let curatorId;
    if (existingCurator.length > 0) {
      curatorId = existingCurator[0].id;
    } else {
      const [insertCurator] = await connection.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['system_curator', 'curator@pracweb.dev', demoPasswordHash, 'USER']
      );
      curatorId = insertCurator.insertId;
      console.log(`[OK] Created demo curator user (ID: ${curatorId})`);
    }

    // 3. Seed practice questions with samples and test cases
    console.log('[INFO] Seeding practice questions...');
    let insertedCount = 0;
    let existingCount = 0;

    for (const q of SEED_QUESTIONS) {
      // Find language
      const [langRows] = await connection.query(
        'SELECT id FROM languages WHERE slug = ?',
        [q.languageSlug]
      );
      if (langRows.length === 0) continue;
      const langId = langRows[0].id;

      // Find level
      const [levelRows] = await connection.query(
        'SELECT id FROM levels WHERE language_id = ? AND level_number = ?',
        [langId, q.levelNumber]
      );
      if (levelRows.length === 0) continue;
      const levelId = levelRows[0].id;

      // Check if question already seeded
      const [existingQ] = await connection.query(
        'SELECT id FROM questions WHERE title = ? AND language_id = ? AND level_id = ?',
        [q.title, langId, levelId]
      );

      let questionId;
      if (existingQ.length > 0) {
        questionId = existingQ[0].id;
        existingCount++;
        // Update statement, input/output formats if changed
        await connection.query(`
          UPDATE questions
          SET statement = ?, input_format = ?, output_format = ?, constraints_text = ?, explanation = ?
          WHERE id = ?
        `, [q.statement, q.input_format, q.output_format, q.constraints_text, q.explanation, questionId]);

        // Ensure test cases exist
        const [tcRows] = await connection.query('SELECT COUNT(*) AS c FROM question_test_cases WHERE question_id = ?', [questionId]);
        if (tcRows[0].c === 0) {
          for (let i = 0; i < q.test_cases.length; i++) {
            const tc = q.test_cases[i];
            const isHidden = typeof tc.is_hidden === 'boolean' ? tc.is_hidden : true;
            await connection.query(`
              INSERT INTO question_test_cases (question_id, test_input, expected_output, is_hidden, display_order)
              VALUES (?, ?, ?, ?, ?)
            `, [questionId, tc.test_input, tc.expected_output, isHidden, i + 1]);
          }
        }

        // Ensure samples exist
        const [sRows] = await connection.query('SELECT COUNT(*) AS c FROM question_samples WHERE question_id = ?', [questionId]);
        if (sRows[0].c === 0) {
          for (let i = 0; i < q.samples.length; i++) {
            const s = q.samples[i];
            await connection.query(`
              INSERT INTO question_samples (question_id, sample_input, expected_output, explanation, display_order)
              VALUES (?, ?, ?, ?, ?)
            `, [questionId, s.sample_input, s.expected_output, s.explanation, i + 1]);
          }
        }

        // Ensure starter code exists
        if (q.starter_code) {
          const [scRows] = await connection.query('SELECT COUNT(*) AS c FROM starter_code_templates WHERE question_id = ?', [questionId]);
          if (scRows[0].c === 0) {
            await connection.query(`
              INSERT INTO starter_code_templates (question_id, language_slug, code)
              VALUES (?, ?, ?)
            `, [questionId, q.languageSlug, q.starter_code]);
          }
        }
      } else {
        const [insertQ] = await connection.query(`
          INSERT INTO questions (
            title, statement, input_format, output_format, constraints_text,
            explanation, language_id, level_id, contributor_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `, [
          q.title, q.statement, q.input_format, q.output_format, q.constraints_text,
          q.explanation, langId, levelId, curatorId
        ]);

        questionId = insertQ.insertId;
        insertedCount++;

        // Insert samples
        for (let i = 0; i < q.samples.length; i++) {
          const s = q.samples[i];
          await connection.query(`
            INSERT INTO question_samples (question_id, sample_input, expected_output, explanation, display_order)
            VALUES (?, ?, ?, ?, ?)
          `, [questionId, s.sample_input, s.expected_output, s.explanation, i + 1]);
        }

        // Insert test cases
        for (let i = 0; i < q.test_cases.length; i++) {
          const tc = q.test_cases[i];
          const isHidden = typeof tc.is_hidden === 'boolean' ? tc.is_hidden : true;
          await connection.query(`
            INSERT INTO question_test_cases (question_id, test_input, expected_output, is_hidden, display_order)
            VALUES (?, ?, ?, ?, ?)
          `, [questionId, tc.test_input, tc.expected_output, isHidden, i + 1]);
        }

        // Insert starter code template
        if (q.starter_code) {
          await connection.query(`
            INSERT INTO starter_code_templates (question_id, language_slug, code)
            VALUES (?, ?, ?)
          `, [questionId, q.languageSlug, q.starter_code]);
        }
      }
    }

    console.log(`[SUMMARY] ${insertedCount} new questions inserted, ${existingCount} existing questions updated/verified.`);
    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
