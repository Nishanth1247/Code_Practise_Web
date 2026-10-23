import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ListOrdered,
  Lock,
  Code2,
  HelpCircle
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export function QuestionEditModal({
  isOpen,
  onClose,
  questionId,
  initialData = null,
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'samples', 'testcases', 'code'
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown options
  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [currentStatus, setCurrentStatus] = useState('ACTIVE');
  const [statusAction, setStatusAction] = useState('PRESERVE'); // 'PRESERVE', 'ACTIVE', 'PENDING_REVIEW', 'REMOVED'
  const [reason, setReason] = useState('');

  // Test cases
  const [samples, setSamples] = useState([
    { sample_input: '', expected_output: '', explanation: '' }
  ]);
  const [testCases, setTestCases] = useState([
    { test_input: '', expected_output: '', is_hidden: true }
  ]);
  const [starterCode, setStarterCode] = useState('');

  // Load languages on mount
  useEffect(() => {
    if (!isOpen) return;
    async function loadLanguages() {
      try {
        const res = await api.get('/languages');
        setLanguages(res.data.languages || []);
      } catch (err) {
        console.error('Failed to load languages for question edit:', err);
      }
    }
    loadLanguages();
  }, [isOpen]);

  // Load question details whenever modal opens or questionId changes
  useEffect(() => {
    if (!isOpen || !questionId) return;

    async function loadQuestion() {
      setFetching(true);
      setError('');
      setSuccess('');
      try {
        const res = await api.get(`/admin/questions/${questionId}`);
        const q = res.data.question;
        setTitle(q.title || '');
        setStatement(q.statement || '');
        setInputFormat(q.input_format || '');
        setOutputFormat(q.output_format || '');
        setConstraintsText(q.constraints_text || '');
        setExplanation(q.explanation || '');
        setLanguageId(q.language_id);
        setLevelId(q.level_id);
        setCurrentStatus(q.status);
        setStatusAction('PRESERVE');
        setReason('');

        // Samples
        if (res.data.samples && res.data.samples.length > 0) {
          setSamples(res.data.samples.map(s => ({
            sample_input: s.sample_input || '',
            expected_output: s.expected_output || '',
            explanation: s.explanation || ''
          })));
        } else {
          setSamples([{ sample_input: '', expected_output: '', explanation: '' }]);
        }

        // Test Cases
        if (res.data.testCases && res.data.testCases.length > 0) {
          setTestCases(res.data.testCases.map(tc => ({
            test_input: tc.test_input || '',
            expected_output: tc.expected_output || '',
            is_hidden: tc.is_hidden !== false
          })));
        } else {
          setTestCases([{ test_input: '', expected_output: '', is_hidden: true }]);
        }

        // Starter Code
        if (res.data.starterCode) {
          const langSlug = q.language_slug || '';
          setStarterCode(res.data.starterCode[langSlug] || '');
        } else {
          setStarterCode('');
        }
      } catch (err) {
        console.error('Failed to load question details:', err);
        setError('Failed to load question details.');
      } finally {
        setFetching(false);
      }
    }

    loadQuestion();
  }, [isOpen, questionId]);

  // Fetch levels whenever languageId changes
  useEffect(() => {
    if (!languageId) return;
    async function loadLevels() {
      try {
        const res = await api.get(`/languages/${languageId}/levels`);
        const lvls = res.data.levels || [];
        setLevels(lvls);
        // If current levelId does not belong to new language, pick first level
        if (lvls.length > 0 && !lvls.some(l => l.id === parseInt(levelId, 10))) {
          setLevelId(lvls[0].id);
        }
      } catch (err) {
        console.error('Failed to load levels for language:', err);
      }
    }
    loadLevels();
  }, [languageId]);

  if (!isOpen) return null;

  // Samples handlers
  const handleAddSample = () => {
    setSamples(prev => [...prev, { sample_input: '', expected_output: '', explanation: '' }]);
  };
  const handleRemoveSample = (index) => {
    if (samples.length <= 1) return;
    setSamples(prev => prev.filter((_, i) => i !== index));
  };
  const handleSampleChange = (index, field, value) => {
    setSamples(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // Test cases handlers
  const handleAddTestCase = () => {
    setTestCases(prev => [...prev, { test_input: '', expected_output: '', is_hidden: true }]);
  };
  const handleRemoveTestCase = (index) => {
    if (testCases.length <= 1) return;
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };
  const handleTestCaseChange = (index, field, value) => {
    setTestCases(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend pre-validation
    if (!title.trim() || title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      setActiveTab('content');
      return;
    }
    if (!statement.trim() || statement.trim().length < 20) {
      setError('Problem statement must be at least 20 characters long.');
      setActiveTab('content');
      return;
    }
    if (!inputFormat.trim() || !outputFormat.trim() || !constraintsText.trim()) {
      setError('Input format, output format, and constraints are required.');
      setActiveTab('content');
      return;
    }
    if (!languageId || !levelId) {
      setError('Please select both a valid language and level.');
      setActiveTab('content');
      return;
    }

    setLoading(true);
    try {
      const selectedLangObj = languages.find(l => l.id === parseInt(languageId, 10));
      const langSlug = selectedLangObj?.slug || 'c';

      const payload = {
        title: title.trim(),
        statement: statement.trim(),
        input_format: inputFormat.trim(),
        output_format: outputFormat.trim(),
        constraints_text: constraintsText.trim(),
        explanation: explanation.trim(),
        language_id: parseInt(languageId, 10),
        level_id: parseInt(levelId, 10),
        samples,
        test_cases: testCases,
        starter_code: starterCode.trim() ? { [langSlug]: starterCode.trim() } : undefined,
        reason: reason.trim() || 'Admin updated question content'
      };

      // Only pass status if administrator deliberately changed it from PRESERVE
      if (statusAction !== 'PRESERVE') {
        payload.status = statusAction;
      }

      const res = await api.patch(`/admin/questions/${questionId}`, payload);
      setSuccess('Question updated successfully!');
      if (onSuccess) {
        onSuccess(res.data.question);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update question:', err);
      setError(err.response?.data?.error || 'Failed to update question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#DBEAFE] rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DBEAFE] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#F5F9FF] border border-[#DBEAFE] px-2 py-0.5 rounded-md">
                Question #{questionId}
              </span>
              <StatusBadge status={currentStatus} />
            </div>
            <h2 className="text-xl font-bold text-[#1E3A8A] mt-1">Edit Question Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-[#DBEAFE] mt-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'content'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <FileCode className="w-4 h-4" /> Statement & Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'samples'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <ListOrdered className="w-4 h-4" /> Sample Cases ({samples.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('testcases')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'testcases'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Lock className="w-4 h-4" /> Hidden Test Cases ({testCases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'code'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Code2 className="w-4 h-4" /> Starter Code / Solution
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {fetching ? (
            <div className="py-12 text-center text-sm text-[#64748B]">Loading question data...</div>
          ) : (
            <>
              {/* TAB 1: Statement & Metadata */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {/* Language and Level Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Programming Language *
                      </label>
                      <select
                        value={languageId}
                        onChange={(e) => setLanguageId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        required
                      >
                        {languages.map(lang => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name} ({lang.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Target Level *
                      </label>
                      <select
                        value={levelId}
                        onChange={(e) => setLevelId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        required
                      >
                        {levels.map(lvl => (
                          <option key={lvl.id} value={lvl.id}>
                            Level {lvl.level_number || lvl.levelNumber} &bull; {lvl.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                      Question Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Reverse an Array In-Place"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  {/* Problem Statement */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                      Problem Statement * (min 20 chars)
                    </label>
                    <textarea
                      rows={5}
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Provide a clear, detailed description of the problem..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  {/* Input / Output Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Input Format *
                      </label>
                      <textarea
                        rows={3}
                        value={inputFormat}
                        onChange={(e) => setInputFormat(e.target.value)}
                        placeholder="e.g. The first line contains integer N..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Output Format *
                      </label>
                      <textarea
                        rows={3}
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        placeholder="e.g. Print the reversed array elements separated by spaces."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        required
                      />
                    </div>
                  </div>

                  {/* Constraints & Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Constraints *
                      </label>
                      <textarea
                        rows={3}
                        value={constraintsText}
                        onChange={(e) => setConstraintsText(e.target.value)}
                        placeholder="e.g. 1 <= N <= 10^5&#10;-10^9 <= A[i] <= 10^9"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                        Explanation / Solution Approach (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Helpful hints or reference notes for learners..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  {/* Explicit Status Action */}
                  <div className="p-4 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                        Deliberate Status Control
                      </span>
                      <span className="text-xs text-[#64748B]">
                        Current: <strong className="text-[#172554]">{currentStatus}</strong>
                      </span>
                    </div>

                    <select
                      value={statusAction}
                      onChange={(e) => setStatusAction(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="PRESERVE">Preserve Current Status ({currentStatus})</option>
                      <option value="ACTIVE">Set to ACTIVE (Available for practice)</option>
                      <option value="PENDING_REVIEW">Set to PENDING_REVIEW (Moderation queue)</option>
                      <option value="REMOVED">Set to REMOVED (Soft-deleted from practice)</option>
                    </select>

                    <p className="text-[11px] text-[#64748B]">
                      Note: Editing a removed question will preserve its REMOVED status unless you deliberately select ACTIVE.
                    </p>
                  </div>

                  {/* Audit Note */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                      Reason for Edit (Audit Log Record)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Corrected typo in sample test case 2"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Samples */}
              {activeTab === 'samples' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#64748B]">
                      Sample cases are displayed publicly in the problem statement for learners to understand expected behavior.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddSample}
                      className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1D4ED8] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Sample
                    </button>
                  </div>

                  {samples.map((sample, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-[#DBEAFE] space-y-3 relative">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1E3A8A]">
                        <span>Sample Case #{idx + 1}</span>
                        {samples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSample(idx)}
                            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                            Sample Input (stdin)
                          </label>
                          <textarea
                            rows={3}
                            value={sample.sample_input}
                            onChange={(e) => handleSampleChange(idx, 'sample_input', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                            placeholder="e.g. 5&#10;1 2 3 4 5"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                            Expected Output (stdout)
                          </label>
                          <textarea
                            rows={3}
                            value={sample.expected_output}
                            onChange={(e) => handleSampleChange(idx, 'expected_output', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                            placeholder="e.g. 5 4 3 2 1"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                          Sample Explanation (Optional)
                        </label>
                        <input
                          type="text"
                          value={sample.explanation}
                          onChange={(e) => handleSampleChange(idx, 'explanation', e.target.value)}
                          placeholder="e.g. The first element 1 swaps with last element 5"
                          className="w-full px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: Hidden Test Cases */}
              {activeTab === 'testcases' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#64748B]">
                      Private test cases evaluated by Judge0 when learners submit their final solution.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1D4ED8] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Test Case
                    </button>
                  </div>

                  {testCases.map((tc, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-[#DBEAFE] space-y-3 relative">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1E3A8A]">
                        <span className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                          Test Case #{idx + 1}
                        </span>
                        {testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx)}
                            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                            Input (stdin)
                          </label>
                          <textarea
                            rows={3}
                            value={tc.test_input}
                            onChange={(e) => handleTestCaseChange(idx, 'test_input', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                            Expected Output (stdout)
                          </label>
                          <textarea
                            rows={3}
                            value={tc.expected_output}
                            onChange={(e) => handleTestCaseChange(idx, 'expected_output', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: Starter Code & Solution */}
              {activeTab === 'code' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748B]">
                    Starter template code loaded into the Monaco Editor when learners start working on this question.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                      Starter Code / Reference Template
                    </label>
                    <textarea
                      rows={10}
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                      placeholder="// Write initial starter code template..."
                      className="w-full p-4 rounded-2xl border border-[#CBD5E1] bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DBEAFE] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              <Save className="w-3.5 h-3.5" /> Save Question Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionEditModal;
