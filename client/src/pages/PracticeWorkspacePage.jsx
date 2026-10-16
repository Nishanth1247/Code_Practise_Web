import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { VerdictBadge } from '../components/common/Badge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  Play,
  Send,
  RotateCcw,
  ThumbsUp,
  Flag,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  FileCode,
  Info,
  Sun,
  Moon
} from 'lucide-react';

export function PracticeWorkspacePage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('c');
  const [code, setCode] = useState('');

  // Refs for Monaco instance and container layout
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Monaco Editor theme: independently selectable (persisted in localStorage)
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem('codecraft_editor_theme') || 'vs-dark';
  });

  const toggleEditorTheme = () => {
    const nextTheme = editorTheme === 'vs-dark' ? 'vs' : 'vs-dark';
    setEditorTheme(nextTheme);
    localStorage.setItem('codecraft_editor_theme', nextTheme);
    requestAnimationFrame(() => {
      editorRef.current?.layout();
    });
  };

  // Active workspace tabs
  const [activeLeftTab, setActiveLeftTab] = useState('statement'); // 'statement', 'samples'
  const [activeBottomTab, setActiveBottomTab] = useState('testcase'); // 'testcase', 'results'

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Voting & Reporting states
  const [usefulVotes, setUsefulVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Report modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Incorrect Statement');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportNotification, setReportNotification] = useState(null);

  // Load question data - ALWAYS starts with a completely empty editor
  useEffect(() => {
    async function loadQuestion() {
      setLoading(true);
      setRunResult(null);
      setSubmitResult(null);
      setCode(''); // Always reset to empty editor on question change
      try {
        const res = await api.get(`/questions/${questionId}`);
        const q = res.data.question;
        setQuestion(q);
        setSelectedLanguage(q.languageSlug || 'c');
        setUsefulVotes(q.usefulVotes || 0);
        setHasVoted(q.userHasVoted || false);
        // Ensure editor begins completely empty with no preloaded or starter code
        setCode('');
      } catch (err) {
        console.error('Failed to load question:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [questionId]);

  // Handle Monaco editor mounting and hit-testing calibration
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Remeasure fonts once document web fonts are loaded to eliminate hit-test coordinate mismatch
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        try {
          monaco.editor.remeasureFonts();
          editor.layout();
        } catch (e) {
          // Safe no-op
        }
      });
    }

    editor.layout();
  };

  // ResizeObserver to ensure Monaco adjusts layout whenever its container resizes
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });

    ro.observe(container);
    return () => {
      ro.disconnect();
    };
  }, [loading]);

  // Re-layout whenever theme or tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [editorTheme, activeLeftTab, activeBottomTab]);

  if (loading) return <LoadingSpinner message="Loading workspace & Monaco editor..." />;
  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#1E3A8A] mb-2">Question Unavailable</h2>
        <p className="text-[#64748B] text-sm mb-6">
          This question does not exist or is currently pending review.
        </p>
        <Link to="/languages" className="px-5 py-2.5 bg-[#2563EB] rounded-xl text-xs font-semibold text-white">
          Back to Curricula
        </Link>
      </div>
    );
  }

  // Handle Useful Vote Toggle
  const handleToggleVote = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsVoting(true);
    try {
      const res = await api.post(`/questions/${question.id}/vote`);
      setHasVoted(res.data.hasVoted);
      setUsefulVotes(res.data.totalVotes);
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle language change: clears editor and switches Monaco language mode
  const handleLanguageChange = (newLang) => {
    if (newLang !== selectedLanguage) {
      setSelectedLanguage(newLang);
      setCode(''); // Always clear code on language switch
      requestAnimationFrame(() => {
        editorRef.current?.layout();
      });
    }
  };

  // Clear code editor
  const handleClearCode = () => {
    if (!code || window.confirm('Clear editor content? Current edits will be lost.')) {
      setCode('');
      editorRef.current?.focus();
    }
  };

  // RUN CODE (against visible sample cases)
  const handleRunCode = async () => {
    if (!code.trim()) {
      setActiveBottomTab('results');
      setRunResult({
        success: false,
        overallVerdict: 'Empty Submission',
        compileOutput: 'Please write your solution code before running.'
      });
      return;
    }

    setIsRunning(true);
    setActiveBottomTab('results');
    setRunResult(null);
    setSubmitResult(null);

    try {
      const res = await api.post('/submissions/run', {
        questionId: question.id,
        language: selectedLanguage,
        sourceCode: code
      });
      setRunResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Execution failed.';
      setRunResult({
        success: false,
        overallVerdict: 'Execution Error',
        compileOutput: msg
      });
    } finally {
      setIsRunning(false);
    }
  };

  // SUBMIT SOLUTION (against all hidden test cases)
  const handleSubmitSolution = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!code.trim()) {
      setActiveBottomTab('results');
      setSubmitResult({
        success: false,
        verdict: 'Empty Submission',
        compileOutput: 'Please write your solution code before submitting.'
      });
      return;
    }

    setIsSubmitting(true);
    setActiveBottomTab('results');
    setSubmitResult(null);

    try {
      const res = await api.post('/submissions/submit', {
        questionId: question.id,
        language: selectedLanguage,
        sourceCode: code
      });
      setSubmitResult(res.data);
      if (res.data.verdict === 'Accepted') {
        setQuestion(prev => ({ ...prev, isSolved: true }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Submission failed.';
      setSubmitResult({
        success: false,
        verdict: 'Execution Error',
        compileOutput: msg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Wrong-Question Report (Mandatory Replacement Workflow)
  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsReporting(true);
    try {
      const res = await api.post(`/questions/${question.id}/report`, {
        reason: reportReason,
        details: reportDetails
      });

      setIsReportModalOpen(false);

      // Handle replacement workflow
      if (res.data.replacementQuestion) {
        setReportNotification({
          type: 'success',
          message: `Report recorded. Question replaced with: "${res.data.replacementQuestion.title}".`,
          replacementId: res.data.replacementQuestion.id
        });

        setTimeout(() => {
          navigate(`/practice/${res.data.replacementQuestion.id}`);
        }, 1800);
      } else {
        setReportNotification({
          type: 'fallback',
          message: res.data.fallbackMessage || 'Report recorded. No alternative question available in this level currently.',
          levelId: question.levelId
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setIsReporting(false);
    }
  };

  // Monaco language identifier
  const getMonacoLang = (slug) => {
    switch (slug) {
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      case 'python': return 'python';
      default: return 'plaintext';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F9FF] overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Top Workspace Bar */}
      <div className="h-13 border-b border-[#DBEAFE] bg-white px-4 flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/levels/${question.levelId}/questions`}
            className="flex items-center gap-1 text-[#64748B] hover:text-[#2563EB] transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Level {question.levelNumber}</span>
          </Link>

          <span className="text-[#DBEAFE]">/</span>

          <span className="font-bold text-[#1E3A8A] truncate max-w-xs md:max-w-md">
            {question.title}
          </span>

          {question.isSolved && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved
            </span>
          )}
        </div>

        {/* Community Useful & Report Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVote}
            disabled={isVoting}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              hasVoted
                ? 'bg-blue-50 text-[#2563EB] border-[#DBEAFE]'
                : 'bg-white text-[#172554] border-[#DBEAFE] hover:bg-[#F5F9FF]'
            }`}
            title="Mark as useful question"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#2563EB] text-[#2563EB]' : 'text-[#64748B]'}`} />
            <span>{usefulVotes}</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={user && user.id === question.contributorId}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#64748B] hover:text-rose-600 hover:bg-rose-50 border border-[#DBEAFE] hover:border-rose-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            title={user && user.id === question.contributorId ? "You cannot report your own question" : "Report wrong question"}
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Issue</span>
          </button>
        </div>
      </div>

      {/* Notification Banner (e.g. on question replacement) */}
      {reportNotification && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{reportNotification.message}</span>
          </div>
          {reportNotification.replacementId ? (
            <span className="text-[11px] text-amber-600 font-mono font-bold animate-pulse">Switching...</span>
          ) : (
            <Link
              to={`/levels/${reportNotification.levelId}/questions`}
              className="text-amber-700 underline font-bold hover:text-amber-900"
            >
              Return to Level Questions
            </Link>
          )}
        </div>
      )}

      {/* Main Workspace Body: Split Left / Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= LEFT PANEL: Problem Details ================= */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-[#DBEAFE] bg-white overflow-y-auto">
          {/* Left panel tabs */}
          <div className="flex items-center border-b border-[#DBEAFE] px-4 bg-[#F5F9FF] sticky top-0 z-10">
            <button
              onClick={() => setActiveLeftTab('statement')}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeLeftTab === 'statement'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172554]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Problem Statement
            </button>
            <button
              onClick={() => setActiveLeftTab('samples')}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeLeftTab === 'samples'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#172554]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Sample Cases ({question.samples?.length || 0})
            </button>
          </div>

          {/* Left panel content */}
          <div className="p-6 space-y-6 text-sm text-[#172554]">
            {activeLeftTab === 'statement' ? (
              <>
                {/* Title & Metadata */}
                <div>
                  <h1 className="text-xl font-bold text-[#1E3A8A] mb-2">{question.title}</h1>
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span>Contributor: <strong className="text-[#172554]">{question.contributor}</strong></span>
                  </div>
                </div>

                {/* Description Statement */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Description</h4>
                  <div className="text-[#172554] leading-relaxed whitespace-pre-line bg-[#F5F9FF] p-4 rounded-xl border border-[#DBEAFE]">
                    {question.statement}
                  </div>
                </div>

                {/* Input Format */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Input Format</h4>
                  <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                    {question.inputFormat}
                  </p>
                </div>

                {/* Output Format */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Output Format</h4>
                  <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                    {question.outputFormat}
                  </p>
                </div>

                {/* Constraints */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Constraints</h4>
                  <pre className="font-mono text-xs text-[#1E3A8A] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE] whitespace-pre-wrap">
                    {question.constraintsText}
                  </pre>
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Explanation</h4>
                    <p className="text-xs text-[#64748B] italic bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Samples Tab */
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Sample Test Cases</h4>
                {question.samples?.map((s, idx) => (
                  <div key={s.id || idx} className="p-4 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] space-y-3">
                    <span className="text-xs font-bold text-[#2563EB]">Sample #{idx + 1}</span>
                    <div>
                      <span className="text-[11px] font-bold text-[#64748B] uppercase">Input:</span>
                      <pre className="font-mono text-xs bg-white p-2.5 rounded-lg border border-[#DBEAFE] mt-1 text-[#172554] overflow-x-auto">
                        {s.sample_input || '(empty)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#64748B] uppercase">Expected Output:</span>
                      <pre className="font-mono text-xs bg-white p-2.5 rounded-lg border border-emerald-200 mt-1 text-emerald-800 font-bold overflow-x-auto">
                        {s.expected_output || '(empty)'}
                      </pre>
                    </div>
                    {s.explanation && (
                      <p className="text-xs text-[#64748B] italic">Note: {s.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: Code Editor & Execution Results ================= */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white min-h-[500px]">
          {/* Editor Header Toolbar */}
          <div className="h-10 bg-[#F5F9FF] border-b border-[#DBEAFE] px-4 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="font-bold text-[#2563EB] bg-white border border-[#DBEAFE] rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                title="Select language (clears editor on switch)"
              >
                <option value="c">C (GCC 9.2.0)</option>
                <option value="cpp">C++ (GCC 9.2.0)</option>
                <option value="java">Java (OpenJDK 13)</option>
                <option value="python">Python (3.8.1)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* Independently configurable Monaco Editor Theme toggle */}
              <button
                onClick={toggleEditorTheme}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#64748B] hover:text-[#172554] rounded-lg border border-[#DBEAFE] bg-white transition-colors"
                title={`Switch Editor Theme to ${editorTheme === 'vs-dark' ? 'Light' : 'Dark'}`}
              >
                {editorTheme === 'vs-dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Light</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearCode}
                className="p-1.5 text-[#64748B] hover:text-rose-600 rounded-lg hover:bg-white border border-[#DBEAFE] transition-colors"
                title="Clear code to empty editor"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div ref={editorContainerRef} className="flex-1 min-h-[340px] relative overflow-hidden">
            {code === '' && (
              <div className="absolute top-[18px] left-[58px] z-10 pointer-events-none select-none text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500 opacity-60">
                // Write your solution here...
              </div>
            )}
            <Editor
              height="100%"
              language={getMonacoLang(selectedLanguage)}
              theme={editorTheme}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
                fontLigatures: false,
                letterSpacing: 0,
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                matchBrackets: 'always',
                renderWhitespace: 'none',
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true
              }}
            />
          </div>

          {/* Action Bar (Run / Submit) */}
          <div className="h-14 border-t border-b border-[#DBEAFE] bg-white px-4 flex items-center justify-between shrink-0 shadow-xs">
            <button
              onClick={() => setActiveBottomTab(activeBottomTab === 'results' ? 'testcase' : 'results')}
              className="text-xs font-bold text-[#1E3A8A] hover:text-[#2563EB] flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-[#2563EB]" />
              <span>Console & Results</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#2563EB]" />
                {isRunning ? 'Running...' : 'Run Code'}
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isRunning || isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
              </button>
            </div>
          </div>

          {/* Execution Output Panel (Bottom split) */}
          <div className="h-56 bg-[#F5F9FF] overflow-y-auto p-4 border-t border-[#DBEAFE] text-xs flex flex-col">
            {/* Running Spinner */}
            {(isRunning || isSubmitting) && (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner
                  message={isRunning ? 'Executing test runs on isolated sandbox...' : 'Evaluating against hidden test suite...'}
                  size="sm"
                />
              </div>
            )}

            {/* Run Code Results */}
            {!isRunning && !isSubmitting && runResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] font-medium">Verdict:</span>
                    <VerdictBadge verdict={runResult.overallVerdict} />
                  </div>
                  <span className="text-[#64748B]">
                    Passed: <strong className="text-[#172554]">{runResult.passedSamples || 0}/{runResult.totalSamples || 0}</strong> Samples
                  </span>
                </div>

                {runResult.compileOutput && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 font-mono text-[11px] whitespace-pre-wrap">
                    {runResult.compileOutput}
                  </div>
                )}

                {/* Sample items tabs */}
                {runResult.results?.map((res, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-[#DBEAFE] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172554]">Sample #{res.sampleIndex}</span>
                      <VerdictBadge verdict={res.verdict} />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold">Standard Output:</span>
                      <pre className="font-mono text-[#172554] bg-[#F5F9FF] p-2 rounded-lg border border-[#DBEAFE] mt-0.5 overflow-x-auto">
                        {res.actualOutput || '(no output)'}
                      </pre>
                    </div>
                    {res.stderr && (
                      <div>
                        <span className="text-[10px] text-rose-700 uppercase font-bold">Standard Error:</span>
                        <pre className="font-mono text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-0.5 overflow-x-auto">
                          {res.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Solution Results */}
            {!isRunning && !isSubmitting && submitResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] font-medium">Submission Verdict:</span>
                    <VerdictBadge verdict={submitResult.verdict} />
                  </div>
                  {submitResult.verdict === 'Accepted' && (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Solved! Added to your record.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-[#DBEAFE] text-[11px] shadow-2xs">
                  <div>
                    <span className="text-[#64748B] block font-medium">Tests Passed:</span>
                    <span className="font-bold text-[#172554]">{submitResult.passedCount} / {submitResult.totalCount}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block font-medium">Runtime:</span>
                    <span className="font-bold text-[#172554]">{submitResult.executionTime} s</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block font-medium">Memory:</span>
                    <span className="font-bold text-[#172554]">{submitResult.memoryUsed} KB</span>
                  </div>
                </div>

                {submitResult.compileOutput && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 font-mono text-[11px] whitespace-pre-wrap">
                    {submitResult.compileOutput}
                  </div>
                )}
              </div>
            )}

            {/* Default empty state for console */}
            {!isRunning && !isSubmitting && !runResult && !submitResult && (
              <div className="flex-1 flex flex-col items-center justify-center text-[#64748B] text-xs">
                <Terminal className="w-6 h-6 mb-2 text-[#2563EB] opacity-60" />
                <p>Click "Run Code" to test visible samples or "Submit Solution" to evaluate against hidden tests.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Wrong Question Modal */}
      <ConfirmationModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onConfirm={handleSubmitReport}
        title="Report Inaccurate Question"
        message="Reporting this question will record your feedback and immediately provide you with an alternative practice question from this level."
        confirmText={isReporting ? "Submitting..." : "Submit Report & Replace"}
        isLoading={isReporting}
        isDanger={true}
      />
    </div>
  );
}
