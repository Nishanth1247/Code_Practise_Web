import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { VerdictBadge } from '../components/common/Badge';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Terminal,
  Layers,
  ArrowRight,
  PlusCircle
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await api.get('/progress/overview');
        setData(res.data.stats);
      } catch (err) {
        console.error('Failed to load progress overview:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating your progress statistics..." />;

  const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'];
  const chartData = (data?.byLanguage || []).map((lang, idx) => ({
    name: lang.name,
    solved: lang.solved || 0,
    total: lang.total || 0,
    percentage: lang.percentage || 0,
    color: colors[idx % colors.length]
  }));

  const totalLevels = (data?.byLanguage || []).reduce((acc, l) => acc + (l.totalLevels || 6), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-white border border-[#DBEAFE] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-2">
            <Award className="w-4 h-4" />
            Learning Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A]">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-[#64748B] text-sm mt-1 max-w-xl">
            Track your multi-language problem solves, level completions, and recent submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/languages"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            Browse Practice Tracks
          </Link>
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-[#F5F9FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#DBEAFE] font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-[#2563EB]" />
            Contribute Question
          </Link>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] block font-medium">Total Solved</span>
            <span className="text-2xl font-black text-[#1E3A8A]">{data?.totalSolved || 0}</span>
            <span className="text-[11px] text-[#64748B] block">Out of {data?.totalAvailable || 0} available problems</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-blue-50 text-[#2563EB] rounded-xl border border-[#DBEAFE]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] block font-medium">Platform Completion</span>
            <span className="text-2xl font-black text-[#1E3A8A]">{data?.overallPercentage || 0}%</span>
            <span className="text-[11px] text-[#64748B] block">Across all language tracks</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] block font-medium">Curriculum Tracks</span>
            <span className="text-2xl font-black text-[#1E3A8A]">{data?.byLanguage?.length || 4}</span>
            <span className="text-[11px] text-[#64748B] block">{totalLevels} dynamic tiers active</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Language Solved Chart & Language Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Language Solved Analytics Chart */}
        <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
          <h3 className="text-base font-bold text-[#1E3A8A] mb-1">Solved by Language Track</h3>
          <p className="text-xs text-[#64748B] mb-6">Distribution of your accepted problem solutions across tracks.</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DBEAFE', borderRadius: '12px', color: '#172554', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                />
                <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#DBEAFE] text-center text-xs">
            {chartData.map((entry) => (
              <div key={entry.name}>
                <span className="font-bold block" style={{ color: entry.color }}>
                  {entry.solved} / {entry.total}
                </span>
                <span className="text-[#64748B] text-[11px]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Progress List */}
        <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E3A8A] mb-1">Language Track Progress</h3>
            <p className="text-xs text-[#64748B] mb-6">Your completion rate in each language curriculum.</p>

            <div className="space-y-4">
              {data?.byLanguage?.map((lang) => (
                <div key={lang.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#172554]">{lang.name}</span>
                    <span className="text-[#64748B]">{lang.solved} / {lang.total} Solved ({lang.percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#F5F9FF] rounded-full h-2.5 overflow-hidden border border-[#DBEAFE]">
                    <div
                      className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#DBEAFE]">
            <Link
              to="/languages"
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center gap-1"
            >
              Go to Language Curricula <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="p-6 rounded-2xl bg-white border border-[#DBEAFE] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">Recent Submissions</h3>
          <Link
            to="/submissions"
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold inline-flex items-center gap-1"
          >
            View All Submissions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recentSubmissions?.length === 0 ? (
          <p className="text-xs text-[#64748B] py-4">No recent code submissions recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {data?.recentSubmissions?.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={sub.verdict} />
                  <span className="font-bold text-[#172554]">{sub.question_title}</span>
                </div>
                <div className="flex items-center gap-4 text-[#64748B]">
                  <span className="font-mono text-[#2563EB] uppercase font-bold">{sub.language}</span>
                  <span className="hidden sm:inline text-[#64748B]">{new Date(sub.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
