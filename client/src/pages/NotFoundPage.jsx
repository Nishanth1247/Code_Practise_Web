import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5F9FF]">
      <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl text-[#2563EB] mb-4 shadow-sm">
        <Terminal className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-[#1E3A8A] mb-2">404</h1>
      <p className="text-[#64748B] text-sm max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
    </div>
  );
}
