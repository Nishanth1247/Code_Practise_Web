import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Terminal,
  ShieldCheck,
  Layers,
  ArrowRight,
  Flame,
  Users,
  CheckCircle2
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  const languages = [
    { name: 'C', desc: 'Master memory management, pointers, and systems fundamentals.' },
    { name: 'C++', desc: 'Modern object-oriented constructs, STL templates, and performance.' },
    { name: 'Java', desc: 'Object architecture, clean patterns, and enterprise computing.' },
    { name: 'Python', desc: 'Elegant syntax, concise algorithms, and powerful data structures.' }
  ];

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
            Choose your language, start at any curriculum level, execute code in isolated sandboxes,
            and contribute real challenges to an active community of learners.
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
              Explore Languages
            </Link>
          </div>
        </div>
      </section>

      {/* Languages Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] mb-3">
            Supported Programming Curricula
          </h2>
          <p className="text-[#64748B] max-w-xl mx-auto text-sm">
            Each track is structured into progressive tiers, from fundamental I/O through conditions, loops, and advanced structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className="p-6 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-[#1E3A8A]">{lang.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-semibold">
                    Curriculum
                  </span>
                </div>
                <p className="text-sm text-[#64748B] mb-6 leading-relaxed">{lang.desc}</p>
              </div>

              <Link
                to="/languages"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] group-hover:text-[#1D4ED8]"
              >
                View Levels <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F9FF] border-t border-b border-[#DBEAFE]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#DBEAFE] shadow-xs">
            <div className="p-3 bg-blue-50 text-[#2563EB] rounded-xl border border-[#DBEAFE]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E3A8A] mb-1">Open Progression</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Learn flexibly at your own pace. You can jump directly to any level without locked prerequisites.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#DBEAFE] shadow-xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E3A8A] mb-1">Self-Governing Quality</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Community voting and a 4-report threshold ensure inaccurate questions are instantly replaced and reviewed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#DBEAFE] shadow-xs">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E3A8A] mb-1">Community Uploads</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Contribute questions directly with test cases, starter code, and explanations to enrich the platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
