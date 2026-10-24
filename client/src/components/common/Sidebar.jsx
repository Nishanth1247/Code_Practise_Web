import React, { useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Code2,
  Home,
  Terminal,
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  History,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  BookOpen,
  Users,
  Layers,
  Flag
} from 'lucide-react';

export function Sidebar({
  collapsed = false,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && setMobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (setMobileOpen) setMobileOpen(false);
  };

  const toggleCollapse = () => {
    if (setCollapsed) {
      const next = !collapsed;
      setCollapsed(next);
      try {
        localStorage.setItem('codecraft_sidebar_collapsed', String(next));
      } catch (e) {
        // Safe fallback
      }
      // Trigger resize for Monaco editor & charts
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
    }
  };

  const isRouteActive = (path, exact = false) => {
    if (exact || path === '/') {
      return location.pathname === path;
    }
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    if (path === '/languages') {
      return (
        location.pathname === '/languages' ||
        location.pathname.startsWith('/languages/') ||
        location.pathname.startsWith('/programs/') ||
        location.pathname.startsWith('/levels/') ||
        location.pathname.startsWith('/practice/')
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItemClass = (path, exact = false) => {
    const active = isRouteActive(path, exact);
    return `group relative flex items-center ${
      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'
    } rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? 'bg-[#2563EB] text-white shadow-sm'
        : 'text-[#1E3A8A] hover:text-[#2563EB] hover:bg-[#EFF6FF]'
    }`;
  };

  const sidebarContent = (isMobile = false) => {
    const isCol = collapsed && !isMobile;

    return (
      <div className="flex flex-col h-full select-none">
        {/* Header / Brand */}
        <div
          className={`h-16 shrink-0 flex items-center ${
            isCol ? 'justify-center px-2' : 'justify-between px-4'
          } border-b border-[#DBEAFE] bg-white`}
        >
          <Link
            to="/"
            onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            title="CodeCraft Home"
          >
            <div className="p-2 bg-[#2563EB] rounded-xl text-white shadow-sm shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            {!isCol && (
              <span className="tracking-tight text-xl font-extrabold text-[#1E3A8A]">
                CodeCraft
              </span>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          {!isMobile && setCollapsed && (
            <button
              onClick={toggleCollapse}
              className={`p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors ${
                isCol ? 'hidden' : 'block'
              }`}
              title={isCol ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCol ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
              title="Close navigation menu"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed on desktop */}
        {!isMobile && isCol && setCollapsed && (
          <div className="pt-2 px-2 flex justify-center">
            <button
              onClick={toggleCollapse}
              className="w-full py-1.5 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation Section */}
          <div className="space-y-1">
            {!isCol && (
              <div className="px-3.5 pb-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Menu
              </div>
            )}

            <Link
              to="/"
              onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
              className={navItemClass('/', true)}
              title="Home"
            >
              <Home className="w-4 h-4 shrink-0" />
              {!isCol && <span>Home</span>}
            </Link>

            <Link
              to="/languages"
              onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
              className={navItemClass('/languages')}
              title="Practice Tracks"
            >
              <Terminal className="w-4 h-4 shrink-0" />
              {!isCol && <span>Practice</span>}
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                  className={navItemClass('/dashboard', true)}
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!isCol && <span>Dashboard</span>}
                </Link>

                <Link
                  to="/upload"
                  onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                  className={navItemClass('/upload', true)}
                  title="Contribute Question"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  {!isCol && <span>Contribute</span>}
                </Link>

                <Link
                  to="/my-questions"
                  onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                  className={navItemClass('/my-questions', true)}
                  title="My Questions"
                >
                  <FolderGit2 className="w-4 h-4 shrink-0" />
                  {!isCol && <span>My Questions</span>}
                </Link>

                <Link
                  to="/submissions"
                  onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                  className={navItemClass('/submissions', true)}
                  title="Submissions"
                >
                  <History className="w-4 h-4 shrink-0" />
                  {!isCol && <span>Submissions</span>}
                </Link>
              </>
            )}
          </div>

          {/* Administrator Navigation Section */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-[#DBEAFE]">
              {!isCol ? (
                <div className="px-3.5 pb-1 text-[11px] font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </div>
              ) : (
                <div className="border-b border-[#DBEAFE] my-2 mx-1" />
              )}

              <Link
                to="/admin"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin', true)}
                title="Admin Overview"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCol && <span>Overview</span>}
              </Link>

              <Link
                to="/admin/questions"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/questions')}
                title="Manage Questions"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {!isCol && <span>Questions</span>}
              </Link>

              <Link
                to="/admin/programs"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/programs')}
                title="Manage Programs"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                {!isCol && <span>Programs</span>}
              </Link>

              <Link
                to="/admin/users"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/users')}
                title="Manage Users"
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isCol && <span>Users</span>}
              </Link>

              <Link
                to="/admin/levels"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/levels')}
                title="Manage Levels"
              >
                <Layers className="w-4 h-4 shrink-0" />
                {!isCol && <span>Levels</span>}
              </Link>

              <Link
                to="/admin/reported"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/reported')}
                title="Reported Questions"
              >
                <Flag className="w-4 h-4 shrink-0" />
                {!isCol && <span>Reported</span>}
              </Link>

              <Link
                to="/admin/audit"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={navItemClass('/admin/audit')}
                title="Audit Trail"
              >
                <History className="w-4 h-4 shrink-0" />
                {!isCol && <span>Audit Trail</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Footer / User Profile & Auth Section */}
        <div className="shrink-0 p-3 border-t border-[#DBEAFE] bg-white">
          {isAuthenticated ? (
            <div className={`flex items-center ${isCol ? 'flex-col gap-2' : 'justify-between'} gap-2`}>
              <Link
                to="/profile"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={`flex items-center ${
                  isCol ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-2'
                } rounded-xl hover:bg-[#F5F9FF] text-[#172554] transition-colors flex-1 min-w-0`}
                title={`Profile: ${user?.username || 'User'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center font-bold text-xs shrink-0 border border-[#BFDBFE]">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCol && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1E3A8A] truncate leading-tight">
                      {user?.username}
                    </div>
                    {user?.role === 'ADMIN' && (
                      <span className="inline-block mt-0.5 text-[9px] bg-[#2563EB] text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className={`flex ${isCol ? 'flex-col gap-2' : 'flex-col gap-1.5'}`}>
              <Link
                to="/login"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={`w-full flex items-center ${
                  isCol ? 'justify-center p-2' : 'justify-center gap-2 px-3 py-2'
                } text-xs font-semibold text-[#1E3A8A] hover:bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] transition-colors`}
                title="Sign In"
              >
                <LogIn className="w-4 h-4 shrink-0 text-[#2563EB]" />
                {!isCol && <span>Sign In</span>}
              </Link>

              <Link
                to="/register"
                onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                className={`w-full flex items-center ${
                  isCol ? 'justify-center p-2' : 'justify-center gap-2 px-3 py-2'
                } text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors`}
                title="Register"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                {!isCol && <span>Register</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop / Tablet Vertical Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-white border-r border-[#DBEAFE] z-30 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Sidebar"
            className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl z-50 transition-transform transform duration-300 ease-in-out"
          >
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
