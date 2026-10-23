/**
 * Judge0 Language IDs and configuration
 * Standard Judge0 CE language IDs:
 * C (GCC 9.2.0): 50
 * C++ (GCC 9.2.0): 54
 * Java (OpenJDK 13.0.1): 62
 * Python (3.8.1): 71
 */

const LANGUAGE_CONFIG = {
  c: {
    judge0Id: 50,
    monacoLanguage: 'c',
    displayName: 'C (GCC 9.2.0)',
    compilerName: 'GCC 9.2.0',
    version: '9.2.0'
  },
  cpp: {
    judge0Id: 54,
    monacoLanguage: 'cpp',
    displayName: 'C++ (GCC 9.2.0)',
    compilerName: 'GCC 9.2.0',
    version: '9.2.0'
  },
  java: {
    judge0Id: 62,
    monacoLanguage: 'java',
    displayName: 'Java (OpenJDK 13)',
    compilerName: 'OpenJDK 13',
    version: '13.0.1'
  },
  python: {
    judge0Id: 71,
    monacoLanguage: 'python',
    displayName: 'Python (3.8.1)',
    compilerName: 'Python 3.8.1',
    version: '3.8.1'
  }
};

/**
 * Returns compiler config by language slug or Judge0 compiler ID
 */
function getCompilerConfig(key) {
  if (!key) return null;
  if (typeof key === 'string') {
    const slug = key.toLowerCase().trim();
    if (LANGUAGE_CONFIG[slug]) return { ...LANGUAGE_CONFIG[slug], slug };
  }
  const numericId = parseInt(key, 10);
  if (!isNaN(numericId)) {
    for (const [slug, conf] of Object.entries(LANGUAGE_CONFIG)) {
      if (conf.judge0Id === numericId) {
        return { ...conf, slug };
      }
    }
  }
  return null;
}

/**
 * Checks whether a given Judge0 compiler ID is supported
 */
function isSupportedCompilerId(compilerId) {
  const id = parseInt(compilerId, 10);
  return Object.values(LANGUAGE_CONFIG).some(conf => conf.judge0Id === id);
}

// Judge0 Status ID mappings
// 1: In Queue, 2: Processing, 3: Accepted, 4: Wrong Answer,
// 5: Time Limit Exceeded, 6: Compilation Error, 7: Runtime Error (SIGSEGV), etc.
const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

module.exports = {
  LANGUAGE_CONFIG,
  JUDGE0_STATUS,
  getCompilerConfig,
  isSupportedCompilerId,
  EXECUTION_LIMITS: {
    CPU_TIME_LIMIT_SECONDS: 2.5,
    MEMORY_LIMIT_KB: 128000,
    MAX_SOURCE_SIZE_BYTES: 65536 // 64 KB
  }
};
