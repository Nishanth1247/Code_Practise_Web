-- ==============================================================================
-- Level-Based Community Coding Practice Platform Database Schema
-- MySQL 8.0+
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `prac_web` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `prac_web`;

-- Set consistent timezone
SET time_zone = '+00:00';

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Languages Table
CREATE TABLE IF NOT EXISTS `languages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_languages_slug` (`slug`),
  INDEX `idx_languages_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Levels Table
CREATE TABLE IF NOT EXISTS `levels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `language_id` INT NOT NULL,
  `level_number` INT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_lang_level` (`language_id`, `level_number`),
  INDEX `idx_levels_lang_level` (`language_id`, `level_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `statement` MEDIUMTEXT NOT NULL,
  `input_format` TEXT NOT NULL,
  `output_format` TEXT NOT NULL,
  `constraints_text` TEXT NOT NULL,
  `explanation` TEXT,
  `language_id` INT NOT NULL,
  `level_id` INT NOT NULL,
  `contributor_id` INT NOT NULL,
  `status` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contributor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_questions_status_lang_level` (`status`, `language_id`, `level_id`),
  INDEX `idx_questions_contributor` (`contributor_id`),
  INDEX `idx_questions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Question Starter Code Templates
CREATE TABLE IF NOT EXISTS `starter_code_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `language_slug` VARCHAR(50) NOT NULL,
  `code` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_question_lang_code` (`question_id`, `language_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Question Sample Test Cases (Publicly visible in problem statement)
CREATE TABLE IF NOT EXISTS `question_samples` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `sample_input` TEXT NOT NULL,
  `expected_output` TEXT NOT NULL,
  `explanation` TEXT,
  `display_order` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  INDEX `idx_question_samples_q` (`question_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Question Test Cases (Private / Hidden test cases used during submit evaluation)
CREATE TABLE IF NOT EXISTS `question_test_cases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `test_input` MEDIUMTEXT NOT NULL,
  `expected_output` MEDIUMTEXT NOT NULL,
  `is_hidden` BOOLEAN NOT NULL DEFAULT TRUE,
  `display_order` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  INDEX `idx_question_test_cases_q` (`question_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Useful Votes (1 vote per user per question)
CREATE TABLE IF NOT EXISTS `question_votes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `vote_type` ENUM('USEFUL') NOT NULL DEFAULT 'USEFUL',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_question_user_vote` (`question_id`, `user_id`),
  INDEX `idx_votes_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Question Reports (1 report per user per question)
CREATE TABLE IF NOT EXISTS `question_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `reporter_id` INT NOT NULL,
  `reason` ENUM('Incorrect Statement', 'Incorrect Sample Output', 'Incorrect Test Cases', 'Compilation Issue', 'Other') NOT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_question_reporter` (`question_id`, `reporter_id`),
  INDEX `idx_reports_question` (`question_id`),
  INDEX `idx_reports_reporter` (`reporter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Submissions Table
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `source_code` MEDIUMTEXT NOT NULL,
  `verdict` ENUM('Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Execution Error') NOT NULL,
  `passed_test_count` INT NOT NULL DEFAULT 0,
  `total_test_count` INT NOT NULL DEFAULT 0,
  `execution_time` FLOAT DEFAULT 0,
  `memory_used` INT DEFAULT 0,
  `error_message` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  INDEX `idx_submissions_user` (`user_id`),
  INDEX `idx_submissions_question` (`question_id`),
  INDEX `idx_submissions_verdict` (`verdict`),
  INDEX `idx_submissions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. User Solved Questions (Tracks first solve per user per question)
CREATE TABLE IF NOT EXISTS `user_solved_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `solved_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_solved` (`user_id`, `question_id`),
  INDEX `idx_user_solved_user` (`user_id`),
  INDEX `idx_user_solved_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Question Audit Logs (Tracks status transitions: ACTIVE -> PENDING_REVIEW -> REMOVED -> ACTIVE)
CREATE TABLE IF NOT EXISTS `question_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `admin_id` INT NULL,
  `previous_status` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL,
  `new_status` ENUM('ACTIVE', 'PENDING_REVIEW', 'REMOVED') NOT NULL,
  `reason` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_logs_question` (`question_id`),
  INDEX `idx_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
