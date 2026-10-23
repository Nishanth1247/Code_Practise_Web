import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import { QuestionEditModal } from '../components/admin/QuestionEditModal';
import { DeleteQuestionModal } from '../components/admin/DeleteQuestionModal';
import {
  FileText,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Flag,
  ThumbsUp,
  Layers
} from 'lucide-react';

export function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, active: 0, pending: 0, removed: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Available options
  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);

  // Modals state
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  // Fetch languages on mount
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const res = await api.get('/languages');
        setLanguages(res.data.languages || []);
      } catch (err) {
        console.error('Failed to load languages for filters:', err);
      }
    }
    fetchLanguages();
  }, []);

  // Fetch levels when languageId changes
  useEffect(() => {
    if (!languageId) {
      setLevels([]);
      setLevelId('');
      return;
    }
    async function fetchLevels() {
      try {
        const res = await api.get(`/languages/${languageId}/levels`);
        setLevels(res.data.levels || []);
      } catch (err) {
        console.error('Failed to load levels for filters:', err);
      }
    }
    fetchLevels();
  }, [languageId]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/questions', {
        params: {
          search: search.trim() || undefined,
          languageId: languageId || undefined,
          levelId: levelId || undefined,
          status: status || undefined,
          sort,
          page,
          limit: 15
        }
      });
      setQuestions(res.data.questions || []);
      setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      setCounts(res.data.counts || { total: 0, active: 0, pending: 0, removed: 0 });
    } catch (err) {
      console.error('Failed to load admin questions:', err);
      setNotification({ type: 'error', message: 'Failed to load questions.' });
    } finally {
      setLoading(false);
    }
  }, [search, languageId, levelId, status, sort, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Delete Confirmation
  const handleDeleteConfirm = async (reason) => {
    if (!deletingQuestion) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/questions/${deletingQuestion.id}`, {
        data: { reason: reason || 'Deleted by administrator' }
      });
      setNotification({
        type: 'success',
        message: res.data.message || `Question #${deletingQuestion.id} removed successfully.`
      });
      setDeletingQuestion(null);
      await fetchQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete question.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DBEAFE]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Question Management</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Browse, inspect, edit, and moderate questions across all programming languages and levels.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/upload"
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Contribute New Question
          </Link>
          <button
            onClick={() => fetchQuestions()}
            className="p-2 rounded-xl border border-[#DBEAFE] bg-white text-[#172554] hover:bg-[#F5F9FF] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DBEAFE] overflow-x-auto pb-1">
        <button
          onClick={() => { setStatus(''); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            status === ''
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          All Statuses ({counts.total || 0})
        </button>
        <button
          onClick={() => { setStatus('ACTIVE'); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            status === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          Active ({counts.active || 0})
        </button>
        <button
          onClick={() => { setStatus('PENDING_REVIEW'); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            status === 'PENDING_REVIEW'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          Pending Review ({counts.pending || 0})
        </button>
        <button
          onClick={() => { setStatus('REMOVED'); setPage(1); }}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            status === 'REMOVED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F9FF]'
          }`}
        >
          Removed ({counts.removed || 0})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title, statement, or ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        {/* Language Filter */}
        <div>
          <select
            value={languageId}
            onChange={(e) => { setLanguageId(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] font-semibold focus:outline-none focus:border-[#2563EB] focus:bg-white"
          >
            <option value="">All Programming Languages</option>
            {languages.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.slug})</option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div>
          <select
            value={levelId}
            onChange={(e) => { setLevelId(e.target.value); setPage(1); }}
            disabled={!languageId}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] font-semibold focus:outline-none focus:border-[#2563EB] focus:bg-white disabled:opacity-50"
          >
            <option value="">{languageId ? 'All Levels' : 'Select a Language First'}</option>
            {levels.map(lvl => (
              <option key={lvl.id} value={lvl.id}>
                Level {lvl.level_number || lvl.levelNumber}: {lvl.title}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F9FF] text-[#172554] font-semibold focus:outline-none focus:border-[#2563EB] focus:bg-white"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title A-Z</option>
            <option value="reports">Sort: Most Reports</option>
          </select>
        </div>
      </div>

      {/* Questions Content */}
      {loading ? (
        <LoadingSpinner message="Loading questions..." />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          description="Try adjusting your search criteria, language, or status filters."
          icon={FileText}
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const isRemoved = q.status === 'REMOVED';
            return (
              <div
                key={q.id}
                className="p-5 bg-white border border-[#DBEAFE] hover:border-[#2563EB] rounded-2xl shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Info Block */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#F5F9FF] border border-[#DBEAFE] px-2 py-0.5 rounded-md">
                      #{q.id}
                    </span>
                    <StatusBadge status={q.status} />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE]">
                      {q.language_name} &bull; Level {q.level_number}
                    </span>
                    {parseInt(q.report_count, 10) > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-600" />
                        {q.report_count} Reports
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/admin/questions/${q.id}`}
                    className="text-base font-bold text-[#1E3A8A] hover:text-[#2563EB] transition-colors block line-clamp-1"
                  >
                    {q.title}
                  </Link>

                  <p className="text-xs text-[#64748B] line-clamp-2">
                    {q.statement}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B]">
                    <span>Contributor: <strong className="text-[#172554]">{q.contributor_username}</strong></span>
                    <span>&bull;</span>
                    <span>Samples: <strong>{q.sample_count || 0}</strong></span>
                    <span>&bull;</span>
                    <span>Test Cases: <strong>{q.test_case_count || 0}</strong></span>
                    <span>&bull;</span>
                    <span>Created: <strong>{new Date(q.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => setEditingQuestionId(q.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#F5F9FF] hover:bg-[#2563EB] text-[#1E3A8A] hover:text-white border border-[#DBEAFE] hover:border-transparent text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                    title="Edit question details, statement, and test cases"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeletingQuestion(q)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs border ${
                      isRemoved
                        ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title={isRemoved ? 'View removal status' : 'Soft-delete question from practice'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isRemoved ? 'Removed' : 'Delete'}
                  </button>

                  <Link
                    to={`/admin/questions/${q.id}`}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F9FF] text-[#172554] hover:text-[#2563EB] border border-[#CBD5E1] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                    title="Inspect reports and submissions"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between text-xs text-[#64748B] font-medium">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total questions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF] transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestionId && (
        <QuestionEditModal
          isOpen={Boolean(editingQuestionId)}
          questionId={editingQuestionId}
          onClose={() => setEditingQuestionId(null)}
          onSuccess={(updated) => {
            setNotification({
              type: 'success',
              message: `Question #${updated.id} ("${updated.title}") updated successfully.`
            });
            fetchQuestions();
          }}
        />
      )}

      {/* Delete Question Modal */}
      {deletingQuestion && (
        <DeleteQuestionModal
          isOpen={Boolean(deletingQuestion)}
          question={deletingQuestion}
          isLoading={isDeleting}
          onClose={() => setDeletingQuestion(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

export default AdminQuestionsPage;
