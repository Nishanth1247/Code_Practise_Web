import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { VerdictBadge } from '../components/common/Badge';
import { History, Clock, ArrowRight } from 'lucide-react';

export function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const res = await api.get('/submissions/mine', { params: { page, limit: 15 } });
        setSubmissions(res.data.submissions || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [page]);

  if (loading) return <LoadingSpinner message="Loading your submission history..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Submission History</h1>
        <p className="text-[#64748B] text-sm mt-1">
          Review your past test runs and solution evaluations across all practice tracks.
        </p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions recorded yet"
          description="You haven't submitted any solutions yet. Open any level and start coding to see your submissions here!"
          icon={History}
          action={
            <Link
              to="/languages"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              Start Practicing
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <VerdictBadge verdict={sub.verdict} />
                  <Link
                    to={`/practice/${sub.question_id}`}
                    className="text-sm font-bold text-[#172554] hover:text-[#2563EB] transition-colors truncate"
                  >
                    {sub.question_title}
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <span className="font-mono text-[#2563EB] uppercase font-bold">
                    {sub.language}
                  </span>
                  <span>&bull;</span>
                  <span>Passed: <strong className="text-[#172554]">{sub.passed_test_count} / {sub.total_test_count}</strong> Tests</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#64748B]" /> {sub.execution_time}s
                  </span>
                  <span>&bull;</span>
                  <span className="text-[#64748B]">
                    {new Date(sub.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                to={`/practice/${sub.question_id}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#F5F9FF] hover:bg-[#2563EB] text-[#1E3A8A] hover:text-white border border-[#DBEAFE] hover:border-transparent text-xs font-bold flex items-center gap-1 shrink-0 self-end md:self-auto transition-all shadow-2xs"
              >
                Practice Again <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 flex items-center justify-between text-xs text-[#64748B] font-medium">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DBEAFE] text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF] shadow-xs"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DBEAFE] text-[#172554] disabled:opacity-40 hover:bg-[#F5F9FF] shadow-xs"
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
