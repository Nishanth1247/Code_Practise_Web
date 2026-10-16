const axios = require('axios');
const config = require('../config/env');
const { LANGUAGE_CONFIG, JUDGE0_STATUS, EXECUTION_LIMITS } = require('../config/judge0');

/**
 * Normalizes output string for comparison:
 * - Normalizes Windows CRLF to LF
 * - Trims trailing whitespace on each line
 * - Trims trailing blank lines at end
 */
function normalizeOutput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trimEnd();
}

/**
 * Sends a single execution request to Judge0 and waits for completion
 */
async function executeOnJudge0({ sourceCode, languageSlug, stdin, expectedOutput = null }) {
  const langConfig = LANGUAGE_CONFIG[languageSlug.toLowerCase()];
  if (!langConfig) {
    throw new Error(`Unsupported programming language: ${languageSlug}`);
  }

  const payload = {
    source_code: Buffer.from(sourceCode).toString('base64'),
    language_id: langConfig.judge0Id,
    stdin: Buffer.from(stdin || '').toString('base64'),
    cpu_time_limit: EXECUTION_LIMITS.CPU_TIME_LIMIT_SECONDS,
    memory_limit: EXECUTION_LIMITS.MEMORY_LIMIT_KB,
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.judge0.apiKey) {
    headers['X-RapidAPI-Key'] = config.judge0.apiKey;
    headers['X-RapidAPI-Host'] = config.judge0.apiHost || 'judge0-ce.p.rapidapi.com';
  }

  const url = `${config.judge0.apiUrl}/submissions?base64_encoded=true&wait=true`;

  try {
    const response = await axios.post(url, payload, {
      headers,
      timeout: 15000 // 15s timeout
    });

    const data = response.data;
    const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf8') : '';
    const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf8') : '';
    const compileOutput = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : '';
    const statusId = data.status ? data.status.id : null;
    const statusDesc = data.status ? data.status.description : 'Unknown';

    let verdict = 'Execution Error';
    if (statusId === JUDGE0_STATUS.COMPILATION_ERROR) {
      verdict = 'Compilation Error';
    } else if (statusId === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) {
      verdict = 'Time Limit Exceeded';
    } else if (
      statusId >= JUDGE0_STATUS.RUNTIME_ERROR_SIGSEGV &&
      statusId <= JUDGE0_STATUS.RUNTIME_ERROR_OTHER
    ) {
      verdict = 'Runtime Error';
    } else if (statusId === JUDGE0_STATUS.ACCEPTED || statusId === JUDGE0_STATUS.WRONG_ANSWER || statusId === null) {
      // If code compiled and ran to completion, compare output if expectedOutput was provided
      if (expectedOutput !== null) {
        const normActual = normalizeOutput(stdout);
        const normExpected = normalizeOutput(expectedOutput);
        verdict = normActual === normExpected ? 'Accepted' : 'Wrong Answer';
      } else {
        verdict = 'Executed';
      }
    }

    return {
      statusId,
      statusDescription: statusDesc,
      verdict,
      stdout,
      stderr,
      compileOutput,
      time: parseFloat(data.time) || 0,
      memory: parseInt(data.memory, 10) || 0,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const err = new Error(
        `Code execution service (Judge0) is not reachable at ${config.judge0.apiUrl}. ` +
        `Please ensure Judge0 is running or configure JUDGE0_API_URL and JUDGE0_API_KEY in server/.env.`
      );
      err.isProviderUnavailable = true;
      throw err;
    }
    throw error;
  }
}

/**
 * RUN CODE: Runs against visible sample cases only.
 * Returns output for display to user. Does not award solved status.
 */
async function runSamples({ sourceCode, languageSlug, samples }) {
  const results = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const execResult = await executeOnJudge0({
      sourceCode,
      languageSlug,
      stdin: sample.sample_input,
      expectedOutput: sample.expected_output
    });

    results.push({
      sampleIndex: i + 1,
      input: sample.sample_input,
      expectedOutput: sample.expected_output,
      actualOutput: execResult.stdout,
      stderr: execResult.stderr,
      compileOutput: execResult.compileOutput,
      verdict: execResult.verdict,
      time: execResult.time,
      memory: execResult.memory,
      passed: execResult.verdict === 'Accepted'
    });

    // If compilation error, timeout, or runtime error, stop evaluating further samples early
    if (
      execResult.verdict === 'Compilation Error' ||
      execResult.verdict === 'Time Limit Exceeded' ||
      execResult.verdict === 'Runtime Error'
    ) {
      break;
    }
  }

  const allPassed = results.length === samples.length && results.every(r => r.passed);
  const compilationError = results.find(r => r.verdict === 'Compilation Error');
  const timeLimitExceeded = results.find(r => r.verdict === 'Time Limit Exceeded');
  const runtimeError = results.find(r => r.verdict === 'Runtime Error');

  let overallVerdict = 'Wrong Answer';
  if (compilationError) {
    overallVerdict = 'Compilation Error';
  } else if (timeLimitExceeded) {
    overallVerdict = 'Time Limit Exceeded';
  } else if (runtimeError) {
    overallVerdict = 'Runtime Error';
  } else if (allPassed) {
    overallVerdict = 'Accepted';
  }

  return {
    success: true,
    overallVerdict,
    compileOutput: compilationError ? compilationError.compileOutput : '',
    totalSamples: samples.length,
    passedSamples: results.filter(r => r.passed).length,
    results
  };
}

/**
 * SUBMIT SOLUTION: Runs against ALL hidden test cases.
 * Never returns hidden inputs or outputs to client!
 * Only returns verdict, test case counts, runtime, memory.
 */
async function evaluateSubmission({ sourceCode, languageSlug, testCases }) {
  if (!testCases || testCases.length === 0) {
    throw new Error('Question has no test cases configured.');
  }

  let passedCount = 0;
  let overallVerdict = 'Accepted';
  let totalTime = 0;
  let maxMemory = 0;
  let compileOutput = '';
  let firstFailedIndex = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execResult = await executeOnJudge0({
      sourceCode,
      languageSlug,
      stdin: tc.test_input,
      expectedOutput: tc.expected_output
    });

    totalTime += execResult.time;
    if (execResult.memory > maxMemory) {
      maxMemory = execResult.memory;
    }

    if (execResult.verdict === 'Compilation Error') {
      overallVerdict = 'Compilation Error';
      compileOutput = execResult.compileOutput;
      firstFailedIndex = i + 1;
      break;
    }

    if (execResult.verdict === 'Accepted') {
      passedCount++;
    } else {
      if (overallVerdict === 'Accepted') {
        overallVerdict = execResult.verdict;
        firstFailedIndex = i + 1;
      }
      // Continue or break on first failure to save execution time
      break;
    }
  }

  return {
    verdict: overallVerdict,
    passedCount,
    totalCount: testCases.length,
    executionTime: parseFloat(totalTime.toFixed(3)),
    memoryUsed: maxMemory,
    compileOutput: overallVerdict === 'Compilation Error' ? compileOutput : null,
    failedTestCaseNumber: overallVerdict === 'Accepted' ? null : firstFailedIndex
  };
}

module.exports = {
  normalizeOutput,
  executeOnJudge0,
  runSamples,
  evaluateSubmission
};
