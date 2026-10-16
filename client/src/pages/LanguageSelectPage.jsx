import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Terminal, ArrowRight, BookOpen } from 'lucide-react';

export function LanguageSelectPage() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const res = await api.get('/languages');
        setLanguages(res.data.languages || []);
      } catch (err) {
        setError('Failed to load programming curricula.');
      } finally {
        setLoading(false);
      }
    }
    fetchLanguages();
  }, []);

  if (loading) return <LoadingSpinner message="Loading language tracks..." />;

  const getLanguageTagColor = (slug) => {
    switch (slug) {
      case 'c': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'cpp': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'java': return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'python': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">Programming Languages</h1>
        <p className="text-[#64748B] text-sm mt-1 max-w-2xl">
          Choose a programming language track to browse its progressive curriculum levels and practice problems.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {languages.map((lang) => (
          <div
            key={lang.id}
            className="p-6 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-sm font-bold border ${getLanguageTagColor(lang.slug)}`}>
                    {lang.name}
                  </span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {lang.totalLevels} {lang.totalLevels === 1 ? 'Level' : 'Levels'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#172554]">
                    {lang.solvedQuestions} / {lang.totalQuestions} Solved
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#F5F9FF] rounded-full h-2.5 mb-4 overflow-hidden border border-[#DBEAFE]">
                <div
                  className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${lang.completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748B] mb-6 font-medium">
                <span>Progress: {lang.completionPercentage}%</span>
                <span>{lang.totalQuestions} Questions Available</span>
              </div>
            </div>

            <Link
              to={`/languages/${lang.slug}/levels`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Explore All {lang.name} Levels
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
