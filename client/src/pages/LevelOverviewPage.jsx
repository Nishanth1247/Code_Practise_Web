import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  Layers,
  Upload,
  AlertCircle
} from 'lucide-react';

export function LevelOverviewPage() {
  const { languageSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await api.get(`/languages/${languageSlug}/levels`);
        setData(res.data);
      } catch (err) {
        setError('Failed to load levels for this language.');
      } finally {
        setLoading(false);
      }
    }
    fetchLevels();
  }, [languageSlug]);

  if (loading) return <LoadingSpinner message="Loading curriculum levels..." />;

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-rose-600 mb-4">{error || 'Language not found'}</p>
        <Link to="/languages" className="text-[#2563EB] hover:underline text-sm font-semibold inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Languages
        </Link>
      </div>
    );
  }

  const { language, levels } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button & Header */}
      <div className="mb-8">
        <Link
          to="/languages"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#2563EB] mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Languages
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1E3A8A] flex items-center gap-3">
              <span>{language.name} Curriculum</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A]">
                {levels.length} {levels.length === 1 ? 'Level' : 'Levels'}
              </span>
            </h1>
            <p className="text-[#64748B] text-sm mt-1">
              Select any level to practice. Levels are unlocked for open progression.
            </p>
          </div>
        </div>
      </div>

      {/* Levels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((lvl) => {
          const isComplete = lvl.totalQuestions > 0 && lvl.solvedQuestions === lvl.totalQuestions;
          const isEmpty = lvl.totalQuestions === 0;

          return (
            <div
              key={lvl.id}
              className={`p-6 rounded-2xl bg-white border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                isComplete
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : isEmpty
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-[#DBEAFE] hover:border-[#2563EB]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#DBEAFE] text-[#1E3A8A]">
                    <Layers className="w-3.5 h-3.5" />
                    Level {lvl.levelNumber}
                  </span>

                  {isComplete && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Completed
                    </span>
                  )}

                  {isEmpty && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Needs Questions
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#1E3A8A] mb-2 group-hover:text-[#2563EB] transition-colors">
                  {lvl.title}
                </h3>
                <p className="text-xs text-[#64748B] mb-6 leading-relaxed min-h-[3rem]">
                  {lvl.description || 'Practice core problems in this curriculum tier.'}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between text-xs text-[#64748B] font-medium">
                    <span>Progress: {lvl.completionPercentage}%</span>
                    <span>{lvl.solvedQuestions} / {lvl.totalQuestions} Solved</span>
                  </div>
                  <div className="w-full bg-[#F5F9FF] rounded-full h-2.5 overflow-hidden border border-[#DBEAFE]">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${lvl.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {isEmpty ? (
                <div className="space-y-2">
                  <Link
                    to="/upload"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Contribute First Question
                  </Link>
                  <Link
                    to={`/levels/${lvl.id}/questions`}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172554] text-center block"
                  >
                    View Problem List
                  </Link>
                </div>
              ) : (
                <Link
                  to={`/levels/${lvl.id}/questions`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Practice Level {lvl.levelNumber}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
