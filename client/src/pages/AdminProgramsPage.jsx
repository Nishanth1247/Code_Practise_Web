import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileCode,
  X,
  Save,
  Check,
  Eye,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Notifications
  const [notification, setNotification] = useState(null);

  // Program Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formLanguageIds, setFormLanguageIds] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Program Details Modal (Inspect Associated Levels & Questions)
  const [inspectProgramId, setInspectProgramId] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Delete Program Modal
  const [deletingProgram, setDeletingProgram] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load languages
  const fetchLanguages = useCallback(async () => {
    try {
      const res = await api.get('/languages');
      setLanguages(res.data.languages || []);
    } catch (err) {
      console.error('Failed to load supported languages:', err);
    }
  }, []);

  // Load programs
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/programs', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20
        }
      });
      setPrograms(res.data.programs || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setCounts(res.data.counts || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      console.error('Failed to load programs:', err);
      setNotification({ type: 'error', message: 'Failed to load programs.' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProgram(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    // Pre-select all available languages by default for convenience
    setFormLanguageIds(languages.map(l => l.id));
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prog) => {
    setEditingProgram(prog);
    setFormName(prog.name || '');
    setFormDescription(prog.description || '');
    setFormStatus(prog.status || 'ACTIVE');
    setFormLanguageIds(prog.languages ? prog.languages.map(l => l.id) : []);
    setFormError('');
    setIsModalOpen(true);
  };

  // Toggle Language Checkbox
  const handleLanguageToggle = (langId) => {
    setFormLanguageIds(prev => {
      if (prev.includes(langId)) {
        return prev.filter(id => id !== langId);
      } else {
        return [...prev, langId];
      }
    });
    setFormError('');
  };

  // Save Program (Create or Update)
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || formName.trim().length < 3) {
      setFormError('Program name must be at least 3 characters long.');
      return;
    }

    if (formLanguageIds.length === 0) {
      setFormError('Please select at least one supported programming language for this program.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingProgram) {
        // Update existing program
        const res = await api.patch(`/admin/programs/${editingProgram.id}`, {
          name: formName.trim(),
          description: formDescription.trim(),
          status: formStatus,
          language_ids: formLanguageIds
        });
        setNotification({
          type: 'success',
          message: res.data.message || `Program '${formName}' updated successfully.`
        });
      } else {
        // Create new program
        const res = await api.post('/admin/programs', {
          name: formName.trim(),
          description: formDescription.trim(),
          status: formStatus,
          language_ids: formLanguageIds
        });
        setNotification({
          type: 'success',
          message: res.data.message || `Program '${formName}' created successfully.`
        });
      }

      setIsModalOpen(false);
      await fetchPrograms();
    } catch (err) {
      console.error('Failed to save program:', err);
      setFormError(err.response?.data?.error || 'Failed to save program.');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status (Activate / Deactivate)
  const handleToggleStatus = async (prog) => {
    const nextStatus = prog.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/programs/${prog.id}`, { status: nextStatus });
      setNotification({
        type: 'success',
        message: `Program '${prog.name}' is now ${nextStatus.toLowerCase()}. Questions remain fully preserved.`
      });
      await fetchPrograms();
    } catch (err) {
      console.error('Failed to toggle program status:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update program status.'
      });
    }
  };

  // Inspect Program Details
  const handleInspectProgram = async (progId) => {
    setInspectProgramId(progId);
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/programs/${progId}`);
      setInspectData(res.data);
    } catch (err) {
      console.error('Failed to load program inspection:', err);
      setNotification({ type: 'error', message: 'Failed to load program breakdown.' });
      setInspectProgramId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  // Delete Program Confirm
  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/admin/programs/${deletingProgram.id}`);
      setNotification({
        type: 'success',
        message: res.data.message || `Program '${deletingProgram.name}' deleted successfully.`
      });
      setDeletingProgram(null);
      await fetchPrograms();
    } catch (err) {
      console.error('Failed to delete program:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete program.'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DBEAFE]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Manage Practice Programs</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Create, configure, and manage persistent learning tracks (e.g. Fundamentals, Placements, DSA) across languages.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Program
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DBEAFE] overflow-x-auto pb-1">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            statusFilter === ''
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          All Programs ({counts.total || 0})
        </button>
        <button
          onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          Active Tracks ({counts.active || 0})
        </button>
        <button
          onClick={() => { setStatusFilter('INACTIVE'); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'INACTIVE'
              ? 'bg-slate-600 text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          Inactive ({counts.inactive || 0})
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search programs by name or description..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>
      </div>

      {/* Program Cards */}
      {loading ? (
        <LoadingSpinner message="Loading practice programs..." />
      ) : programs.length === 0 ? (
        <EmptyState
          title="No programs found"
          description="Click 'Create New Program' above to set up a coding practice track."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((prog) => {
            const isActive = prog.status === 'ACTIVE';
            return (
              <div
                key={prog.id}
                className="p-5 bg-white border border-[#DBEAFE] hover:border-[#2563EB] rounded-2xl shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {prog.status}
                    </span>

                    <span className="text-xs font-mono text-[#64748B]">
                      slug: {prog.slug}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1E3A8A]">
                    {prog.name}
                  </h3>

                  {prog.description && (
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                      {prog.description}
                    </p>
                  )}

                  {/* Supported Languages */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Supported Languages ({prog.languageCount || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prog.languages && prog.languages.length > 0 ? (
                        prog.languages.map((l) => (
                          <span
                            key={l.id}
                            className="px-2.5 py-0.5 rounded-lg bg-[#F5F9FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-semibold"
                          >
                            {l.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">None configured</span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#DBEAFE] text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                      <strong>{prog.levelCount || 0}</strong> Levels
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-medium">
                      <FileCode className="w-3.5 h-3.5 text-[#2563EB]" />
                      <strong>{prog.questionCount || 0}</strong> Active Questions
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#DBEAFE] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(prog)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
                        isActive
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={isActive ? 'Deactivate track' : 'Activate track'}
                    >
                      {isActive ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                          Activate
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleInspectProgram(prog.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F9FF] text-[#1E3A8A] hover:bg-[#DBEAFE] border border-[#DBEAFE] text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Inspect levels and questions breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" /> Breakdown
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(prog)}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#1E3A8A] hover:bg-[#F5F9FF] border border-[#CBD5E1] text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => setDeletingProgram(prog)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                      title="Delete program"
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

      {/* Program Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-[#DBEAFE] rounded-3xl shadow-2xl p-6 md:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#DBEAFE] mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1E3A8A]">
                  {editingProgram ? 'Edit Practice Program' : 'Create Practice Program'}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Configure program name, description, and supported languages.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProgram} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fundamentals Practice, Placement Coding Track"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the focus, prerequisites, or target audience for this track..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Supported Languages Checkboxes */}
              <div className="p-4 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                    Select Supported Programming Languages *
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    {formLanguageIds.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Select one or more languages for this track. You can choose a single language (e.g. C) or multiple languages (e.g. C, C++, Java, Python).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {languages.map((lang) => {
                    const isChecked = formLanguageIds.includes(lang.id);
                    return (
                      <label
                        key={lang.id}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-[#2563EB] text-[#1E3A8A] font-bold shadow-2xs'
                            : 'bg-white border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleLanguageToggle(lang.id)}
                          className="w-4 h-4 text-[#2563EB] rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-xs">{lang.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                  Track Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="ACTIVE">ACTIVE (Learners can enroll and practice)</option>
                  <option value="INACTIVE">INACTIVE (Hidden from public practice)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#DBEAFE]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  )}
                  <Save className="w-3.5 h-3.5" />
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Breakdown Inspection Modal */}
      {inspectProgramId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-[#DBEAFE] rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#DBEAFE] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#1E3A8A]">
                  Program Breakdown: {inspectData?.program?.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Associated languages, levels, and practice questions.
                </p>
              </div>
              <button
                onClick={() => setInspectProgramId(null)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {inspectLoading ? (
                <LoadingSpinner message="Loading program breakdown..." />
              ) : inspectData ? (
                <>
                  {/* Languages Summary */}
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
                      Enabled Languages ({inspectData.languages?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {inspectData.languages?.map(l => (
                        <span
                          key={l.id}
                          className="px-3 py-1 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-xs font-bold text-[#1E3A8A]"
                        >
                          {l.name} ({l.slug})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Levels Summary */}
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
                      Associated Levels ({inspectData.totalLevels || 0})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {inspectData.levels?.map(lvl => (
                        <div
                          key={lvl.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-[#172554]">
                            {lvl.language_name} &bull; Level {lvl.level_number}: {lvl.title}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lvl.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {lvl.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
                      Associated Practice Questions ({inspectData.totalQuestions || 0})
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {inspectData.recentQuestions?.map(q => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-xl bg-white border border-[#DBEAFE] text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-[#172554] truncate max-w-md">
                            #{q.id} &bull; {q.title}
                          </span>
                          <span className="text-[11px] text-[#64748B] shrink-0 font-mono">
                            {q.language_name} &bull; L{q.level_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#DBEAFE] shrink-0">
              <button
                type="button"
                onClick={() => setInspectProgramId(null)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingProgram)}
        onClose={() => setDeletingProgram(null)}
        onConfirm={handleDeleteProgram}
        title={`Delete Program '${deletingProgram?.name}'`}
        message="Are you sure you want to delete this program track? All associated questions, levels, and user submissions will remain completely intact in the database."
        confirmText="Delete Program"
        isDanger={true}
        isLoading={deleteLoading}
      />
    </div>
  );
}

export default AdminProgramsPage;
