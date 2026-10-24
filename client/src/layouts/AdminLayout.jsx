import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Layers, Flag, History, Users, FileText, BookOpen } from 'lucide-react';

export function AdminLayout() {
  const tabLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
      isActive
        ? 'bg-[#2563EB] text-white shadow-xs'
        : 'text-[#1E3A8A] hover:text-[#2563EB] hover:bg-white bg-white/70 border border-[#DBEAFE]'
    }`;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Admin Sub-navigation Header & Quick Tabs */}
      <div className="bg-white border border-[#DBEAFE] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#DBEAFE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1E3A8A] leading-tight">Admin Console</h1>
              <p className="text-xs text-[#64748B]">Manage platform questions, programs, users, levels, and audit logs.</p>
            </div>
          </div>
        </div>

        {/* Horizontal Quick-switch Tabs (Scrollable on small screens) */}
        <nav className="flex items-center gap-2 pt-3.5 overflow-x-auto scrollbar-none" aria-label="Admin tabs">
          <NavLink to="/admin" end className={tabLinkClass}>
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </NavLink>
          <NavLink to="/admin/questions" className={tabLinkClass}>
            <FileText className="w-4 h-4" />
            Questions
          </NavLink>
          <NavLink to="/admin/programs" className={tabLinkClass}>
            <BookOpen className="w-4 h-4" />
            Programs
          </NavLink>
          <NavLink to="/admin/users" className={tabLinkClass}>
            <Users className="w-4 h-4" />
            Users
          </NavLink>
          <NavLink to="/admin/levels" className={tabLinkClass}>
            <Layers className="w-4 h-4" />
            Levels
          </NavLink>
          <NavLink to="/admin/reported" className={tabLinkClass}>
            <Flag className="w-4 h-4" />
            Reported
          </NavLink>
          <NavLink to="/admin/audit" className={tabLinkClass}>
            <History className="w-4 h-4" />
            Audit Trail
          </NavLink>
        </nav>
      </div>

      {/* Admin Content Outlet */}
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
