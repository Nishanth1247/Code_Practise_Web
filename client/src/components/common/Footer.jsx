import React from 'react';
import { Code2, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#DBEAFE] bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#2563EB] rounded-lg text-white">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-[#1E3A8A]">CodeCraft</span>
          <span>&copy; {new Date().getFullYear()} Level-Based Practice Platform.</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Isolated Code Sandbox Enabled
          </span>
          <span className="font-medium text-[#172554]">C &bull; C++ &bull; Java &bull; Python</span>
        </div>
      </div>
    </footer>
  );
}
