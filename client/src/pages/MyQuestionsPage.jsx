import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import {
  FolderGit2,
  PlusCircle,
  ThumbsUp,
  Flag,
  ArrowRight
} from 'lucide-react';

export function MyQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyQuestions() {
      try {
        const res = await api.get('/questions/mine');
        setQuestions(res.data.questions || []);
      } catch (err) {
        console.error('Failed to load my questions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyQuestions();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your contributed questions..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">My Contributed Questions</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Questions you have contributed to the community practice catalog.
          </p>
        </div>

        <Link
          to="/upload"
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Contribute New Question
        </Link>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="No questions contributed yet"
          description="You haven't uploaded any coding problems yet. Share your questions to help the community learn!"
          icon={FolderGit2}
          action={
            <Link
              to="/upload"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              Upload Your First Question
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <StatusBadge status={q.status} />
                  <span className="text-xs font-mono font-bold bg-[#F5F9FF] border border-[#DBEAFE] text-[#1E3A8A] px-2.5 py-0.5 rounded-md">
                    {q.language_name} &bull; Level {q.level_number}
                  </span>
                  <h3 className="text-base font-bold text-[#172554] truncate">{q.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1 text-[#2563EB] font-medium">
                    <ThumbsUp className="w-3.5 h-3.5" /> {q.useful_votes} useful votes
                  </span>
                  <span>&bull;</span>
                  <span className={`flex items-center gap-1 ${q.report_count > 0 ? 'text-amber-700 font-semibold' : 'text-[#64748B]'}`}>
                    <Flag className="w-3.5 h-3.5 text-amber-500" /> {q.report_count} reports
                  </span>
                  <span>&bull;</span>
                  <span>{q.total_solves} solves</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <Link
                  to={`/practice/${q.id}`}
                  className="px-4 py-2 rounded-xl bg-[#F5F9FF] hover:bg-[#2563EB] text-[#1E3A8A] hover:text-white border border-[#DBEAFE] hover:border-transparent text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  View in Practice
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
