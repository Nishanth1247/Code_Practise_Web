import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import { Flag, ArrowRight, Filter } from 'lucide-react';

export function AdminReportedQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    async function fetchReported() {
      setLoading(true);
      try {
        const res = await api.get('/admin/questions/reported', {
          params: { status: statusFilter || undefined, page, limit: 15 }
        });
        setQuestions(res.data.questions || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load reported questions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReported();
  }, [statusFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Reported Questions Queue</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Questions flagged by community members. Automatically enters PENDING_REVIEW at 4 reports.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white border border-[#DBEAFE] rounded-xl px-3.5 py-2 self-start sm:self-auto shadow-xs">
          <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none"
          >
            <option value="">All Reported Questions</option>
            <option value="PENDING_REVIEW">Pending Review Only</option>
            <option value="ACTIVE">Active with Reports</option>
            <option value="REMOVED">Removed Questions</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading moderation queue..." />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No reported questions"
          description="The moderation queue is clear! No questions currently match the selected status filter."
          icon={Flag}
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <StatusBadge status={q.status} />
                  <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-[#F5F9FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md">
                    {q.language_name} &bull; Level {q.level_number}
                  </span>
                  <h3 className="text-base font-bold text-[#172554] truncate">{q.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-amber-600" />
                    {q.distinct_report_count} Distinct User Reports
                  </span>
                  <span>&bull;</span>
                  <span>Contributor: <strong className="text-[#172554]">{q.contributor_username}</strong></span>
                  <span>&bull;</span>
                  <span className="text-[#64748B]">
                    Added {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <Link
                  to={`/admin/questions/${q.id}`}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Review Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between text-xs text-[#64748B] font-medium">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF]"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="px-3.5 py-1.5 bg-white border border-[#DBEAFE] rounded-xl text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
