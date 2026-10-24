const db = require('../config/db');
const config = require('../config/env');

/**
 * Executes safe, idempotent schema migrations on the target MySQL database.
 * Compatible with existing production data, managed Aiven MySQL, and local databases.
 *
 * @param {object} connection - MySQL2 connection or pool to run queries on
 * @param {string} databaseName - Name of the active database (e.g., config.db.database or 'defaultdb')
 * @returns {Promise<{success: boolean, changes: string[], database: string}>}
 */
async function runIdempotentMigrations(connection, databaseName) {
  const dbName = databaseName || config.db.database;
  const changes = [];

  // ---------------------------------------------------------------------------
  // 1. Ensure `users.status` column exists and defaults to 'ACTIVE'
  // ---------------------------------------------------------------------------
  const [userStatusCols] = await connection.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
  `, [dbName]);

  if (userStatusCols.length === 0) {
    // Column missing: safely add with default 'ACTIVE'
    await connection.query(`
      ALTER TABLE \`users\`
      ADD COLUMN \`status\` ENUM('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE' AFTER \`role\`;
    `);
    changes.push("Added 'status' column to 'users' table (ENUM('ACTIVE', 'DELETED') DEFAULT 'ACTIVE').");
  } else {
    // Column exists: verify ENUM allows both 'ACTIVE' and 'DELETED'
    const colType = String(userStatusCols[0].COLUMN_TYPE || '').toLowerCase();
    if (!colType.includes("'active'") || !colType.includes("'deleted'")) {
      await connection.query(`
        ALTER TABLE \`users\`
        MODIFY COLUMN \`status\` ENUM('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE';
      `);
      changes.push("Updated 'users.status' column to ENUM('ACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE'.");
    }
  }

  // Ensure index on `users.status` exists
  const [userStatusIndexes] = await connection.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_status'
  `, [dbName]);

  if (userStatusIndexes.length === 0) {
    await connection.query(`
      ALTER TABLE \`users\` ADD INDEX \`idx_users_status\` (\`status\`);
    `);
    changes.push("Added index 'idx_users_status' to 'users' table.");
  }

  // Backfill: ensure any NULL or empty status in existing users is set to 'ACTIVE'
  const [userUpdateRes] = await connection.query(`
    UPDATE \`users\` SET \`status\` = 'ACTIVE' WHERE \`status\` IS NULL OR \`status\` = '';
  `);
  if (userUpdateRes && userUpdateRes.changedRows > 0) {
    changes.push(`Backfilled ${userUpdateRes.changedRows} existing user record(s) to 'ACTIVE' status.`);
  }

  // ---------------------------------------------------------------------------
  // 2. Ensure `questions.status` column exists and includes 'REMOVED'
  // ---------------------------------------------------------------------------
  const [questionStatusCols] = await connection.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'status'
  `, [dbName]);

  if (questionStatusCols.length === 0) {
    // Column missing: safely add with default 'ACTIVE'
    await connection.query(`
      ALTER TABLE \`questions\`
      ADD COLUMN \`status\` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL DEFAULT 'ACTIVE' AFTER \`contributor_id\`;
    `);
    changes.push("Added 'status' column to 'questions' table (ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED')).");
  } else {
    // Column exists: verify ENUM includes 'REMOVED'
    const colType = String(questionStatusCols[0].COLUMN_TYPE || '').toLowerCase();
    if (!colType.includes("'removed'")) {
      await connection.query(`
        ALTER TABLE \`questions\`
        MODIFY COLUMN \`status\` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL DEFAULT 'ACTIVE';
      `);
      changes.push("Updated 'questions.status' ENUM to include 'REMOVED'.");
    }
  }

  // Ensure index on `questions.status` (composite or standalone) exists
  const [questionStatusIndexes] = await connection.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND INDEX_NAME IN ('idx_questions_status_lang_level', 'idx_questions_status')
  `, [dbName]);

  if (questionStatusIndexes.length === 0) {
    await connection.query(`
      ALTER TABLE \`questions\` ADD INDEX \`idx_questions_status_lang_level\` (\`status\`, \`language_id\`, \`level_id\`);
    `);
    changes.push("Added index 'idx_questions_status_lang_level' to 'questions' table.");
  }

  // Backfill: ensure any NULL or empty status in existing questions is set to 'ACTIVE'
  const [questionUpdateRes] = await connection.query(`
    UPDATE \`questions\` SET \`status\` = 'ACTIVE' WHERE \`status\` IS NULL OR \`status\` = '';
  `);
  if (questionUpdateRes && questionUpdateRes.changedRows > 0) {
    changes.push(`Backfilled ${questionUpdateRes.changedRows} existing question record(s) to 'ACTIVE' status.`);
  }

  // ---------------------------------------------------------------------------
  // 3. Ensure `question_audit_logs` table exists
  // ---------------------------------------------------------------------------
  const [auditTables] = await connection.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_audit_logs'
  `, [dbName]);

  if (auditTables.length === 0) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`question_audit_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`question_id\` INT NOT NULL,
        \`admin_id\` INT NULL,
        \`previous_status\` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL,
        \`new_status\` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL,
        \`reason\` TEXT,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`question_id\`) REFERENCES \`questions\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`admin_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_audit_logs_question\` (\`question_id\`),
        INDEX \`idx_audit_logs_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    changes.push("Created 'question_audit_logs' table for tracking status transitions.");
  } else {
    // If table exists, ensure enum includes 'REMOVED'
    const [auditCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_audit_logs' AND COLUMN_NAME IN ('previous_status', 'new_status')
    `, [dbName]);

    for (const col of auditCols) {
      const typeStr = String(col.COLUMN_TYPE || '').toLowerCase();
      if (!typeStr.includes("'removed'")) {
        await connection.query(`
          ALTER TABLE \`question_audit_logs\`
          MODIFY COLUMN \`${col.COLUMN_NAME}\` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL;
        `);
        changes.push(`Updated 'question_audit_logs.${col.COLUMN_NAME}' ENUM to include 'REMOVED'.`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Ensure `question_reports` supports 8 categories & detailed feedback
  // ---------------------------------------------------------------------------
  const [reportCols] = await connection.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_reports'
  `, [dbName]);

  const reportColMap = {};
  for (const c of reportCols) {
    reportColMap[c.COLUMN_NAME] = c;
  }

  if (reportColMap.reason && String(reportColMap.reason.COLUMN_TYPE || '').startsWith('enum')) {
    await connection.query(`
      ALTER TABLE \`question_reports\` MODIFY COLUMN \`reason\` VARCHAR(100) NOT NULL;
    `);
    changes.push("Modified 'question_reports.reason' from restrictive ENUM to VARCHAR(100).");
  }

  if (!reportColMap.details) {
    await connection.query(`
      ALTER TABLE \`question_reports\` ADD COLUMN \`details\` TEXT NULL AFTER \`reason\`;
    `);
    changes.push("Added 'details' column to 'question_reports' table.");
  }

  // ---------------------------------------------------------------------------
  // 5. Ensure `levels.enabled` column exists
  // ---------------------------------------------------------------------------
  const [levelCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'levels' AND COLUMN_NAME = 'enabled'
  `, [dbName]);

  if (levelCols.length === 0) {
    await connection.query(`
      ALTER TABLE \`levels\` ADD COLUMN \`enabled\` BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    changes.push("Added 'enabled' column to 'levels' table.");
  }

  // ---------------------------------------------------------------------------
  // 6. Ensure backward-compatibility for deprecated difficulty/topic columns
  // ---------------------------------------------------------------------------
  const [qCols] = await connection.query(`
    SELECT COLUMN_NAME, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions'
  `, [dbName]);

  const qColNames = qCols.map(r => r.COLUMN_NAME);

  if (qColNames.includes('difficulty')) {
    const diffCol = qCols.find(r => r.COLUMN_NAME === 'difficulty');
    if (diffCol && diffCol.IS_NULLABLE === 'NO') {
      await connection.query(`ALTER TABLE \`questions\` MODIFY COLUMN \`difficulty\` VARCHAR(50) NULL DEFAULT NULL;`);
      changes.push("Made deprecated 'questions.difficulty' column nullable for backward compatibility.");
    }
  }

  if (qColNames.includes('topic')) {
    const topicCol = qCols.find(r => r.COLUMN_NAME === 'topic');
    if (topicCol && topicCol.IS_NULLABLE === 'NO') {
      await connection.query(`ALTER TABLE \`questions\` MODIFY COLUMN \`topic\` VARCHAR(100) NULL DEFAULT NULL;`);
      changes.push("Made deprecated 'questions.topic' column nullable for backward compatibility.");
    }
  }

  const [diffIndex] = await connection.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND INDEX_NAME = 'idx_questions_difficulty'
  `, [dbName]);

  if (diffIndex.length > 0) {
    await connection.query(`ALTER TABLE \`questions\` DROP INDEX \`idx_questions_difficulty\`;`);
    changes.push("Dropped deprecated index 'idx_questions_difficulty'.");
  }

  // ---------------------------------------------------------------------------
  // 7. Ensure `programs` table exists
  // ---------------------------------------------------------------------------
  const [programTables] = await connection.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programs'
  `, [dbName]);

  if (programTables.length === 0) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`programs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`slug\` VARCHAR(100) NOT NULL UNIQUE,
        \`description\` TEXT,
        \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_programs_status\` (\`status\`),
        INDEX \`idx_programs_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    changes.push("Created 'programs' table for persistent practice tracks.");
  }

  // ---------------------------------------------------------------------------
  // 8. Ensure `program_languages` junction table exists
  // ---------------------------------------------------------------------------
  const [progLangTables] = await connection.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'program_languages'
  `, [dbName]);

  if (progLangTables.length === 0) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`program_languages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`program_id\` INT NOT NULL,
        \`language_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`program_id\`) REFERENCES \`programs\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_program_language\` (\`program_id\`, \`language_id\`),
        INDEX \`idx_program_languages_lang\` (\`language_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    changes.push("Created 'program_languages' junction table.");
  }

  // ---------------------------------------------------------------------------
  // 9. Ensure `question_audit_logs.changed_fields` column exists
  // ---------------------------------------------------------------------------
  const [auditChangedFieldsCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_audit_logs' AND COLUMN_NAME = 'changed_fields'
  `, [dbName]);

  if (auditChangedFieldsCols.length === 0) {
    await connection.query(`
      ALTER TABLE \`question_audit_logs\`
      ADD COLUMN \`changed_fields\` TEXT NULL AFTER \`reason\`;
    `);
    changes.push("Added 'changed_fields' column to 'question_audit_logs' table.");
  }

  // ---------------------------------------------------------------------------
  // 10. Ensure `programs.icon` column exists
  // ---------------------------------------------------------------------------
  const [programIconCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programs' AND COLUMN_NAME = 'icon'
  `, [dbName]);

  if (programIconCols.length === 0) {
    await connection.query(`
      ALTER TABLE \`programs\`
      ADD COLUMN \`icon\` VARCHAR(50) NOT NULL DEFAULT 'Code' AFTER \`description\`;
    `);
    changes.push("Added 'icon' column to 'programs' table.");
  }

  // ---------------------------------------------------------------------------
  // 10b. Ensure `programs.course_type` and `programs.image_url` exist
  // ---------------------------------------------------------------------------
  const [courseTypeCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programs' AND COLUMN_NAME = 'course_type'
  `, [dbName]);

  if (courseTypeCols.length === 0) {
    await connection.query(`
      ALTER TABLE \`programs\`
      ADD COLUMN \`course_type\` ENUM('CODING', 'THEORY') NOT NULL DEFAULT 'CODING' AFTER \`icon\`;
    `);
    changes.push("Added 'course_type' column to 'programs' table (ENUM('CODING', 'THEORY') DEFAULT 'CODING').");
  }

  const [imageUrlCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'programs' AND COLUMN_NAME = 'image_url'
  `, [dbName]);

  if (imageUrlCols.length === 0) {
    await connection.query(`
      ALTER TABLE \`programs\`
      ADD COLUMN \`image_url\` VARCHAR(255) NULL AFTER \`course_type\`;
    `);
    changes.push("Added 'image_url' column to 'programs' table.");
  }

  // ---------------------------------------------------------------------------
  // 11. Ensure `program_languages` has `compiler_id` and `compiler_name`
  // ---------------------------------------------------------------------------
  const [progLangCols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'program_languages'
  `, [dbName]);

  const progLangColNames = progLangCols.map(c => c.COLUMN_NAME);

  if (!progLangColNames.includes('compiler_id')) {
    await connection.query(`
      ALTER TABLE \`program_languages\`
      ADD COLUMN \`compiler_id\` INT NOT NULL DEFAULT 0 AFTER \`language_id\`;
    `);
    changes.push("Added 'compiler_id' column to 'program_languages' table.");
  }

  if (!progLangColNames.includes('compiler_name')) {
    await connection.query(`
      ALTER TABLE \`program_languages\`
      ADD COLUMN \`compiler_name\` VARCHAR(100) NULL AFTER \`compiler_id\`;
    `);
    changes.push("Added 'compiler_name' column to 'program_languages' table.");
  }

  // ---------------------------------------------------------------------------
  // 12. Ensure `levels.program_id` column exists and `levels.language_id` is nullable
  // ---------------------------------------------------------------------------
  const [levelColsToCheck] = await connection.query(`
    SELECT COLUMN_NAME, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'levels' AND COLUMN_NAME IN ('program_id', 'language_id')
  `, [dbName]);

  const levelColMap = {};
  levelColsToCheck.forEach(c => { levelColMap[c.COLUMN_NAME] = c; });

  if (!levelColMap.program_id) {
    await connection.query(`
      ALTER TABLE \`levels\`
      ADD COLUMN \`program_id\` INT NULL AFTER \`id\`,
      ADD INDEX \`idx_levels_program_level\` (\`program_id\`, \`level_number\`);
    `);
    changes.push("Added 'program_id' and index 'idx_levels_program_level' to 'levels' table.");
  }

  if (levelColMap.language_id && levelColMap.language_id.IS_NULLABLE === 'NO') {
    await connection.query(`
      ALTER TABLE \`levels\` MODIFY COLUMN \`language_id\` INT NULL;
    `);
    changes.push("Made 'levels.language_id' nullable for multi-language program levels.");
  }

  // ---------------------------------------------------------------------------
  // 13. Ensure `questions.program_id` column exists and `questions.language_id` is nullable
  // ---------------------------------------------------------------------------
  const [questionColsToCheck] = await connection.query(`
    SELECT COLUMN_NAME, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME IN ('program_id', 'language_id')
  `, [dbName]);

  const qColMap = {};
  questionColsToCheck.forEach(c => { qColMap[c.COLUMN_NAME] = c; });

  if (!qColMap.program_id) {
    await connection.query(`
      ALTER TABLE \`questions\`
      ADD COLUMN \`program_id\` INT NULL AFTER \`id\`,
      ADD INDEX \`idx_questions_program_level\` (\`program_id\`, \`level_id\`);
    `);
    changes.push("Added 'program_id' and index 'idx_questions_program_level' to 'questions' table.");
  }

  if (qColMap.language_id && qColMap.language_id.IS_NULLABLE === 'NO') {
    await connection.query(`
      ALTER TABLE \`questions\` MODIFY COLUMN \`language_id\` INT NULL;
    `);
    changes.push("Made 'questions.language_id' nullable for multi-compiler program questions.");
  }

  // ---------------------------------------------------------------------------
  // 14. Initialize / Migrate independent core Programs (C, C++, Java, Python, DSA)
  // ---------------------------------------------------------------------------
  const initialPrograms = [
    {
      name: 'C Programming',
      slug: 'c-programming',
      description: 'Master memory management, pointers, and systems fundamentals with C.',
      icon: 'Cpu',
      langSlug: 'c',
      compilerId: 50,
      compilerName: 'GCC 9.2.0'
    },
    {
      name: 'C++ Programming',
      slug: 'cpp-programming',
      description: 'Modern object-oriented constructs, STL templates, and high-performance algorithms.',
      icon: 'Layers',
      langSlug: 'cpp',
      compilerId: 54,
      compilerName: 'GCC 9.2.0'
    },
    {
      name: 'Java Programming',
      slug: 'java-programming',
      description: 'Object architecture, clean design patterns, and enterprise backend computing.',
      icon: 'Terminal',
      langSlug: 'java',
      compilerId: 62,
      compilerName: 'OpenJDK 13'
    },
    {
      name: 'Python Programming',
      slug: 'python-programming',
      description: 'Elegant syntax, concise problem-solving, and powerful algorithmic data structures.',
      icon: 'Code',
      langSlug: 'python',
      compilerId: 71,
      compilerName: 'Python 3.8.1'
    }
  ];

  // Map languages by slug
  const [allLanguages] = await connection.query(`SELECT id, slug, name FROM \`languages\``);
  const langSlugToId = {};
  allLanguages.forEach(l => { langSlugToId[l.slug] = l.id; });

  for (const progDef of initialPrograms) {
    const langId = langSlugToId[progDef.langSlug];
    if (!langId) continue;

    // Check if program exists
    let [existingProg] = await connection.query(
      `SELECT id, name, slug FROM \`programs\` WHERE \`slug\` = ? OR \`name\` = ?`,
      [progDef.slug, progDef.name]
    );

    let programId;
    if (existingProg.length === 0) {
      const [insertRes] = await connection.query(`
        INSERT INTO \`programs\` (\`name\`, \`slug\`, \`description\`, \`icon\`, \`status\`)
        VALUES (?, ?, ?, ?, 'ACTIVE')
      `, [progDef.name, progDef.slug, progDef.description, progDef.icon]);
      programId = insertRes.insertId;
      changes.push(`Created initial independent program '${progDef.name}'.`);
    } else {
      programId = existingProg[0].id;
    }

    // Ensure program_languages has correct compiler details
    const [existingPl] = await connection.query(
      `SELECT id, compiler_id FROM \`program_languages\` WHERE \`program_id\` = ? AND \`language_id\` = ?`,
      [programId, langId]
    );

    if (existingPl.length === 0) {
      await connection.query(`
        INSERT INTO \`program_languages\` (\`program_id\`, \`language_id\`, \`compiler_id\`, \`compiler_name\`)
        VALUES (?, ?, ?, ?)
      `, [programId, langId, progDef.compilerId, progDef.compilerName]);
      changes.push(`Linked compiler '${progDef.compilerName}' to program '${progDef.name}'.`);
    } else if (!existingPl[0].compiler_id || existingPl[0].compiler_id === 0) {
      await connection.query(`
        UPDATE \`program_languages\`
        SET \`compiler_id\` = ?, \`compiler_name\` = ?
        WHERE \`id\` = ?
      `, [progDef.compilerId, progDef.compilerName, existingPl[0].id]);
      changes.push(`Updated compiler config for program '${progDef.name}' to '${progDef.compilerName}' (ID: ${progDef.compilerId}).`);
    }

    // Associate unassociated levels for this language with this program
    const [levelUpdateRes] = await connection.query(`
      UPDATE \`levels\`
      SET \`program_id\` = ?
      WHERE \`language_id\` = ? AND (\`program_id\` IS NULL OR \`program_id\` = 0)
    `, [programId, langId]);

    if (levelUpdateRes && levelUpdateRes.changedRows > 0) {
      changes.push(`Associated ${levelUpdateRes.changedRows} level(s) for '${progDef.name}' with program ID ${programId}.`);
    }

    // Associate unassociated questions for these levels with this program
    const [qUpdateRes] = await connection.query(`
      UPDATE \`questions\`
      SET \`program_id\` = ?
      WHERE \`level_id\` IN (SELECT \`id\` FROM \`levels\` WHERE \`program_id\` = ?)
        AND (\`program_id\` IS NULL OR \`program_id\` = 0)
    `, [programId, programId]);

    if (qUpdateRes && qUpdateRes.changedRows > 0) {
      changes.push(`Associated ${qUpdateRes.changedRows} question(s) for '${progDef.name}' with program ID ${programId}.`);
    }
  }

  // Update DSA program if present: configure compiler IDs on existing program_languages
  const [dsaProg] = await connection.query(`SELECT id FROM \`programs\` WHERE \`slug\` = 'dsa' OR \`name\` = 'DSA'`);
  if (dsaProg.length > 0) {
    const dsaId = dsaProg[0].id;
    // Set icon for DSA
    await connection.query(`UPDATE \`programs\` SET \`icon\` = 'GitBranch' WHERE \`id\` = ? AND (\`icon\` IS NULL OR \`icon\` = '' OR \`icon\` = 'Code')`, [dsaId]);
    
    // Ensure all 4 compilers have compiler_id populated in program_languages
    const compilerMap = {
      1: { id: 50, name: 'GCC 9.2.0' },
      2: { id: 54, name: 'GCC 9.2.0' },
      3: { id: 62, name: 'OpenJDK 13' },
      4: { id: 71, name: 'Python 3.8.1' }
    };
    for (const [lId, cInfo] of Object.entries(compilerMap)) {
      await connection.query(`
        UPDATE \`program_languages\`
        SET \`compiler_id\` = ?, \`compiler_name\` = ?
        WHERE \`program_id\` = ? AND \`language_id\` = ? AND (\`compiler_id\` IS NULL OR \`compiler_id\` = 0)
      `, [cInfo.id, cInfo.name, dsaId, parseInt(lId, 10)]);
    }

    // If DSA has no levels yet, seed 5 standard DSA practice levels
    const [dsaLevels] = await connection.query(`SELECT COUNT(*) AS total FROM \`levels\` WHERE \`program_id\` = ?`, [dsaId]);
    if (dsaLevels[0].total === 0) {
      const dsaLevelDefs = [
        { num: 1, title: 'Arrays & Hashing', desc: 'Hash maps, frequency counters, and contiguous array traversals.' },
        { num: 2, title: 'Two Pointers & Sliding Window', desc: 'Subarray bounds, pointer convergence, and window optimization.' },
        { num: 3, title: 'Stacks, Queues & Monotonic Sequences', desc: 'LIFO evaluation, parentheses matching, and monotonic range queries.' },
        { num: 4, title: 'Binary Search & Trees', desc: 'Logarithmic search bounds, binary trees, and recursive traversals.' },
        { num: 5, title: 'Graphs & Dynamic Programming', desc: 'Breadth/depth searches, memoization, and optimal substructure.' }
      ];
      for (const d of dsaLevelDefs) {
        await connection.query(`
          INSERT INTO \`levels\` (\`program_id\`, \`level_number\`, \`title\`, \`description\`, \`enabled\`)
          VALUES (?, ?, ?, ?, TRUE)
        `, [dsaId, d.num, d.title, d.desc]);
      }
      changes.push(`Created 5 initial levels for 'DSA' track.`);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Ensure `question_languages` table exists for multi-language questions
  // ---------------------------------------------------------------------------
  const [qlTables] = await connection.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_languages'
  `, [dbName]);

  if (qlTables.length === 0) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`question_languages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`question_id\` INT NOT NULL,
        \`language_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`question_id\`) REFERENCES \`questions\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_question_language\` (\`question_id\`, \`language_id\`),
        INDEX \`idx_ql_question\` (\`question_id\`),
        INDEX \`idx_ql_language\` (\`language_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    changes.push("Created 'question_languages' table for multi-language question support.");
  }

  // Backfill: populate `question_languages` from existing single-language questions
  const [backfillRes] = await connection.query(`
    INSERT IGNORE INTO \`question_languages\` (\`question_id\`, \`language_id\`)
    SELECT \`id\`, \`language_id\`
    FROM \`questions\`
    WHERE \`language_id\` IS NOT NULL;
  `);

  if (backfillRes && backfillRes.affectedRows > 0) {
    changes.push(`Backfilled ${backfillRes.affectedRows} question-language relation(s) into 'question_languages'.`);
  }

  return {
    success: true,
    database: dbName,
    changes,
    isUpToDate: changes.length === 0
  };
}

/**
 * Automatically run migrations using the default application connection pool.
 * Safe to invoke during server startup without disrupting live traffic.
 */
async function autoMigrate() {
  try {
    const pool = db.getPool();
    const result = await runIdempotentMigrations(pool, config.db.database);
    if (!result.isUpToDate) {
      console.log(`[SCHEMA MIGRATION] Applied ${result.changes.length} safe migration change(s) to '${result.database}':`);
      result.changes.forEach(c => console.log(`  - ${c}`));
    } else {
      console.log(`[SCHEMA MIGRATION] Database '${result.database}' schema is fully up to date.`);
    }
    return result;
  } catch (err) {
    console.error(`[SCHEMA MIGRATION ERROR] Failed to verify/apply schema migrations: ${err.message}`);
    // Do not crash server startup if migration check fails; log full error
    return { success: false, error: err.message };
  }
}

module.exports = {
  runIdempotentMigrations,
  autoMigrate
};
