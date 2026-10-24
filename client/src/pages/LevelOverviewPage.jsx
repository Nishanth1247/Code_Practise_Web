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
  AlertCircle,
  Terminal,
  Cpu,
  FileCode,
  GitBranch,
  Database,
  Award,
  Flame,
  BookOpen
} from 'lucide-react';

const ICON_MAP = {
  Cpu,
  Layers,
  Terminal,
  Code: FileCode,
  FileCode,
  GitBranch,
  Database,
  Award,
  Flame,
  BookOpen
};

export function LevelOverviewPage() {
  const { languageSlug, programSlug, courseSlug } = useParams();
  const slug = courseSlug || programSlug || languageSlug;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTrack() {
      setLoading(true);
      setError('');
      try {
        // Try fetching as a program first
        try {
          const res = await api.get(`/programs/${slug}`);
          if (res.data?.success) {
            setData({
              program: res.data.program,
              compilers: res.data.compilers || [],
              levels: res.data.levels || [],
              userProgress: res.data.userProgress || { totalQuestions: 0, solvedQuestions: 0, completionPercentage: 0 }
            });
            return;
          }
        } catch (progErr) {
          // If program endpoint fails, fallback to legacy language endpoint
        }

        const resLang = await api.get(`/languages/${slug}/levels`);
        setData({
          program: {
            name: `${resLang.data.language.name} Programming`,
            slug: resLang.data.language.slug,
            description: `Curated level progression for ${resLang.data.language.name}.`,
            icon: 'Code'
          },
          compilers: [
            {
              compiler_id: 0,
              compiler_name: resLang.data.language.name,
              language_name: resLang.data.language.name,
              language_slug: resLang.data.language.slug
            }
          ],
          levels: resLang.data.levels || [],
          userProgress: { totalQuestions: 0, solvedQuestions: 0, completionPercentage: 0 }
        });
      } catch (err) {
        setError('Failed to load levels for this curriculum track.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrack();
  }, [slug]);

  if (loading) return <LoadingSpinner message="Loading curriculum progression..." />;

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-600 mb-4 font-semibold">{error || 'Curriculum track not found'}</p>
        <Link to="/courses" className="text-[#2563EB] hover:underline text-xs font-bold inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>
    );
  }

  const { program, compilers, levels, userProgress } = data;
  const IconComp = ICON_MAP[program?.icon] || FileCode;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Back button & Header */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#2563EB] mb-4 transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="p-8 rounded-3xl bg-white border border-[#DBEAFE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB]">
              <IconComp className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider bg-[#DBEAFE]/40 px-2.5 py-0.5 rounded-full">
                  Independent Track
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E3A8A]">
                  {levels.length} {levels.length === 1 ? 'Level' : 'Levels'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">
                {program.name}
              </h1>
              <p className="text-[#64748B] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                {program.description || 'Master algorithmic thinking step-by-step with structured, independent problem sets.'}
              </p>

              {/* Supported Compilers */}
              {compilers && compilers.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase">Allowed Compilers:</span>
                  {compilers.map(c => (
                    <span
                      key={c.compiler_id || c.language_slug}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE]"
                    >
                      {c.language_name} ({c.compiler_name})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overall Progress Widget */}
          {userProgress && (
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center min-w-[180px] shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Track Progress</span>
              <div className="text-2xl font-extrabold text-[#1E3A8A]">
                {userProgress.solvedQuestions} / {userProgress.totalQuestions}
              </div>
              <span className="text-xs text-[#64748B] font-semibold block mb-2">Solved</span>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${userProgress.completionPercentage || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((lvl) => {
          const isComplete = lvl.totalQuestions > 0 && lvl.solvedQuestions === lvl.totalQuestions;
          const isEmpty = lvl.totalQuestions === 0;

          return (
            <div
              key={lvl.id}
              className={`p-6 rounded-2xl bg-white border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                isComplete
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : isEmpty
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-[#DBEAFE] hover:border-[#2563EB]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#DBEAFE] text-[#1E3A8A]">
                    <Layers className="w-3.5 h-3.5" />
                    Level {lvl.levelNumber || lvl.level_number}
                  </span>

                  {isComplete && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Solved
                    </span>
                  )}
                  {isEmpty && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Coming Soon
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#1E3A8A] mb-1 group-hover:text-[#2563EB] transition-colors">
                  {lvl.title}
                </h3>
                <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                  {lvl.description || 'Structured challenges and algorithmic exercises for this level.'}
                </p>

                {/* Progress bar */}
                {!isEmpty && (
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                      <span>Progress</span>
                      <span className="font-bold text-[#172554]">
                        {lvl.solvedQuestions} / {lvl.totalQuestions}
                      </span>
                    </div>
                    <div className="w-full bg-[#DBEAFE]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${lvl.completionPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-[#DBEAFE]/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B]">
                  {lvl.totalQuestions} {lvl.totalQuestions === 1 ? 'Question' : 'Questions'}
                </span>

                {isEmpty ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Contribute Problem <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to={`/levels/${lvl.id}/questions`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs group-hover:shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Practice Now
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
