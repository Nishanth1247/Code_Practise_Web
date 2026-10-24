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
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Search,
  BookOpen,
  Code,
  Terminal,
  Cpu,
  Database,
  GitBranch,
  Binary,
  Globe,
  RefreshCw
} from 'lucide-react';

// Dynamic icon resolver matching courses
const ICON_MAP = {
  Code,
  Terminal,
  BookOpen,
  Layers,
  Cpu,
  Database,
  GitBranch,
  Binary,
  Globe
};

export function AdminLevelsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [levels, setLevels] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

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

  // Edit State (modal or inline)
  const [editingLevel, setEditingLevel] = useState(null);
  const [editLevelNumber, setEditLevelNumber] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete State
  const [deletingLevel, setDeletingLevel] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Load courses dynamically from /api/courses or /api/admin/courses
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      // Try admin endpoint first for full visibility, fall back to public courses
      let courseList = [];
      try {
        const res = await api.get('/admin/courses?limit=100');
        courseList = res.data.programs || res.data.courses || [];
      } catch (adminErr) {
        const res = await api.get('/courses');
        courseList = res.data.programs || res.data.courses || [];
      }

      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(String(courseList[0].id));
      }
    } catch (err) {
      setErrorMsg('Failed to load practice courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch levels for the currently selected course
  const fetchLevels = async (courseId) => {
    if (!courseId) return;
    try {
      setLoadingLevels(true);
      const res = await api.get(`/admin/courses/${courseId}/levels`);
      const fetchedLevels = res.data.levels || [];
      // Sort ascending by levelNumber
      fetchedLevels.sort((a, b) => a.levelNumber - b.levelNumber);
      setLevels(fetchedLevels);

      // Pre-fill next level number for Add modal
      const maxNum = fetchedLevels.reduce((max, lvl) => Math.max(max, lvl.levelNumber), 0);
      setNewLevelNumber(String(maxNum + 1));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch levels for this course.');
      setLevels([]);
    } finally {
      setLoadingLevels(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchLevels(selectedCourseId);
    }
  }, [selectedCourseId]);

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  // Add Level Submit
  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Please enter a level title.');
      return;
    }

    try {
      setSubmittingAdd(true);
      setErrorMsg('');
      const res = await api.post(`/admin/courses/${selectedCourseId}/levels`, {
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
      await fetchLevels(selectedCourseId);
      await fetchCourses(); // Update course level counts
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create level.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Edit Level Handlers
  const openEditModal = (lvl) => {
    setEditingLevel(lvl);
    setEditLevelNumber(String(lvl.levelNumber));
    setEditTitle(lvl.title);
    setEditDescription(lvl.description || '');
  };

  const closeEditModal = () => {
    setEditingLevel(null);
    setEditLevelNumber('');
    setEditTitle('');
    setEditDescription('');
  };

  const handleUpdateLevel = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setErrorMsg('Level title cannot be empty.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setErrorMsg('');
      const res = await api.patch(`/admin/courses/${selectedCourseId}/levels/${editingLevel.id}`, {
        levelNumber: parseInt(editLevelNumber, 10),
        title: editTitle.trim(),
        description: editDescription.trim()
      });

      setSuccessMsg(res.data.message || 'Level updated successfully!');
      closeEditModal();
      await fetchLevels(selectedCourseId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update level.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Toggle level enabled / disabled
  const handleToggleStatus = async (lvl) => {
    try {
      const res = await api.patch(`/admin/courses/${selectedCourseId}/levels/${lvl.id}`, {
        enabled: !lvl.enabled
      });
      setSuccessMsg(res.data.message || `Level ${lvl.levelNumber} updated.`);
      await fetchLevels(selectedCourseId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update level status.');
    }
  };

  // Safe delete handler
  const handleDeleteLevel = async () => {
    if (!deletingLevel) return;
    try {
      setSubmittingDelete(true);
      const res = await api.delete(`/admin/courses/${selectedCourseId}/levels/${deletingLevel.id}?force=${forceDelete}`);
      setSuccessMsg(res.data.message || 'Level deleted successfully.');
      setDeletingLevel(null);
      setForceDelete(false);
      await fetchLevels(selectedCourseId);
      await fetchCourses();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete level.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Reordering: Move level up or down
  const handleMoveLevel = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= levels.length) return;

    // Create shallow copy and swap
    const reordered = [...levels];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Assign sequential level numbers based on new order
    const payload = reordered.map((lvl, idx) => ({
      id: lvl.id,
      levelNumber: idx + 1
    }));

    try {
      setErrorMsg('');
      await api.put(`/admin/courses/${selectedCourseId}/levels/reorder`, {
        levels: payload
      });
      setSuccessMsg('Levels reordered successfully.');
      await fetchLevels(selectedCourseId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reorder levels.');
    }
  };

  // Filter courses by search
  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.slug?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const CourseIcon = selectedCourse?.icon && ICON_MAP[selectedCourse.icon]
    ? ICON_MAP[selectedCourse.icon]
    : Code;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DBEAFE]">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#2563EB]" />
            Dynamic Course Levels Manager
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Configure independent learning levels for any practice course. Reorder curriculum stages and control practice availability.
          </p>
        </div>

        {selectedCourse && (
          <button
            onClick={() => {
              const maxNum = levels.reduce((max, lvl) => Math.max(max, lvl.levelNumber), 0);
              setNewLevelNumber(String(maxNum + 1));
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Level to {selectedCourse.name}
          </button>
        )}
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

      {/* Course Selection Section */}
      <div className="bg-white rounded-xl border border-[#DBEAFE] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Select Practice Course ({courses.length})
          </label>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        {loadingCourses ? (
          <div className="py-6 text-center">
            <LoadingSpinner message="Loading courses..." />
          </div>
        ) : filteredCourses.length === 0 ? (
          <p className="text-sm text-[#64748B] py-2">No matching practice courses found.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {filteredCourses.map((c) => {
              const isSelected = String(c.id) === String(selectedCourseId);
              const ItemIcon = c.icon && ICON_MAP[c.icon] ? ICON_MAP[c.icon] : Code;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(String(c.id))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                      : 'bg-[#F5F9FF] text-[#172554] border-[#DBEAFE] hover:bg-[#DBEAFE]'
                  }`}
                >
                  <ItemIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#2563EB]'}`} />
                  <span>{c.name}</span>
                  {c.course_type === 'THEORY' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      THEORY
                    </span>
                  )}
                  {c.levelCount !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-[#DBEAFE] text-[#1E3A8A]'
                    }`}>
                      {c.levelCount} {c.levelCount === 1 ? 'lvl' : 'lvls'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Course Overview Card */}
      {selectedCourse && (
        <div className="bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[#DBEAFE] text-[#2563EB] shadow-xs">
                <CourseIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[#1E3A8A]">
                    {selectedCourse.name}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white border border-[#DBEAFE] text-[#64748B]">
                    /{selectedCourse.slug}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCourse.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {selectedCourse.status || 'ACTIVE'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {selectedCourse.course_type || 'CODING'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
                  {selectedCourse.description || 'No description provided for this course.'}
                </p>

                {/* Compiler runtime badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] font-semibold text-[#64748B]">Permitted Compilers:</span>
                  {selectedCourse.course_type === 'THEORY' ? (
                    <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Conceptual / Theoretical (No runtime required)
                    </span>
                  ) : (selectedCourse.compilers && selectedCourse.compilers.length > 0) ? (
                    selectedCourse.compilers.map((c) => (
                      <span key={c.compiler_id || c.language_id} className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#DBEAFE] text-[#1E3A8A]">
                        {c.compiler_name || c.language_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#94A3B8] italic">No compilers assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => fetchLevels(selectedCourseId)}
                className="p-2 text-[#64748B] hover:text-[#1E3A8A] hover:bg-white rounded-lg border border-[#DBEAFE] transition-colors"
                title="Refresh levels"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                to={`/upload?course=${selectedCourse.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#DBEAFE]/40 text-[#1E3A8A] border border-[#DBEAFE] rounded-xl text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                Contribute Problem
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Levels Table / Cards */}
      <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#F5F9FF] border-b border-[#DBEAFE] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <span>Levels for {selectedCourse?.name || 'Selected Course'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A]">
              {levels.length} {levels.length === 1 ? 'Level' : 'Levels'}
            </span>
          </h2>

          <span className="text-xs text-[#64748B] hidden sm:inline">
            Each level has its own independent curriculum tier & questions
          </span>
        </div>

        {loadingLevels ? (
          <div className="p-12 text-center">
            <LoadingSpinner message="Loading course levels..." />
          </div>
        ) : levels.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-[#DBEAFE] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#172554] mb-1">No levels configured yet</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Add Level 1 to start creating the learning progression for {selectedCourse?.name}.
            </p>
            <button
              onClick={() => {
                setNewLevelNumber('1');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              Create Level 1
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#DBEAFE]">
            {levels.map((lvl, index) => {
              const isEmpty = lvl.activeQuestions === 0;

              return (
                <div key={lvl.id} className="p-5 hover:bg-[#F5F9FF]/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Reorder and Content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Order Controls */}
                      <div className="flex flex-col gap-1 items-center pt-0.5 shrink-0">
                        <button
                          onClick={() => handleMoveLevel(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-[#64748B] hover:text-[#2563EB] hover:bg-[#DBEAFE]/40 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move level up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveLevel(index, 'down')}
                          disabled={index === levels.length - 1}
                          className="p-1 text-[#64748B] hover:text-[#2563EB] hover:bg-[#DBEAFE]/40 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move level down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto ml-7 md:ml-0">
                      {/* Add Question Shortcut if empty */}
                      {isEmpty && (
                        <Link
                          to={`/upload?course=${selectedCourseId}&level=${lvl.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-600" /> Add Question
                        </Link>
                      )}

                      {/* View Problems */}
                      <Link
                        to={`/levels/${lvl.id}/questions`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#DBEAFE] rounded-lg text-xs font-semibold transition-colors"
                      >
                        View ({lvl.activeQuestions})
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
                        onClick={() => openEditModal(lvl)}
                        className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#DBEAFE]/50 rounded-lg border border-[#DBEAFE] transition-colors"
                        title="Edit Level"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setDeletingLevel(lvl);
                          setForceDelete(false);
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          lvl.totalQuestions > 0
                            ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                            : 'text-rose-600 hover:bg-rose-50 border-rose-200'
                        }`}
                        title={
                          lvl.totalQuestions > 0
                            ? `Level contains ${lvl.totalQuestions} question(s)`
                            : 'Delete empty level'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
                Add Level to {selectedCourse?.name}
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

      {/* Edit Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DBEAFE] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DBEAFE]">
              <h3 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2563EB]" />
                Edit Level {editingLevel.levelNumber} ({selectedCourse?.name})
              </h3>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1">
                    Level Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editLevelNumber}
                    onChange={(e) => setEditLevelNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs font-semibold text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] mb-1">
                    Level Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
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
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-lg text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DBEAFE]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#DBEAFE] text-[#64748B] hover:bg-[#F5F9FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLevel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">
                  Delete Level {deletingLevel.levelNumber}?
                </h3>
                <p className="text-xs text-[#64748B]">{deletingLevel.title}</p>
              </div>
            </div>

            {deletingLevel.totalQuestions > 0 ? (
              <div className="space-y-3 mb-5">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Populated Level Warning</p>
                    <p className="mt-0.5">
                      This level contains <strong>{deletingLevel.totalQuestions} question(s)</strong>.
                      Deleting it will unassign those questions. It is recommended to disable the level instead to prevent practice without disrupting existing content.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-[#172554] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-[#DBEAFE]"
                  />
                  <span>
                    I understand this will unassign {deletingLevel.totalQuestions} question(s) and wish to force deletion.
                  </span>
                </label>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] mb-5">
                Are you sure you want to delete this level? This level currently has no questions and can be safely removed.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DBEAFE]">
              <button
                type="button"
                onClick={() => {
                  setDeletingLevel(null);
                  setForceDelete(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#DBEAFE] text-[#64748B] hover:bg-[#F5F9FF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLevel}
                disabled={submittingDelete || (deletingLevel.totalQuestions > 0 && !forceDelete)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {submittingDelete ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
