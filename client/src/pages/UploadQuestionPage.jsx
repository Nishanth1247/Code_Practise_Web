import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';

export function UploadQuestionPage() {
  const navigate = useNavigate();

  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
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

  // Load languages
  useEffect(() => {
    async function fetchLangs() {
      try {
        const res = await api.get('/languages');
        const langs = res.data.languages || [];
        setLanguages(langs);
        if (langs.length > 0) {
          setLanguageId(langs[0].id);
        }
      } catch (err) {
        console.error('Failed to load languages:', err);
      }
    }
    fetchLangs();
  }, []);

  // Load levels whenever languageId changes
  useEffect(() => {
    async function fetchLevels() {
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
  }, [languageId]);

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
        language_id: parseInt(languageId, 10),
        level_id: parseInt(levelId, 10),
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

  const selectedLangObj = languages.find(l => l.id === parseInt(languageId, 10));
  const selectedLvlObj = levels.find(l => l.id === parseInt(levelId, 10));

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Track & Level Selection */}
          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#1E3A8A] mb-2">1. Track & Level Selection</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Level {lvl.levelNumber}: {lvl.title}
                    </option>
                  ))}
                </select>
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
      ) : (
        /* Preview Tab */
        <div className="p-8 bg-white border border-[#DBEAFE] rounded-2xl space-y-6 shadow-sm">
          <div className="border-b border-[#DBEAFE] pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-bold">
                {selectedLangObj?.name || 'Language'} &bull; Level {selectedLvlObj?.levelNumber || '1'}
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
