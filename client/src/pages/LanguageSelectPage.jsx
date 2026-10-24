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
  Sparkles,
  HelpCircle,
  Binary
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
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        // Fetch active courses from /api/courses (or /api/programs)
        const res = await api.get('/courses').catch(() => api.get('/programs'));
        const loadedCourses = res.data?.courses || res.data?.programs || [];
        if (loadedCourses.length > 0) {
          setCourses(loadedCourses);
          return;
        }

        // Fallback to languages if empty
        const langRes = await api.get('/languages');
        const fallback = (langRes.data.languages || []).map(l => ({
          id: l.id,
          name: `${l.name} Programming`,
          slug: l.slug,
          description: `Comprehensive practice course covering fundamentals through advanced ${l.name} problem-solving.`,
          icon: l.slug === 'c' ? 'Cpu' : l.slug === 'cpp' ? 'Layers' : l.slug === 'java' ? 'Terminal' : 'Code',
          courseType: 'CODING',
          levelCount: l.totalLevels || 6,
          questionCount: l.totalQuestions || 0,
          solvedCount: l.solvedQuestions || 0,
          progressPercentage: l.completionPercentage || 0,
          compilers: [{ language_name: l.name, compiler_name: l.name }]
        }));
        setCourses(fallback);
      } catch (err) {
        setError('Failed to load practice courses.');
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) return <LoadingSpinner message="Loading available practice courses..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          Practice Courses
        </div>
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">
          Explore Practice Courses
        </h1>
        <p className="text-[#64748B] text-sm mt-1 max-w-3xl leading-relaxed">
          Master programming languages, data structures, and algorithmic techniques step-by-step.
          Each course features independent ordered levels and custom compiler environments.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const IconComp = ICON_MAP[course.icon] || FileCode;
          const isComplete = course.questionCount > 0 && course.solvedCount === course.questionCount;
          const isTheory = course.courseType === 'THEORY' || course.course_type === 'THEORY';

          return (
            <div
              key={course.id}
              className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between group shadow-xs hover:shadow-md ${
                isComplete
                  ? 'border-emerald-300'
                  : 'border-[#DBEAFE] hover:border-[#2563EB]'
              }`}
            >
              <div>
                {/* Header with Icon, Type Badge, and Level badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3.5 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#DBEAFE]/50 text-[#1E3A8A] border border-[#DBEAFE]">
                      {course.levelCount || 0} {course.levelCount === 1 ? 'Level' : 'Levels'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isTheory ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    }`}>
                      {isTheory ? 'Theory' : 'Coding Practice'}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-bold text-[#1E3A8A] mb-1.5 group-hover:text-[#2563EB] transition-colors">
                  {course.name}
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                  {course.description || 'Structured challenges and algorithmic exercises designed for step-by-step progress.'}
                </p>

                {/* Allowed Compilers */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                    {isTheory ? 'Course Format:' : 'Supported Compilers:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {isTheory ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        Conceptual / Non-executable
                      </span>
                    ) : (course.compilers && course.compilers.length > 0) ? (
                      course.compilers.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE]"
                        >
                          {c.compiler_name || c.language_name}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        Any compiler
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                    <span>Course Progress</span>
                    <span className="font-bold text-[#172554]">
                      {course.solvedCount || 0} / {course.questionCount || 0} Solved
                    </span>
                  </div>
                  <div className="w-full bg-[#F5F9FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/courses/${course.slug}/levels`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md"
              >
                <span>Open Practice Course</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSelectPage;
