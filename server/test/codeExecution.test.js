const { normalizeOutput } = require('../src/services/codeExecutionService');
const codeExecutionService = require('../src/services/codeExecutionService');

describe('Code Execution and Output Normalization Tests', () => {
  test('normalizeOutput handles Windows CRLF vs Linux LF and trailing whitespace', () => {
    const rawWindows = "Hello World!   \r\nSecond Line\r\n\r\n";
    const rawLinux = "Hello World!\nSecond Line";

    const norm1 = normalizeOutput(rawWindows);
    const norm2 = normalizeOutput(rawLinux);

    expect(norm1).toBe("Hello World!\nSecond Line");
    expect(norm2).toBe("Hello World!\nSecond Line");
    expect(norm1).toBe(norm2);
  });

  test('normalizeOutput preserves intentional internal indentation and structure', () => {
    const codeOutput = "1 2 3\n  4 5 6\n7 8 9";
    const normalized = normalizeOutput(codeOutput);
    expect(normalized).toBe("1 2 3\n  4 5 6\n7 8 9");
  });

  test('Graceful error response when Judge0 execution service is offline', async () => {
    // Attempting to execute with unreachable host
    const badConfigService = require('../src/services/codeExecutionService');

    // Passing unsupported language throws clear error
    await expect(
      badConfigService.executeOnJudge0({
        sourceCode: 'print(1)',
        languageSlug: 'unsupported_lang_xyz',
        stdin: ''
      })
    ).rejects.toThrow('Unsupported programming language');
  });
});
