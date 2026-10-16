import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import { History, ArrowRight } from 'lucide-react';

export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    async function fetchAudit() {
      setLoading(true);
      try {
        const res = await api.get('/admin/questions/audit/all', { params: { page, limit: 20 } });
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load audit history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, [page]);

  if (loading) return <LoadingSpinner message="Loading audit trail records..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Status Audit Trail</h1>
        <p className="text-[#64748B] text-sm mt-1">
          Complete historical audit log of status changes and administrative actions across all questions.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="No status transitions have occurred yet."
          icon={History}
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-sm"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.previous_status} />
                  <span className="text-[#64748B]">&rarr;</span>
                  <StatusBadge status={log.new_status} />
                  <span className="text-[#DBEAFE] ml-2">&bull;</span>
                  <Link
                    to={`/admin/questions/${log.question_id}`}
                    className="font-bold text-[#172554] hover:text-[#2563EB] truncate max-w-sm"
                  >
                    {log.question_title}
                  </Link>
                </div>

                <div className="text-[#64748B]">
                  Reason: <span className="text-[#172554] font-medium">{log.reason}</span>
                </div>

                <div className="text-[11px] text-[#64748B] flex items-center gap-3 font-medium">
                  <span>Logged by: <strong className="text-[#172554]">{log.admin_username || 'System Automation'}</strong></span>
                  <span>&bull;</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>

              <Link
                to={`/admin/questions/${log.question_id}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#F5F9FF] hover:bg-[#2563EB] text-[#1E3A8A] hover:text-white border border-[#DBEAFE] hover:border-transparent text-xs font-semibold flex items-center gap-1 shrink-0 self-end md:self-auto transition-all shadow-2xs"
              >
                Inspect Question <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
