import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Layers,
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  ArrowRight
} from 'lucide-react';

export function AdminLevelsPage() {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState('');
  const [levels, setLevels] = useState([]);
  const [loadingLangs, setLoadingLangs] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal / Form state for Add Level
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLevelNumber, setNewLevelNumber] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEnabled, setNewEnabled] = useState(true);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit State
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editLevelNumber, setEditLevelNumber] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete State
  const [deletingLevelId, setDeletingLevelId] = useState(null);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Load languages
  useEffect(() => {
    async function fetchLanguages() {
      try {
        setLoadingLangs(true);
        const res = await api.get('/languages');
        const langs = res.data.languages || [];
        setLanguages(langs);
        if (langs.length > 0) {
          setSelectedLanguageId(langs[0].id);
        }
      } catch (err) {
        setErrorMsg('Failed to load programming languages.');
      } finally {
        setLoadingLangs(false);
      }
    }
    fetchLanguages();
  }, []);

  // Fetch levels when selected language changes
  const fetchLevels = async (langId) => {
    if (!langId) return;
    try {
      setLoadingLevels(true);
      const res = await api.get(`/admin/languages/${langId}/levels`);
      const fetchedLevels = res.data.levels || [];
      setLevels(fetchedLevels);

      // Pre-fill next level number for add modal
      const maxNum = fetchedLevels.reduce((max, lvl) => Math.max(max, lvl.levelNumber), 0);
      setNewLevelNumber(String(maxNum + 1));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch levels for language.');
    } finally {
      setLoadingLevels(false);
    }
  };

  useEffect(() => {
    if (selectedLanguageId) {
      fetchLevels(selectedLanguageId);
    }
  }, [selectedLanguageId]);

  // Handle Add Level
  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Please enter a level title.');
      return;
    }

    try {
      setSubmittingAdd(true);
      setErrorMsg('');
      const res = await api.post(`/admin/languages/${selectedLanguageId}/levels`, {
        levelNumber: newLevelNumber ? parseInt(newLevelNumber, 10) : undefined,
        title: newTitle.trim(),
        description: newDescription.trim(),
        enabled: newEnabled
      });

      setSuccessMsg(res.data.message || 'Level created successfully!');
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewEnabled(true);
      await fetchLevels(selectedLanguageId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create level.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Start editing a level
  const startEdit = (lvl) => {
    setEditingLevelId(lvl.id);
    setEditLevelNumber(String(lvl.levelNumber));
    setEditTitle(lvl.title);
    setEditDescription(lvl.description || '');
  };

  const cancelEdit = () => {
    setEditingLevelId(null);
    setEditLevelNumber('');
    setEditTitle('');
    setEditDescription('');
  };

  // Submit level update
  const handleUpdateLevel = async (levelId) => {
    if (!editTitle.trim()) {
      setErrorMsg('Level title cannot be empty.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setErrorMsg('');
      const res = await api.patch(`/admin/levels/${levelId}`, {
        levelNumber: parseInt(editLevelNumber, 10),
        title: editTitle.trim(),
        description: editDescription.trim()
      });

      setSuccessMsg(res.data.message || 'Level updated successfully!');
      setEditingLevelId(null);
      await fetchLevels(selectedLanguageId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update level.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Toggle enabled / disabled
  const handleToggleStatus = async (lvl) => {
    try {
      const res = await api.patch(`/admin/levels/${lvl.id}/status`, {
        enabled: !lvl.enabled
      });
      setSuccessMsg(res.data.message || `Level ${lvl.levelNumber} updated.`);
      await fetchLevels(selectedLanguageId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update level status.');
    }
  };

  // Delete Level
  const handleDeleteLevel = async (levelId) => {
    try {
      const res = await api.delete(`/admin/levels/${levelId}`);
      setSuccessMsg(res.data.message || 'Level deleted successfully.');
      setDeletingLevelId(null);
      await fetchLevels(selectedLanguageId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete level.');
      setDeletingLevelId(null);
    }
  };

  const currentLang = languages.find((l) => String(l.id) === String(selectedLanguageId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DBEAFE]">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#2563EB]" />
            Manage Dynamic Levels
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Configure curriculum tiers, add new levels (Level 7+), and control practice availability.
          </p>
        </div>

        <button
          onClick={() => {
            // Recompute next level number
            const maxNum = levels.reduce((max, lvl) => Math.max(max, lvl.levelNumber), 0);
            setNewLevelNumber(String(maxNum + 1));
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Level
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Language Selector Tabs */}
      <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2.5">
          Select Programming Language
        </label>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => {
            const isSelected = String(lang.id) === String(selectedLanguageId);
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguageId(lang.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-[#F5F9FF] text-[#172554] hover:bg-[#DBEAFE] border border-[#DBEAFE]'
                }`}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Levels Table / Cards */}
      <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#F5F9FF] border-b border-[#DBEAFE] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <span>{currentLang ? currentLang.name : 'Language'} Levels</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A]">
              {levels.length} {levels.length === 1 ? 'Level' : 'Levels'}
            </span>
          </h2>

          <span className="text-xs text-[#64748B]">
            All levels are stored dynamically in MySQL
          </span>
        </div>

        {loadingLevels ? (
          <div className="p-12 text-center">
            <LoadingSpinner message="Loading levels..." />
          </div>
        ) : levels.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-[#DBEAFE] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#172554] mb-1">No levels found</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Add the first level for this language to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              Add Level 1
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#DBEAFE]">
            {levels.map((lvl) => {
              const isEditing = editingLevelId === lvl.id;
              const isEmpty = lvl.activeQuestions === 0;

              return (
                <div key={lvl.id} className="p-5 hover:bg-[#F5F9FF]/50 transition-colors">
                  {isEditing ? (
                    // Inline Edit Form
                    <div className="space-y-4 bg-[#F5F9FF] p-4 rounded-xl border border-[#DBEAFE]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                          Editing Level {lvl.levelNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateLevel(lvl.id)}
                            disabled={submittingEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DBEAFE] text-[#64748B] rounded-lg text-xs font-semibold hover:bg-slate-100"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#172554] mb-1">
                            Level Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editLevelNumber}
                            onChange={(e) => setEditLevelNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#DBEAFE] rounded-lg text-xs font-semibold text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-[#172554] mb-1">
                            Level Title
                          </label>
                          <input
                            type="text"
                            maxLength={100}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#DBEAFE] rounded-lg text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#172554] mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DBEAFE] rounded-lg text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                  ) : (
                    // Regular Row Display
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-[#DBEAFE] text-[#1E3A8A]">
                            Level {lvl.levelNumber}
                          </span>

                          <h3 className="text-base font-bold text-[#172554] truncate">
                            {lvl.title}
                          </h3>

                          {lvl.enabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active for Practice
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Disabled
                            </span>
                          )}

                          {isEmpty ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Empty Level — Needs Questions
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-[#64748B]">
                              {lvl.activeQuestions} active question{lvl.activeQuestions === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#64748B] line-clamp-2 max-w-3xl">
                          {lvl.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                        {/* Contribute Question link if empty */}
                        {isEmpty && (
                          <Link
                            to="/upload"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-600" /> Add Question
                          </Link>
                        )}

                        {/* View Questions */}
                        <Link
                          to={`/levels/${lvl.id}/questions`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#DBEAFE] rounded-lg text-xs font-semibold transition-colors"
                        >
                          View Problems ({lvl.activeQuestions})
                        </Link>

                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(lvl)}
                          title={lvl.enabled ? 'Disable Level' : 'Enable Level'}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            lvl.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {lvl.enabled ? (
                            <span className="flex items-center gap-1 px-1">
                              <ToggleRight className="w-4 h-4 text-emerald-600" /> Enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-1">
                              <ToggleLeft className="w-4 h-4 text-slate-500" /> Disabled
                            </span>
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => startEdit(lvl)}
                          className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#DBEAFE]/50 rounded-lg border border-[#DBEAFE] transition-colors"
                          title="Edit Level"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button (safely disabled if has questions) */}
                        <button
                          onClick={() => {
                            if (lvl.totalQuestions > 0) {
                              setErrorMsg(
                                `Cannot delete Level ${lvl.levelNumber} because it contains ${lvl.totalQuestions} question(s). You can disable the level instead to prevent new practice.`
                              );
                            } else {
                              setDeletingLevelId(lvl.id);
                            }
                          }}
                          className={`p-2 rounded-lg border transition-colors ${
                            lvl.totalQuestions > 0
                              ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                              : 'text-rose-600 hover:bg-rose-50 border-rose-200'
                          }`}
                          title={
                            lvl.totalQuestions > 0
                              ? 'Cannot delete: level contains questions. Disable it instead.'
                              : 'Delete empty level'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Box */}
                  {deletingLevelId === lvl.id && (
                    <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                      <div className="text-xs text-rose-800">
                        Are you sure you want to delete <strong>Level {lvl.levelNumber}: {lvl.title}</strong>? This action cannot be undone.
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteLevel(lvl.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeletingLevelId(null)}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Level Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DBEAFE] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DBEAFE]">
              <h3 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2563EB]" />
                Add Level for {currentLang?.name}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLevel} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1">
                    Level Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLevelNumber}
                    onChange={(e) => setNewLevelNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs font-semibold text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Next in sequence</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] mb-1">
                    Level Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g., Dynamic Memory & Trees"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172554] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what topics or core competencies this curriculum level covers..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={newEnabled}
                  onChange={(e) => setNewEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-[#DBEAFE]"
                />
                <label htmlFor="enabledCheck" className="text-xs font-medium text-[#172554]">
                  Enable immediately for student practice
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DBEAFE]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#DBEAFE] text-[#64748B] hover:bg-[#F5F9FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {submittingAdd ? 'Creating...' : 'Create Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
