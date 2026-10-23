import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Layers, Flag, History, Users, FileText, BookOpen } from 'lucide-react';

export function AdminLayout() {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-[#2563EB] text-white shadow-sm'
        : 'text-[#172554] hover:text-[#2563EB] hover:bg-[#F5F9FF]'
    }`;

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl shadow-sm sticky top-24">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#DBEAFE] text-[#2563EB]">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-bold text-[#1E3A8A] text-sm uppercase tracking-wider">Admin Console</h2>
          </div>

          <nav className="space-y-1.5">
            <NavLink to="/admin" end className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </NavLink>
            <NavLink to="/admin/questions" className={navLinkClass}>
              <FileText className="w-4 h-4" />
              Questions
            </NavLink>
            <NavLink to="/admin/programs" className={navLinkClass}>
              <BookOpen className="w-4 h-4" />
              Manage Programs
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              <Users className="w-4 h-4" />
              Users
            </NavLink>
            <NavLink to="/admin/levels" className={navLinkClass}>
              <Layers className="w-4 h-4" />
              Manage Levels
            </NavLink>
            <NavLink to="/admin/reported" className={navLinkClass}>
              <Flag className="w-4 h-4" />
              Reported Questions
            </NavLink>
            <NavLink to="/admin/audit" className={navLinkClass}>
              <History className="w-4 h-4" />
              Audit Trail
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Admin Main Outlet */}
      <section className="flex-1 min-w-0">
        <Outlet />
      </section>
    </div>
  );
}

