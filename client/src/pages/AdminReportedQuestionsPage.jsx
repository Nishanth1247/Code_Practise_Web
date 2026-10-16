import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import {
  Flag,
  ArrowRight,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  User,
  Calendar,
  RotateCcw
} from 'lucide-react';

const ALLOWED_REPORT_CATEGORIES = [
  'Incorrect expected output',
  'Incorrect or incomplete test cases',
  'Ambiguous problem statement',
  'Incorrect input/output format',
  'Missing constraints or edge cases',
  'Duplicate question',
  'Incorrect language or level',
  'Other'
];

export function AdminReportedQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [reportCountFilter, setReportCountFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Expandable question reports preview (set of question IDs)
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Delete Question Modal State
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');

  // Fetch reported questions
  const fetchReported = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/questions/reported', {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          reportCount: reportCountFilter || undefined,
          page,
          limit: 15
        }
      });
      setQuestions(res.data.questions || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load reported questions:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load reported questions.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, reportCountFilter, page]);

  useEffect(() => {
    fetchReported();
  }, [fetchReported]);

  // Auto-dismiss notifications after 5s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Toggle report feedback accordion for a question
  const toggleExpanded = (qId) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setReportCountFilter('');
    setPage(1);
  };

  // Delete Question handler
  const handleOpenDelete = (q) => {
    setDeletingQuestion(q);
    setDeleteReason(`Moderation removal by administrator due to community reports.`);
    setDeleteModalError('');
  };

  const handleCloseDelete = () => {
    setDeletingQuestion(null);
    setDeleteReason('');
    setDeleteModalError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    try {
      setIsDeleting(true);
      setDeleteModalError('');
      const res = await api.delete(`/admin/questions/${deletingQuestion.id}`, {
        data: { reason: deleteReason }
      });
      setSuccessMsg(res.data.message || `Question #${deletingQuestion.id} successfully removed from practice.`);
      handleCloseDelete();
      fetchReported();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setDeleteModalError(err.response?.data?.error || 'Failed to delete question.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltering = statusFilter || categoryFilter || reportCountFilter;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Reported Questions Queue</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Questions flagged by community members. Automatically enters PENDING_REVIEW at 4 reports.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-[#2563EB] border border-[#DBEAFE] rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
          <Flag className="w-3.5 h-3.5" />
          {pagination.total} Flagged Questions
        </span>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DBEAFE] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer"
            >
              <option value="">All Question Statuses</option>
              <option value="PENDING_REVIEW">Pending Review Only</option>
              <option value="ACTIVE">Active with Reports</option>
              <option value="REMOVED">Removed Questions</option>
            </select>
          </div>

          {/* Issue Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer max-w-xs truncate"
            >
              <option value="">All Issue Categories</option>
              {ALLOWED_REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Report Count Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
            <Flag className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={reportCountFilter}
              onChange={(e) => {
                setReportCountFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer"
            >
              <option value="">All Report Counts</option>
              <option value="4+">Threshold Reached (4+ Reports)</option>
              <option value="1-3">1 - 3 Reports</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltering && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF] border border-dashed border-[#CBD5E1] rounded-xl flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading moderation queue..." />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No reported questions found"
          description={
            isFiltering
              ? "No questions match your current category, count, or status filters."
              : "The moderation queue is clear! No questions currently have active reports."
          }
          icon={Flag}
          actionText={isFiltering ? "Reset Filters" : undefined}
          onAction={isFiltering ? handleResetFilters : undefined}
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const isExpanded = expandedQuestions.has(q.id);
            const reportList = q.reports || [];
            const isThresholdReached = q.distinct_report_count >= 4;

            return (
              <div
                key={q.id}
                className={`rounded-2xl bg-white border transition-all shadow-xs hover:shadow-sm overflow-hidden ${
                  isThresholdReached ? 'border-amber-300' : 'border-[#DBEAFE]'
                }`}
              >
                {/* Question Card Header Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={q.status} />
                      <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-[#F5F9FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md">
                        {q.language_name} &bull; Level {q.level_number}
                      </span>
                      <span className="text-xs text-[#64748B] font-mono">#{q.id}</span>
                      <h3 className="text-base font-bold text-[#172554] truncate">{q.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] mb-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                          isThresholdReached
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5 shrink-0" />
                        {q.distinct_report_count} Distinct User Reports
                        {isThresholdReached && <span className="text-[10px] uppercase tracking-wider font-extrabold ml-1">(Threshold Met)</span>}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#94A3B8]" />
                        Contributor: <strong className="text-[#172554]">@{q.contributor_username}</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        Created {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Reported Categories Badges */}
                    {q.categories && q.categories.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Reported Issues:</span>
                        {q.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-[#475569] border border-slate-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Expand Button */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-auto">
                    {/* Expand/Collapse Feedback Reports Accordion */}
                    <button
                      onClick={() => toggleExpanded(q.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] text-xs font-semibold flex items-center gap-1.5 border border-[#DBEAFE] transition-colors"
                      title={isExpanded ? 'Collapse feedback reports' : 'Inspect user feedback reports'}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{reportList.length} Feedback {reportList.length === 1 ? 'Report' : 'Reports'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Review Details Link */}
                    <Link
                      to={`/admin/questions/${q.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      Review <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Delete Question Button */}
                    {q.status !== 'REMOVED' && (
                      <button
                        onClick={() => handleOpenDelete(q)}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 transition-colors shadow-2xs"
                        title={`Delete question #${q.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Feedback Preview Panel */}
                {isExpanded && (
                  <div className="p-5 bg-[#F8FAFC] border-t border-[#DBEAFE] space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                        User Feedback & Issue Explanations ({reportList.length})
                      </h4>
                      <span className="text-[11px] text-[#64748B]">Showing newest reports first</span>
                    </div>

                    {reportList.length === 0 ? (
                      <p className="text-xs text-[#64748B] italic">No detailed feedback records found.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {reportList.map((r) => (
                          <div
                            key={r.id}
                            className="p-3.5 bg-white rounded-xl border border-[#DBEAFE] shadow-2xs space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                                {r.reason}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                                <span>Reported by: <strong className="text-[#172554]">@{r.reporterUsername}</strong></span>
                                <span>&bull;</span>
                                <span>{new Date(r.createdAt).toLocaleString()}</span>
                              </div>
                            </div>

                            {r.details ? (
                              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[#1E293B] whitespace-pre-wrap font-sans text-xs leading-relaxed">
                                {r.details}
                              </div>
                            ) : (
                              <p className="text-[#94A3B8] italic text-[11px]">No additional details provided.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between text-xs text-[#64748B] font-medium">
              <span>
                Showing Page <strong className="text-[#172554]">{pagination.page}</strong> of{' '}
                <strong className="text-[#172554]">{pagination.totalPages}</strong> ({pagination.total} questions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF]"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rose-950">Delete Question</h3>
                  <p className="text-xs text-rose-700">Set question status to REMOVED</p>
                </div>
              </div>
              <button
                onClick={handleCloseDelete}
                disabled={isDeleting}
                className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {deleteModalError && (
                <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{deleteModalError}</span>
                </div>
              )}

              <p className="text-xs text-[#475569] leading-relaxed">
                Are you sure you want to delete this question? It will be immediately removed from community practice, code execution, and question catalogs.
              </p>

              {/* Target Question Summary */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#DBEAFE] rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-[#1E3A8A]">
                  #{deletingQuestion.id}: {deletingQuestion.title}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Language: <strong className="text-[#172554]">{deletingQuestion.language_name}</strong> &bull; Level {deletingQuestion.level_number}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Contributor: <strong className="text-[#172554]">@{deletingQuestion.contributor_username}</strong>
                </div>
              </div>

              {/* Audit reason field */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Reason for Removal (Logged in Audit Trail)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Inaccurate test cases confirmed by admin review."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-[#DBEAFE] rounded-xl text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Question
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportedQuestionsPage;
