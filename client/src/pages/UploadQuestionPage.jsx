import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Sparkles,
  Bot,
  Copy,
  Check,
  Cpu,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText
} from 'lucide-react';

const COMPILER_CONFIG = {
  c: { name: 'GCC 9.2.0', judge0Id: 50, label: 'C (GCC 9.2.0)' },
  cpp: { name: 'GCC 9.2.0', judge0Id: 54, label: 'C++ (GCC 9.2.0)' },
  java: { name: 'OpenJDK 13', judge0Id: 62, label: 'Java (OpenJDK 13)' },
  python: { name: 'Python 3.8.1', judge0Id: 71, label: 'Python (3.8.1)' }
};

export function UploadQuestionPage() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Prompt Helper states
  const [promptCopied, setPromptCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [programId, setProgramId] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [statement, setStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [explanation, setExplanation] = useState('');

  // Samples
  const [samples, setSamples] = useState([
    { sample_input: '', expected_output: '', explanation: '' }
  ]);

  // Hidden Test Cases
  const [testCases, setTestCases] = useState([
    { test_input: '', expected_output: '', is_hidden: true },
    { test_input: '', expected_output: '', is_hidden: true }
  ]);

  // Load programs & languages on mount
  useEffect(() => {
    async function fetchMeta() {
      try {
        const [progRes, langRes] = await Promise.all([
          api.get('/programs'),
          api.get('/languages')
        ]);
        const progs = progRes.data.programs || [];
        const langs = langRes.data.languages || [];
        setPrograms(progs);
        setLanguages(langs);
        if (progs.length > 0) {
          setProgramId(progs[0].id);
        }
        if (langs.length > 0) {
          setLanguageId(langs[0].id);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    fetchMeta();
  }, []);

  // Load levels whenever programId or languageId changes
  useEffect(() => {
    async function fetchLevels() {
      if (programId) {
        const targetProg = programs.find(p => p.id === parseInt(programId, 10));
        if (targetProg) {
          try {
            const res = await api.get(`/programs/${targetProg.slug}`);
            const lvls = res.data.levels || [];
            setLevels(lvls);
            if (lvls.length > 0) {
              setLevelId(lvls[0].id);
            }
            return;
          } catch (e) {
            // fallback
          }
        }
      }

      if (!languageId) return;
      try {
        const res = await api.get(`/languages/${languageId}/levels`);
        const lvls = res.data.levels || [];
        setLevels(lvls);
        if (lvls.length > 0) {
          setLevelId(lvls[0].id);
        }
      } catch (err) {
        console.error('Failed to load levels:', err);
      }
    }
    fetchLevels();
  }, [programId, languageId, programs]);

  // Selected language and level objects
  const selectedLangObj = languages.find(l => l.id === parseInt(languageId, 10));
  const selectedLvlObj = levels.find(l => l.id === parseInt(levelId, 10));

  // Automatic Compiler Selection: mapped strictly from selected language slug
  const currentCompiler = (selectedLangObj && COMPILER_CONFIG[selectedLangObj.slug?.toLowerCase()]) || {
    name: 'GCC 9.2.0',
    judge0Id: 50,
    label: 'C (GCC 9.2.0)'
  };

  // Structured ChatGPT Prompt tailored to CodeCraft
  const targetLanguageName = selectedLangObj ? selectedLangObj.name : '[LANGUAGE: C / C++ / Java / Python]';
  const targetLevelLabel = selectedLvlObj
    ? `Level ${selectedLvlObj.levelNumber} (${selectedLvlObj.title})`
    : '[TARGET LEVEL: e.g. Level 1 - Basics]';

  const chatGptPrompt = `I want to create a high-quality coding practice question for CodeCraft, a level-based community coding practice platform.

Target Language: ${targetLanguageName} (Compiler: ${currentCompiler.label})
Target Level: ${targetLevelLabel}
Topic / Concept: [REPLACE WITH TOPIC: e.g. Array Manipulation, Two Pointers, String Parsing, Recursion, Dynamic Programming]

Please generate a complete coding question strictly in the following format so it can be directly copied into CodeCraft:

1. TITLE:
A clear, concise, descriptive title (e.g. "Find the First Non-Repeating Character").

2. PROBLEM STATEMENT:
A detailed problem description explaining the challenge, the goals, rules, and any edge-case considerations.

3. INPUT FORMAT:
Exact line-by-line input structure (e.g. "The first line contains an integer T. The next T lines contain...").

4. OUTPUT FORMAT:
Exact line-by-line output structure including spacing and newline conventions.

5. CONSTRAINTS:
Clear mathematical and execution bounds (e.g. 1 <= N <= 10^5, -10^9 <= A[i] <= 10^9, Time Limit: 2.5s, Memory Limit: 128MB).

6. EXPLANATION:
A brief walkthrough of why the sample inputs produce the expected sample outputs.

7. VISIBLE SAMPLE CASES (Provide 2 clear sample pairs):
--- Sample Case 1 ---
Sample Input:
<exact sample input here>
Expected Output:
<exact sample output here>
Explanation:
<explanation for sample 1>

--- Sample Case 2 ---
Sample Input:
<exact sample input here>
Expected Output:
<exact sample output here>
Explanation:
<explanation for sample 2>

8. HIDDEN TEST CASES (Used for automated grading, provide at least 3 covering boundary conditions, minimal inputs, and large cases):
--- Hidden Test Case 1 ---
Test Input:
<hidden input here>
Expected Output:
<hidden output here>

--- Hidden Test Case 2 ---
Test Input:
<hidden input here>
Expected Output:
<hidden output here>

--- Hidden Test Case 3 ---
Test Input:
<hidden input here>
Expected Output:
<hidden output here>

9. REFERENCE SOLUTION CODE:
Clean, production-grade, optimal solution written in ${targetLanguageName} that passes all sample and hidden test cases under the specified compiler (${currentCompiler.label}).

10. COMPLEXITY:
- Time Complexity: O(...)
- Space Complexity: O(...)

Ensure all test case outputs are 100% accurate, properly formatted, and match the specified input and output formats exactly.`;

  // Copy-to-clipboard handler with fallback support
  const handleCopyPrompt = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(chatGptPrompt);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = chatGptPrompt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!success) throw new Error('execCommand copy failed');
      }
      setPromptCopied(true);
      setCopyError(false);
      setTimeout(() => setPromptCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  // Sample management
  const addSample = () => {
    setSamples([...samples, { sample_input: '', expected_output: '', explanation: '' }]);
  };
  const removeSample = (idx) => {
    if (samples.length <= 1) return;
    setSamples(samples.filter((_, i) => i !== idx));
  };
  const updateSample = (idx, field, value) => {
    const updated = [...samples];
    updated[idx][field] = value;
    setSamples(updated);
  };

  // Test case management
  const addTestCase = () => {
    setTestCases([...testCases, { test_input: '', expected_output: '', is_hidden: true }]);
  };
  const removeTestCase = (idx) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== idx));
  };
  const updateTestCase = (idx, field, value) => {
    const updated = [...testCases];
    updated[idx][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        title,
        program_id: programId ? parseInt(programId, 10) : undefined,
        language_id: parseInt(languageId, 10),
        level_id: parseInt(levelId, 10),
        compiler_id: currentCompiler.judge0Id,
        statement,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints_text: constraintsText,
        explanation,
        samples,
        test_cases: testCases,
        starter_code: null
      };

      const res = await api.post('/questions', payload);
      setSuccess('Question successfully submitted and published to the community practice catalog!');

      setTimeout(() => {
        navigate(`/practice/${res.data.questionId}`);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.message;
      setError(msg || 'Failed to upload question. Please verify all required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#DBEAFE]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Contribute a Question</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Create high-quality challenges for community practice. Validated submissions are published directly.
          </p>
        </div>

        {/* Tab switcher: Edit vs Preview */}
        <div className="flex items-center bg-white border border-[#DBEAFE] rounded-xl p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'edit' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'preview' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'edit' ? (
        <div className="space-y-6">
          {/* ChatGPT Question Contribution Guide and Copyable Prompt */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-[#BFDBFE] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#DBEAFE]">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-[#2563EB] text-white rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-[#1E3A8A]">
                      Need Help Creating a Question? Use ChatGPT
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8]">
                      AI Contribution Assistant
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Generate high-quality practice questions tailored specifically for CodeCraft in one click.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPromptPreview(!showPromptPreview)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  {showPromptPreview ? 'Hide Prompt' : 'View Prompt'}
                  {showPromptPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                    promptCopied
                      ? 'bg-emerald-600 text-white'
                      : copyError
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                  }`}
                >
                  {promptCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Prompt Copied!
                    </>
                  ) : copyError ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Copy Failed
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy ChatGPT Prompt
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification when copied */}
            {promptCopied && (
              <div className="p-3 mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Prompt copied to clipboard! Paste it into ChatGPT, replace any topic placeholder, and transfer the generated fields below.
                </span>
              </div>
            )}

            {copyError && (
              <div className="p-3 mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Clipboard permission was blocked by your browser. Click "View Prompt" above and copy the prompt text manually.
                </span>
              </div>
            )}

            {/* 8-Step Guideline Grid */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-3 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#2563EB]" />
                How to Use ChatGPT to Contribute (8 Simple Steps)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Copy Prompt
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Click "Copy ChatGPT Prompt" to grab our structured template with schema fields.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    Open ChatGPT
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Open ChatGPT (or your preferred AI model) in a browser tab or desktop application.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    Paste & Customize
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Paste the prompt and specify your desired coding topic or target algorithm.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                    Review for Quality
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Review the generated question for accuracy, clarity, constraints, and correctness.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">5</span>
                    Test Solution Code
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Test the provided reference solution code against the generated test cases.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">6</span>
                    Transfer into Form
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Copy the generated fields (title, statement, formats, constraints) into this form.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">7</span>
                    Verify Test Cases
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Verify all test cases match the expected input and exact output formatting.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs">
                  <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">8</span>
                    Publish Question
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Submit the question to publish it directly for community practice and review.
                  </p>
                </div>
              </div>
            </div>

            {/* Expandable Prompt Preview */}
            {showPromptPreview && (
              <div className="mb-5 bg-[#0F172A] rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-2 pb-2 border-b border-slate-700">
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Structured Prompt Template Preview:
                  </span>
                  <span className="text-[11px] text-slate-400">Targeting {currentCompiler.label}</span>
                </div>
                <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed select-all">
                  {chatGptPrompt}
                </pre>
              </div>
            )}

            {/* Prominent Contributor Responsibility Note */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-950">Important Notice for Contributors: </span>
                AI-generated questions must be reviewed and tested by you before submission. Inaccurate, low-quality, or duplicate questions may be rejected during moderation.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Track & Level Selection with Automatic Compiler Selection */}
            <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1E3A8A]">1. Track & Level Selection</h3>
                <span className="text-xs text-[#64748B]">Step 1 of 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                    Program Track
                  </label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                    Programming Language *
                  </label>
                  <select
                    value={languageId}
                    onChange={(e) => setLanguageId(e.target.value)}
                    className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                    Target Level *
                  </label>
                  <select
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
                    className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        Level {lvl.levelNumber || lvl.level_number}: {lvl.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Compiler Runtime Indicator (Read-only, derived automatically from language) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-200 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">
                      Automated Compiler Runtime
                    </div>
                    <div className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2 flex-wrap">
                      <span>{currentCompiler.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-mono font-semibold">
                        Judge0 ID: {currentCompiler.judge0Id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-configured for {selectedLangObj?.name || 'language'}
                  </span>
                </div>
              </div>
            </div>

          {/* Section 2: Problem Statement */}
          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#1E3A8A] mb-2">2. Problem Statement</h3>

            <div>
              <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                Question Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reverse an Array In-Place"
                className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                Detailed Problem Statement *
              </label>
              <textarea
                required
                rows={5}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Explain the problem clearly, including goals, rules, and logic..."
                className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl p-3 text-[#172554] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                  Input Format *
                </label>
                <textarea
                  required
                  rows={3}
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  placeholder="Describe inputs (e.g. An integer N followed by N numbers)"
                  className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl p-2.5 text-[#172554] text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                  Output Format *
                </label>
                <textarea
                  required
                  rows={3}
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="Describe expected output formatting..."
                  className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl p-2.5 text-[#172554] text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                Constraints *
              </label>
              <input
                type="text"
                required
                value={constraintsText}
                onChange={(e) => setConstraintsText(e.target.value)}
                placeholder="e.g. 1 <= N <= 10^5, -1000 <= A[i] <= 1000"
                className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#1E3A8A] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] uppercase mb-1.5">
                Explanation (Optional)
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Provide reasoning or example walkthrough..."
                className="w-full bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Section 3: Visible Samples */}
          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E3A8A]">3. Visible Sample Cases</h3>
              <button
                type="button"
                onClick={addSample}
                className="px-3 py-1.5 bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#DBEAFE] text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sample
              </button>
            </div>

            {samples.map((s, idx) => (
              <div key={idx} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#2563EB]">
                  <span>Sample #{idx + 1}</span>
                  {samples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSample(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                      Sample Input:
                    </label>
                    <textarea
                      rows={3}
                      value={s.sample_input}
                      onChange={(e) => updateSample(idx, 'sample_input', e.target.value)}
                      placeholder="Input data..."
                      className="w-full bg-white border border-[#DBEAFE] rounded-lg p-2 text-xs font-mono text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                      Expected Output:
                    </label>
                    <textarea
                      rows={3}
                      value={s.expected_output}
                      onChange={(e) => updateSample(idx, 'expected_output', e.target.value)}
                      placeholder="Expected output..."
                      className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs font-mono text-emerald-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Private Hidden Test Cases */}
          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E3A8A]">4. Hidden Test Suite</h3>
                <p className="text-xs text-[#64748B]">
                  These test cases are evaluated during submission and never revealed to learners.
                </p>
              </div>
              <button
                type="button"
                onClick={addTestCase}
                className="px-3 py-1.5 bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#DBEAFE] text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Hidden Test
              </button>
            </div>

            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                  <span>Hidden Test Case #{idx + 1}</span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                      Test Input:
                    </label>
                    <textarea
                      rows={3}
                      value={tc.test_input}
                      onChange={(e) => updateTestCase(idx, 'test_input', e.target.value)}
                      placeholder="Hidden input data..."
                      className="w-full bg-white border border-[#DBEAFE] rounded-lg p-2 text-xs font-mono text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                      Expected Output:
                    </label>
                    <textarea
                      rows={3}
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                      placeholder="Exact expected output..."
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs font-mono text-purple-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publish Question to Practice Catalog
              </>
            )}
          </button>
        </form>
      </div>
      ) : (
        /* Preview Tab */
        <div className="p-8 bg-white border border-[#DBEAFE] rounded-2xl space-y-6 shadow-sm">
          <div className="border-b border-[#DBEAFE] pb-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-bold">
                {selectedLangObj?.name || 'Language'} &bull; Level {selectedLvlObj?.levelNumber || '1'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                Compiler: {currentCompiler.label} (Judge0 ID: {currentCompiler.judge0Id})
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#1E3A8A]">{title || 'Untitled Question'}</h2>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Statement</h4>
            <div className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] text-sm whitespace-pre-wrap text-[#172554]">
              {statement || '(No statement provided yet)'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Input Format</h4>
              <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                {inputFormat || '(No input format specified)'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Output Format</h4>
              <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                {outputFormat || '(No output format specified)'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Constraints</h4>
            <pre className="text-xs font-mono text-[#1E3A8A] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE] whitespace-pre-wrap">
              {constraintsText || '(No constraints specified)'}
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Visible Samples ({samples.length})</h4>
            {samples.map((s, i) => (
              <div key={i} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] mb-3 space-y-2 text-xs">
                <span className="font-bold text-[#2563EB]">Sample #{i + 1}</span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <pre className="bg-white p-2 rounded-lg border border-[#DBEAFE] text-[#172554]">{s.sample_input || '(empty)'}</pre>
                  <pre className="bg-white p-2 rounded-lg border border-emerald-200 text-emerald-800 font-bold">{s.expected_output || '(empty)'}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
