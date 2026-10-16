import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  ArrowUpDown,
  CheckCircle2,
  ThumbsUp,
  ArrowLeft,
  ArrowRight,
  User,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

export function QuestionListPage() {
  const { levelId } = useParams();

  const [levelInfo, setLevelInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Sort
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const fetchLevelDetails = async () => {
    try {
      const res = await api.get(`/levels/${levelId}`);
      setLevelInfo(res.data.level);
    } catch (err) {
      console.error('Failed to load level details:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/levels/${levelId}/questions`, {
        params: { search, sort, page, limit: 10 }
      });
      setQuestions(res.data.questions || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(err.response?.data?.error || 'Failed to load problems for this level.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevelDetails();
  }, [levelId]);

  useEffect(() => {
    fetchQuestions();
  }, [levelId, search, sort, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button and Level Header */}
      <div className="mb-8">
        {levelInfo && (
          <Link
            to={`/languages/${levelInfo.language_slug}/levels`}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#2563EB] mb-4 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {levelInfo.language_name} Levels
          </Link>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1E3A8A] flex items-center gap-3">
              <span>{levelInfo ? `${levelInfo.language_name} Level ${levelInfo.level_number}: ${levelInfo.title}` : 'Question Practice'}</span>
            </h1>
            <p className="text-[#64748B] text-sm mt-1 max-w-2xl">
              {levelInfo?.description || 'Browse active problems in this curriculum tier.'}
            </p>
          </div>

          <div className="text-xs font-semibold text-[#1E3A8A] bg-white border border-[#DBEAFE] px-4 py-2 rounded-xl self-start md:self-auto shadow-xs">
            Total Active Questions: <span className="font-extrabold text-[#2563EB]">{pagination.total}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DBEAFE] mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search problems by title or problem text..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl text-[#172554] placeholder-[#94A3B8] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {/* Sort Controls & Contribute Link */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-2 text-[#172554] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="newest">Newest First</option>
              <option value="popularity">Most Useful Votes</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Contribute
          </Link>
        </div>
      </div>

      {/* Error State with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchQuestions}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <LoadingSpinner message="Loading problems..." />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          description={
            search
              ? "No practice questions match your current search. Try resetting your search terms."
              : "No questions have been added to this level yet. Be the first to contribute one!"
          }
          action={
            <Link
              to="/upload"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Contribute a Question
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Link
              key={q.id}
              to={`/practice/${q.id}`}
              className="p-5 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  {q.isSolved ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                  )}

                  <h3 className="text-base font-bold text-[#172554] group-hover:text-[#2563EB] transition-colors truncate">
                    {q.title}
                  </h3>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-1 mb-2.5">
                  {q.shortDescription}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#2563EB]" /> By {q.contributor}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-[#172554] font-medium">
                    <ThumbsUp className="w-3 h-3 text-[#2563EB]" /> {q.usefulVotes} useful
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <span className="px-4 py-2 rounded-xl bg-[#F5F9FF] group-hover:bg-[#2563EB] text-[#1E3A8A] group-hover:text-white border border-[#DBEAFE] group-hover:border-transparent text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs">
                  Practice
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
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
