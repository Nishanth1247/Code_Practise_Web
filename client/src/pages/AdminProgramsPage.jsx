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
  ShieldAlert,
  Terminal,
  Cpu,
  GitBranch,
  Database,
  Award,
  Flame,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

// Icon catalog for program visual identities
const ICON_OPTIONS = [
  { id: 'Code', label: 'Code', icon: FileCode },
  { id: 'Cpu', label: 'CPU & Systems', icon: Cpu },
  { id: 'Layers', label: 'Object / OOP', icon: Layers },
  { id: 'Terminal', label: 'Terminal', icon: Terminal },
  { id: 'GitBranch', label: 'Algorithms / DSA', icon: GitBranch },
  { id: 'Database', label: 'Database', icon: Database },
  { id: 'BookOpen', label: 'Curriculum', icon: BookOpen },
  { id: 'Award', label: 'Mastery', icon: Award },
  { id: 'Flame', label: 'Challenge', icon: Flame }
];

function ProgramIcon({ iconName, className = 'w-5 h-5' }) {
  const match = ICON_OPTIONS.find(i => i.id === iconName);
  const IconComp = match ? match.icon : FileCode;
  return <IconComp className={className} />;
}

// Supported Judge0 Runtime Compilers
const SYSTEM_COMPILERS = [
  { languageId: 1, slug: 'c', label: 'C', compilerName: 'GCC 9.2.0', judge0Id: 50, desc: 'ISO C11 (GNU GCC)' },
  { languageId: 2, slug: 'cpp', label: 'C++', compilerName: 'GCC 9.2.0', judge0Id: 54, desc: 'ISO C++17 (GNU G++)' },
  { languageId: 3, slug: 'java', label: 'Java', compilerName: 'OpenJDK 13', judge0Id: 62, desc: 'OpenJDK 13.0.1' },
  { languageId: 4, slug: 'python', label: 'Python', compilerName: 'Python 3.8.1', judge0Id: 71, desc: 'CPython 3.8.1' }
];

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Notifications
  const [notification, setNotification] = useState(null);

  // Program / Course Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Code');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCourseType, setFormCourseType] = useState('CODING');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formCompilers, setFormCompilers] = useState([1]); // default C
  const [formLevelCount, setFormLevelCount] = useState(5);
  const [formLevels, setFormLevels] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Level reduction confirmation modal
  const [levelReductionWarning, setLevelReductionWarning] = useState(null);

  // Program Level Manager Drawer
  const [managingProgram, setManagingProgram] = useState(null);
  const [managingLevels, setManagingLevels] = useState([]);
  const [managingLoading, setManagingLoading] = useState(false);

  // Delete Program Modal
  const [deletingProgram, setDeletingProgram] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch programs
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
    fetchPrograms();
  }, [fetchPrograms]);

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Generate levels helper
  const generateLevelList = (count, existing = []) => {
    const list = [];
    const defaultTitles = [
      'Fundamentals & Basic Syntax',
      'Variables, Operators & Expressions',
      'Control Flow & Branching',
      'Loops & Iterative Logic',
      'Arrays & Sequence Structures',
      'Functions & Modular Design',
      'Pointers, References & Memory',
      'Object-Oriented Design & Classes',
      'Data Structures & STL Basics',
      'Recursion & Divide and Conquer',
      'Sorting, Searching & Pointers',
      'Stacks, Queues & Monotonic Sequences',
      'Trees, Heaps & Priority Queues',
      'Graphs & Advanced Search',
      'Dynamic Programming & Optimization'
    ];

    for (let i = 1; i <= count; i++) {
      const match = existing.find(l => (l.level_number || l.levelNumber) === i);
      list.push({
        id: match?.id || null,
        level_number: i,
        title: match?.title || defaultTitles[i - 1] || `Level ${i}: Advanced Challenges`,
        description: match?.description || '',
        enabled: match?.enabled !== false
      });
    }
    return list;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('Code');
    setFormImageUrl('');
    setFormCourseType('CODING');
    setFormStatus('ACTIVE');
    setFormCompilers([1, 2, 3, 4]); // default select all 4 compilers
    setFormLevelCount(5);
    setFormLevels(generateLevelList(5));
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (prog) => {
    setEditingProgram(prog);
    setFormName(prog.name);
    setFormDescription(prog.description || '');
    setFormIcon(prog.icon || 'Code');
    setFormImageUrl(prog.imageUrl || prog.image_url || '');
    setFormCourseType(prog.courseType || prog.course_type || 'CODING');
    setFormStatus(prog.status);
    setFormError('');

    // Pre-select compilers
    const compilerLangIds = (prog.compilers || []).map(c => c.language_id);
    setFormCompilers(compilerLangIds.length > 0 ? compilerLangIds : (prog.course_type === 'THEORY' || prog.courseType === 'THEORY') ? [] : [1]);

    // Fetch existing levels for this program
    try {
      setFormLoading(true);
      const res = await api.get(`/admin/courses/${prog.id}/levels`);
      const lvls = res.data.levels || [];
      const count = lvls.length > 0 ? lvls.length : 5;
      setFormLevelCount(count);
      setFormLevels(lvls.length > 0 ? lvls.map(l => ({
        id: l.id,
        level_number: l.levelNumber || l.level_number,
        title: l.title,
        description: l.description || '',
        enabled: l.enabled !== false,
        totalQuestions: l.totalQuestions || 0
      })) : generateLevelList(5));
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load program levels for edit:', err);
      setFormLevelCount(5);
      setFormLevels(generateLevelList(5));
      setIsModalOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Level Count Change in modal
  const handleLevelCountChange = (newCount) => {
    const safeCount = Math.min(20, Math.max(1, parseInt(newCount, 10) || 1));
    setFormLevelCount(safeCount);
    setFormLevels(prev => generateLevelList(safeCount, prev));
  };

  // Add individual level
  const handleAddLevel = () => {
    setFormLevels(prev => {
      const nextNum = prev.length + 1;
      return [
        ...prev,
        {
          id: null,
          level_number: nextNum,
          title: `Level ${nextNum}: Topic Mastery`,
          description: '',
          enabled: true
        }
      ];
    });
    setFormLevelCount(prev => prev + 1);
  };

  // Remove individual level
  const handleRemoveLevel = (index) => {
    if (formLevels.length <= 1) return;
    const target = formLevels[index];
    if (target.totalQuestions > 0) {
      setNotification({
        type: 'error',
        message: `Level ${target.level_number} contains ${target.totalQuestions} question(s). Populated levels cannot be deleted without confirmation.`
      });
      return;
    }
    const updated = formLevels.filter((_, i) => i !== index).map((lvl, idx) => ({
      ...lvl,
      level_number: idx + 1
    }));
    setFormLevels(updated);
    setFormLevelCount(updated.length);
  };

  // Update level field in modal
  const handleLevelFieldChange = (index, field, value) => {
    setFormLevels(prev => prev.map((lvl, i) => i === index ? { ...lvl, [field]: value } : lvl));
  };

  // Toggle compiler selection
  const handleToggleCompiler = (langId) => {
    setFormCompilers(prev => {
      if (prev.includes(langId)) {
        if (formCourseType === 'CODING' && prev.length <= 1) {
          setFormError('At least one supported compiler must remain selected for coding practice tracks.');
          return prev;
        }
        return prev.filter(id => id !== langId);
      } else {
        return [...prev, langId];
      }
    });
    setFormError('');
  };

  // Save Program (Create or Update)
  const handleSubmitProgram = async (e, confirmLevelReduction = false) => {
    if (e) e.preventDefault();

    if (!formName.trim() || formName.trim().length < 3) {
      setFormError('Course name must be at least 3 characters.');
      return;
    }

    if (formCourseType === 'CODING' && formCompilers.length === 0) {
      setFormError('Please select at least one supported compiler/language for coding courses.');
      return;
    }

    // Validate level titles
    for (const lvl of formLevels) {
      if (!lvl.title || lvl.title.trim().length < 2) {
        setFormError(`Level ${lvl.level_number} must have a valid title (minimum 2 characters).`);
        return;
      }
    }

    setFormLoading(true);
    setFormError('');

    const compilersPayload = formCompilers.map(langId => {
      const conf = SYSTEM_COMPILERS.find(sc => sc.languageId === langId);
      return {
        language_id: langId,
        compiler_id: conf.judge0Id,
        compiler_name: conf.compilerName
      };
    });

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      icon: formIcon,
      course_type: formCourseType,
      image_url: formImageUrl.trim() || null,
      status: formStatus,
      compilers: formCourseType === 'THEORY' && formCompilers.length === 0 ? [] : compilersPayload,
      levels: formLevels.map(lvl => ({
        id: lvl.id || undefined,
        level_number: lvl.level_number,
        title: lvl.title.trim(),
        description: (lvl.description || '').trim(),
        enabled: lvl.enabled !== false
      })),
      confirm_level_reduction: confirmLevelReduction
    };

    try {
      if (editingProgram) {
        await api.patch(`/admin/courses/${editingProgram.id}`, payload);
        setNotification({ type: 'success', message: `Course '${payload.name}' updated successfully!` });
      } else {
        await api.post('/admin/courses', payload);
        setNotification({ type: 'success', message: `Course '${payload.name}' created with ${formLevels.length} independent level(s)!` });
      }

      setIsModalOpen(false);
      setLevelReductionWarning(null);
      fetchPrograms();
    } catch (err) {
      if (err.response?.data?.code === 'POPULATED_LEVEL_REDUCTION') {
        setLevelReductionWarning(err.response.data);
      } else {
        setFormError(err.response?.data?.error || 'Failed to save course.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Open Level Manager Drawer
  const handleOpenLevelManager = async (prog) => {
    setManagingProgram(prog);
    setManagingLoading(true);
    try {
      const res = await api.get(`/admin/courses/${prog.id}/levels`);
      setManagingLevels(res.data.levels || []);
    } catch (err) {
      console.error('Failed to load levels:', err);
      setNotification({ type: 'error', message: 'Failed to load levels for course.' });
    } finally {
      setManagingLoading(false);
    }
  };

  // Toggle Level Enabled State inside Drawer
  const handleToggleLevelEnabled = async (lvl) => {
    try {
      await api.patch(`/admin/courses/${managingProgram.id}/levels/${lvl.id}`, {
        enabled: !lvl.enabled
      });
      setManagingLevels(prev => prev.map(l => l.id === lvl.id ? { ...l, enabled: !l.enabled } : l));
      setNotification({ type: 'success', message: `Level ${lvl.levelNumber} status updated.` });
      fetchPrograms();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to update level.' });
    }
  };

  // Delete Program Confirmation
  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/courses/${deletingProgram.id}`);
      setNotification({
        type: 'success',
        message: `Course '${deletingProgram.name}' deleted. Questions and submissions remain preserved.`
      });
      setDeletingProgram(null);
      fetchPrograms();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.error || 'Failed to delete course.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm transition-all animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-1">
            <BookOpen className="w-4 h-4" />
            Curriculum & Course Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">
            Practice Courses Management
          </h1>
          <p className="text-[#64748B] text-xs sm:text-sm mt-1 max-w-2xl">
            Create and manage self-contained practice courses with customizable level progressions, coding vs theory tracks, and compiler runtime restrictions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Practice Course
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
            Total Courses
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">{counts.total || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Active Courses
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{counts.active || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Inactive Courses
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-700">{counts.inactive || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block mb-1">
            Judge0 Compilers
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB]">4 Supported</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses by name or description..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] font-semibold focus:outline-none focus:border-[#2563EB] focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Courses Only</option>
            <option value="INACTIVE">Inactive Courses</option>
          </select>
        </div>
      </div>

      {/* Program Grid */}
      {loading ? (
        <LoadingSpinner message="Loading practice courses..." />
      ) : programs.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Create your first practice course with customized levels and allowed compilers."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog) => {
            const isActive = prog.status === 'ACTIVE';
            const isTheory = prog.courseType === 'THEORY' || prog.course_type === 'THEORY';
            return (
              <div
                key={prog.id}
                className="p-6 bg-white border border-[#DBEAFE] hover:border-[#2563EB] rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Icon, Course Type and Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                        <ProgramIcon iconName={prog.icon} className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isTheory
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isTheory ? 'Theory Course' : 'Coding Practice'}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {prog.status}
                    </span>
                  </div>

                  {/* Title & Slug */}
                  <h3 className="text-lg font-bold text-[#1E3A8A] mb-1 group-hover:text-[#2563EB] transition-colors">
                    {prog.name}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold text-[#64748B] block mb-3">
                    /{prog.slug}
                  </span>

                  <p className="text-xs text-[#64748B] line-clamp-2 mb-4 min-h-[32px]">
                    {prog.description || 'Independent practice course with progressive levels.'}
                  </p>

                  {/* Compilers Badges */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                      Allowed Compilers:
                    </span>
                    {isTheory ? (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-block">
                        Conceptual / Reading (No code compilers required)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(prog.compilers || []).map((comp) => (
                          <span
                            key={comp.compiler_id || comp.language_slug}
                            className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE]"
                            title={`Judge0 ID ${comp.compiler_id}: ${comp.compiler_name}`}
                          >
                            {comp.language_name} ({comp.compiler_name})
                          </span>
                        ))}
                        {(!prog.compilers || prog.compilers.length === 0) && (
                          <span className="text-xs text-rose-500 font-semibold">No compilers configured</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Levels</span>
                      <span className="text-sm font-extrabold text-[#1E3A8A]">{prog.levelCount || 0} Levels</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Questions</span>
                      <span className="text-sm font-extrabold text-[#1E3A8A]">{prog.questionCount || 0} Problems</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenLevelManager(prog)}
                    className="px-3 py-1.5 rounded-lg bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                    Manage Levels
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(prog)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF] transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProgram(prog)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE / EDIT PROGRAM MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-[#DBEAFE] rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DBEAFE] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB]">
                  <ProgramIcon iconName={formIcon} className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">
                    {editingProgram ? 'Edit Practice Course' : 'Create Practice Course'}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Configure independent ordered levels and Judge0 compiler runtime permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Scrollable Body */}
            <form onSubmit={handleSubmitProgram} className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
              {/* SECTION 1: Identity */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider border-b border-[#DBEAFE] pb-1.5">
                  1. Practice Course Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Sliding Window, Dynamic Programming, C Programming, DSA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                      Course Status *
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="ACTIVE">ACTIVE (Visible to learners)</option>
                      <option value="INACTIVE">INACTIVE (Draft / Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Course Type (Coding vs Theory) */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                    Course Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormCourseType('CODING')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formCourseType === 'CODING'
                          ? 'bg-[#F5F9FF] border-[#2563EB] ring-2 ring-[#2563EB]/20'
                          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#1E3A8A] flex items-center justify-between">
                        <span>Coding Practice</span>
                        {formCourseType === 'CODING' && <Check className="w-4 h-4 text-[#2563EB]" />}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Interactive problems with Judge0 code execution, live test cases, and compiler limits.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCourseType('THEORY')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formCourseType === 'THEORY'
                          ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-600/20'
                          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="font-bold text-xs text-purple-950 flex items-center justify-between">
                        <span>Theory / Conceptual</span>
                        {formCourseType === 'THEORY' && <Check className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Reading and conceptual questions. No Judge0 execution or compiler runtimes required.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief overview of curriculum topics, learning objectives, and progression."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-medium focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                      Cover Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://example.com/course-banner.png"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs font-medium focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
                    Visual Identity Icon
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ICON_OPTIONS.map((item) => {
                      const isSelected = formIcon === item.id;
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormIcon(item.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                              : 'bg-[#F8FAFC] text-[#1E3A8A] border-[#E2E8F0] hover:bg-[#F5F9FF]'
                          }`}
                        >
                          <IconComp className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Allowed Compilers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#DBEAFE] pb-1.5">
                  <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                    2. Allowed Compilers & Runtimes (Judge0)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#2563EB]">
                    {formCourseType === 'THEORY' ? 'None needed (Theory)' : `${formCompilers.length} Selected`}
                  </span>
                </div>

                {formCourseType === 'THEORY' ? (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                    This is a <strong>Theory Course</strong>. Learners explore conceptual questions and do not require code execution. Compilers are optional.
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">
                    Learners solving questions in this course will only be permitted to execute code with the selected compiler runtimes.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SYSTEM_COMPILERS.map((comp) => {
                    const isChecked = formCompilers.includes(comp.languageId);
                    return (
                      <div
                        key={comp.languageId}
                        onClick={() => handleToggleCompiler(comp.languageId)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'bg-[#F5F9FF] border-[#2563EB] shadow-xs'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by div click
                          className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB] pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1E3A8A]">{comp.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              Judge0 #{comp.judge0Id}
                            </span>
                          </div>
                          <span className="text-xs text-[#2563EB] font-mono font-medium block">
                            {comp.compilerName}
                          </span>
                          <span className="text-[11px] text-[#64748B] block mt-0.5">
                            {comp.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Independent Ordered Levels */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DBEAFE] pb-1.5">
                  <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                    3. Independent Level Progression ({formLevels.length} Levels)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#64748B] font-medium">Quick Count:</span>
                    {[3, 5, 7, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleLevelCountChange(cnt)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                          formLevelCount === cnt
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:bg-[#F5F9FF]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {formLevels.map((lvl, index) => (
                    <div
                      key={lvl.level_number}
                      className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3 transition-colors hover:border-[#CBD5E1]"
                    >
                      <span className="w-8 h-8 rounded-lg bg-[#2563EB] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {lvl.level_number}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={lvl.title}
                          onChange={(e) => handleLevelFieldChange(index, 'title', e.target.value)}
                          placeholder={`Level ${lvl.level_number} Title`}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#172554] font-semibold focus:outline-none focus:border-[#2563EB]"
                          required
                        />
                        <input
                          type="text"
                          value={lvl.description}
                          onChange={(e) => handleLevelFieldChange(index, 'description', e.target.value)}
                          placeholder="Optional level summary / topics"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLevelFieldChange(index, 'enabled', !lvl.enabled)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                            lvl.enabled ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={lvl.enabled ? 'Enabled' : 'Disabled'}
                        >
                          {lvl.enabled ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel(index)}
                          disabled={formLevels.length <= 1}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30"
                          title="Remove Level"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddLevel}
                    className="w-full py-2 border-2 border-dashed border-[#DBEAFE] hover:border-[#2563EB] rounded-xl text-xs font-bold text-[#2563EB] hover:bg-[#F5F9FF] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Level
                  </button>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#DBEAFE] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#172554] text-xs font-bold hover:bg-[#F5F9FF] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmitProgram(e, false)}
                disabled={formLoading}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {formLoading ? 'Saving...' : editingProgram ? 'Save Course Changes' : 'Create Practice Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEVEL REDUCTION WARNING MODAL ================= */}
      {levelReductionWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-rose-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Populated Level Truncation Warning</h3>
                <span className="text-xs text-rose-700">Explicit confirmation required</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Reducing the level count will remove levels that currently contain registered questions:
            </p>

            <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/50 border border-rose-100 max-h-48 overflow-y-auto">
              {(levelReductionWarning.populatedLevels || []).map(l => (
                <div key={l.id} className="text-xs font-semibold text-rose-900 flex items-center justify-between">
                  <span>Level {l.level_number}: {l.title}</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                    {l.question_count} Question(s)
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#64748B]">
              Questions in deleted levels will be safely preserved in the database and unlinked from the program so no user submissions or test cases are lost.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLevelReductionWarning(null)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs font-bold hover:bg-[#F5F9FF]"
              >
                Abort & Keep Levels
              </button>
              <button
                type="button"
                onClick={() => handleSubmitProgram(null, true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Truncation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEVEL MANAGEMENT DRAWER ================= */}
      {managingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-xl h-full bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-[#DBEAFE]">
              <div>
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#F5F9FF] px-2 py-0.5 rounded-md">
                  Track: {managingProgram.name}
                </span>
                <h2 className="text-xl font-bold text-[#1E3A8A] mt-1">Level Management</h2>
              </div>
              <button
                onClick={() => setManagingProgram(null)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-3">
              {managingLoading ? (
                <LoadingSpinner message="Loading levels..." />
              ) : managingLevels.length === 0 ? (
                <EmptyState title="No levels configured" description="Add levels to this program." icon={Layers} />
              ) : (
                managingLevels.map(lvl => (
                  <div
                    key={lvl.id}
                    className="p-4 bg-white border border-[#DBEAFE] rounded-2xl shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#2563EB] text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {lvl.levelNumber || lvl.level_number}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#1E3A8A]">{lvl.title}</h4>
                        <span className="text-[11px] text-[#64748B] block">
                          {lvl.totalQuestions} Questions ({lvl.activeQuestions || 0} Active)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleLevelEnabled(lvl)}
                      className="p-1.5 rounded-xl hover:bg-[#F5F9FF] transition-colors"
                      title={lvl.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {lvl.enabled ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-[#DBEAFE] flex justify-end">
              <button
                onClick={() => setManagingProgram(null)}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingProgram && (
        <ConfirmationModal
          isOpen={Boolean(deletingProgram)}
          title="Delete Program Track?"
          message={`Are you sure you want to delete '${deletingProgram.name}'? All existing questions, levels, and user submissions remain preserved in the system.`}
          confirmLabel="Delete Program"
          confirmVariant="danger"
          isLoading={deleteLoading}
          onConfirm={handleDeleteProgram}
          onCancel={() => setDeletingProgram(null)}
        />
      )}
    </div>
  );
}
