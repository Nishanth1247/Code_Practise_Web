import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Terminal,
  Cpu,
  Layers,
  FileCode,
  GitBranch,
  Database,
  Award,
  Flame,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles
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

export function LanguageSelectPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTracks() {
      try {
        // Fetch active programs from /programs endpoint
        const res = await api.get('/programs');
        if (res.data?.programs && res.data.programs.length > 0) {
          setTracks(res.data.programs);
          return;
        }

        // Fallback to languages
        const langRes = await api.get('/languages');
        const fallback = (langRes.data.languages || []).map(l => ({
          id: l.id,
          name: `${l.name} Programming`,
          slug: l.slug,
          description: `Structured curriculum track covering fundamentals through advanced ${l.name} topics.`,
          icon: l.slug === 'c' ? 'Cpu' : l.slug === 'cpp' ? 'Layers' : l.slug === 'java' ? 'Terminal' : 'Code',
          levelCount: l.totalLevels || 6,
          questionCount: l.totalQuestions || 0,
          solvedCount: l.solvedQuestions || 0,
          progressPercentage: l.completionPercentage || 0,
          compilers: [{ language_name: l.name, compiler_name: l.name }]
        }));
        setTracks(fallback);
      } catch (err) {
        setError('Failed to load programming practice tracks.');
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  if (loading) return <LoadingSpinner message="Loading curated practice tracks..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          Curated Tracks
        </div>
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">
          Explore Learning Tracks
        </h1>
        <p className="text-[#64748B] text-sm mt-1 max-w-2xl leading-relaxed">
          Choose an independent track to solve progressive level challenges, execute code in Judge0 sandboxes, and build mastery.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => {
          const IconComp = ICON_MAP[track.icon] || FileCode;
          const isComplete = track.questionCount > 0 && track.solvedCount === track.questionCount;

          return (
            <div
              key={track.id}
              className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                isComplete
                  ? 'border-emerald-300'
                  : 'border-[#DBEAFE] hover:border-[#2563EB]'
              }`}
            >
              <div>
                {/* Header with Icon and Level badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3.5 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#DBEAFE]/50 text-[#1E3A8A] border border-[#DBEAFE]">
                    {track.levelCount} {track.levelCount === 1 ? 'Level' : 'Levels'}
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-bold text-[#1E3A8A] mb-1.5 group-hover:text-[#2563EB] transition-colors">
                  {track.name}
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                  {track.description || 'Structured challenges and algorithmic exercises designed for step-by-step progress.'}
                </p>

                {/* Allowed Compilers */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                    Allowed Compilers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(track.compilers || []).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE]"
                      >
                        {c.compiler_name || c.language_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                    <span>Progress</span>
                    <span className="font-bold text-[#172554]">
                      {track.solvedCount || 0} / {track.questionCount || 0} Solved
                    </span>
                  </div>
                  <div className="w-full bg-[#F5F9FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${track.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/programs/${track.slug}/levels`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md"
              >
                <span>Start Learning Track</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
