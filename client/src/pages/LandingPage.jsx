import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Code2,
  Terminal,
  ShieldCheck,
  Layers,
  ArrowRight,
  Flame,
  Users,
  CheckCircle2,
  Cpu,
  FileCode,
  GitBranch,
  Database,
  Award,
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

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await api.get('/programs');
        if (res.data?.programs && res.data.programs.length > 0) {
          setPrograms(res.data.programs);
          return;
        }
      } catch (e) {
        // Safe fallback
      }

      setPrograms([
        { id: 1, name: 'C Programming', slug: 'c-programming', icon: 'Cpu', levelCount: 6, questionCount: 30, description: 'Master memory management, pointers, and systems fundamentals.' },
        { id: 2, name: 'C++ Programming', slug: 'cpp-programming', icon: 'Layers', levelCount: 6, questionCount: 32, description: 'Modern object-oriented constructs, STL templates, and performance.' },
        { id: 3, name: 'Java Programming', slug: 'java-programming', icon: 'Terminal', levelCount: 6, questionCount: 32, description: 'Object architecture, clean patterns, and enterprise computing.' },
        { id: 4, name: 'Python Programming', slug: 'python-programming', icon: 'Code', levelCount: 6, questionCount: 33, description: 'Elegant syntax, concise algorithms, and powerful data structures.' }
      ]);
    }
    loadPrograms();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-[#DBEAFE] bg-white">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold uppercase tracking-wider mb-8">
            <Flame className="w-4 h-4 text-[#2563EB]" />
            Curated Level-Based Practice
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1E3A8A] mb-6 leading-tight">
            Master Programming Step-by-Step with{' '}
            <span className="text-[#2563EB]">
              Community Practice
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#64748B] max-w-3xl mx-auto mb-10 leading-relaxed">
            Choose your learning track, advance through independent ordered levels, execute code in isolated Judge0 sandboxes,
            and build practical algorithmic skills.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/languages' : '/register'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              Start Practicing Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/languages"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-[#F5F9FF] text-[#1E3A8A] border border-[#DBEAFE] font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Terminal className="w-5 h-5 text-[#2563EB]" />
              Explore All Tracks
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Program Tracks Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] mb-3">
            Supported Learning Tracks
          </h2>
          <p className="text-[#64748B] max-w-xl mx-auto text-sm">
            Each track is structured into progressive tiers, from fundamental I/O through conditions, loops, and advanced algorithmic structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((prog) => {
            const IconComp = ICON_MAP[prog.icon] || FileCode;
            return (
              <div
                key={prog.id}
                className="p-6 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-semibold">
                      {prog.levelCount || 5} Levels
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1E3A8A] mb-2">{prog.name}</h3>
                  <p className="text-xs text-[#64748B] mb-6 leading-relaxed line-clamp-3">
                    {prog.description || 'Structured challenges and algorithmic exercises designed for step-by-step progress.'}
                  </p>
                </div>

                <Link
                  to={`/programs/${prog.slug}/levels`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] group-hover:text-[#1D4ED8] transition-colors"
                >
                  Explore Curriculum <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-white border-t border-[#DBEAFE] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-1">Independent Ordered Levels</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Self-contained progression curves from elementary basics to advanced algorithms for every curriculum track.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-1">Judge0 Sandboxed Execution</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Run visible samples and test hidden edge cases with real runtime compiler versions (GCC, OpenJDK, Python).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#DBEAFE] text-[#2563EB] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-1">Community Driven Practice</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Contribute questions, report flawed problem statements with categories, and vote on useful coding challenges.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
