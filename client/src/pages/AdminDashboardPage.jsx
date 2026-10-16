import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/Badge';
import {
  Users,
  Code2,
  Clock,
  Trash2,
  Flag,
  ArrowRight,
  Layers,
  ShieldCheck
} from 'lucide-react';

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        const res = await api.get('/admin/overview');
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading admin platform metrics..." />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">System Overview</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Platform-wide health, active questions, curriculum management, and moderation queue.
          </p>
        </div>

        <Link
          to="/admin/levels"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          Manage Levels
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-5 bg-white border border-[#DBEAFE] hover:border-[#2563EB] rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white rounded-xl border border-blue-200 transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium group-hover:text-[#2563EB] transition-colors">Total Users</span>
            <span className="text-2xl font-black text-[#1E3A8A] block">{stats?.totalUsers || 0}</span>
          </div>
        </Link>

        <div className="p-5 bg-white border border-[#DBEAFE] rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">Active Questions</span>
            <span className="text-2xl font-black text-[#1E3A8A] block">{stats?.activeQuestions || 0}</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#DBEAFE] rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">Pending Review</span>
            <span className="text-2xl font-black text-amber-600 block">{stats?.pendingReviewQuestions || 0}</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#DBEAFE] rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">Removed Questions</span>
            <span className="text-2xl font-black text-[#64748B] block">{stats?.removedQuestions || 0}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm">
          <h3 className="text-base font-bold text-[#1E3A8A] mb-4">Submission Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#64748B]">Total Code Executions & Submissions</span>
              <span className="font-bold text-[#172554]">{stats?.totalSubmissions || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#64748B]">Accepted Solutions</span>
              <span className="font-bold text-emerald-600">{stats?.acceptedSubmissions || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#64748B]">Overall Acceptance Rate</span>
              <span className="font-bold text-[#2563EB]">{stats?.acceptanceRate || 0}%</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E3A8A] mb-2">Review Queue Action Required</h3>
            <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
              Questions that reach 4 community reports automatically enter Pending Review and are excluded from practice.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 text-sm font-bold">
                <Flag className="w-4 h-4 text-amber-600" />
                <span>{stats?.pendingReviewQuestions || 0} Questions Awaiting Review</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              to="/admin/reported"
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              Open Moderation Queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Community Reports Table */}
      <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-[#1E3A8A] mb-4">Recent Community Reports</h3>

        {stats?.recentReports?.length === 0 ? (
          <p className="text-xs text-[#64748B] py-4">No recent community reports filed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172554]">
              <thead className="border-b border-[#DBEAFE] text-[#64748B] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Reporter</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]">
                {stats?.recentReports?.map((r) => (
                  <tr key={r.report_id} className="hover:bg-[#F5F9FF]">
                    <td className="py-3 px-3 font-bold text-[#172554] max-w-xs truncate">
                      {r.question_title}
                    </td>
                    <td className="py-3 px-3 text-amber-800 font-semibold">{r.reason}</td>
                    <td className="py-3 px-3 text-[#64748B]">{r.reporter_username}</td>
                    <td className="py-3 px-3"><StatusBadge status={r.question_status} /></td>
                    <td className="py-3 px-3 text-[#64748B]">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/questions/${r.question_id}`}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-bold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
