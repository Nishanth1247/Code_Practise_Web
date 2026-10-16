-- ==============================================================================
-- Level-Based Community Coding Practice Platform Seed Data
-- ==============================================================================

USE `prac_web`;

-- Insert System/Demo Users
-- Password for all seed users is 'Password123!' (bcrypt hash below with cost 10)
-- Hash: $2a$10$w09ZlM0m5cWfJzYw1eG70e6Qy1r9iO48R5D2L0yL8kC/9/Z6a1Z6S (we can generate exact hash in seed script too)
-- Here we'll seed languages, levels, and sample questions.

-- 1. Insert Languages
INSERT INTO `languages` (`id`, `name`, `slug`, `enabled`) VALUES
(1, 'C', 'c', TRUE),
(2, 'C++', 'cpp', TRUE),
(3, 'Java', 'java', TRUE),
(4, 'Python', 'python', TRUE)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `enabled`=VALUES(`enabled`);

-- 2. Insert Levels for C (Language ID 1)
INSERT INTO `levels` (`id`, `language_id`, `level_number`, `title`, `description`) VALUES
(1, 1, 1, 'Fundamentals & I/O', 'Variables, data types, arithmetic operators, standard input and output.'),
(2, 1, 2, 'Control Flow & Conditions', 'If/else branching, switch statements, ternary operators, and nested conditions.'),
(3, 1, 3, 'Loops & Iterations', 'While, for, do-while loops, nested loops, series, number manipulation, and patterns.'),
(4, 1, 4, 'Arrays & Strings', '1D/2D arrays, string manipulation, character buffers, and null-termination.'),
(5, 1, 5, 'Functions & Recursion', 'Modular functions, pass-by-value, recursive calls, call stack, and scope.'),
(6, 1, 6, 'Pointers & Structures', 'Pointer arithmetic, dynamic memory allocation, structs, and custom records.')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`);

-- Levels for C++ (Language ID 2)
INSERT INTO `levels` (`id`, `language_id`, `level_number`, `title`, `description`) VALUES
(7, 2, 1, 'Basics & Streams', 'C++ cin/cout streams, namespaces, primitive types, and arithmetic.'),
(8, 2, 2, 'Decisions & Logic', 'Conditionals, relational logic, switch-case, and boolean expressions.'),
(9, 2, 3, 'Looping & Patterns', 'Iteration patterns, range-based loops, series calculations, and nested iteration.'),
(10, 2, 4, 'Vectors & Strings', 'std::vector, std::string methods, contiguous collections, and string streams.'),
(11, 2, 5, 'Functions & References', 'Pass-by-reference, function overloading, default arguments, and recursion.'),
(12, 2, 6, 'OOP & STL Fundamentals', 'Classes, constructors, encapsulation, std::map, and std::set basics.')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`);

-- Levels for Java (Language ID 3)
INSERT INTO `levels` (`id`, `language_id`, `level_number`, `title`, `description`) VALUES
(13, 3, 1, 'Syntax & Scanner', 'Java syntax, primitive variables, Scanner input, System.out formatting.'),
(14, 3, 2, 'Branching & Logic', 'if-else statements, switch expressions, and comparison operators.'),
(15, 3, 3, 'Looping & Numbers', 'for loops, while loops, mathematical algorithms, and nested iterations.'),
(16, 3, 4, 'Arrays & Strings', 'Java arrays, String immutability, StringBuilder, and character processing.'),
(17, 3, 5, 'Methods & Recursion', 'Static methods, parameters, return types, and recursive algorithms.'),
(18, 3, 6, 'Classes & Collections', 'Objects, encapsulation, ArrayList, and basic collection operations.')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`);

-- Levels for Python (Language ID 4)
INSERT INTO `levels` (`id`, `language_id`, `level_number`, `title`, `description`) VALUES
(19, 4, 1, 'Variables & Input', 'Dynamic typing, print(), input(), and basic arithmetic operations.'),
(20, 4, 2, 'Conditional Flow', 'if, elif, else statements and logical boolean expressions.'),
(21, 4, 3, 'Loops & Sequences', 'for loops, while loops, range(), break, continue, and number sequences.'),
(22, 4, 4, 'Lists & Strings', 'List indexing, slicing, string formatting, and common sequence methods.'),
(23, 4, 5, 'Functions & Modules', 'def functions, args, return values, scope, and recursion in Python.'),
(24, 4, 6, 'Dictionaries & Sets', 'Hash map lookups, set operations, tuples, and dictionary comprehensions.')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`);
