import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Code2,
  Terminal,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';

export function StandaloneNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DBEAFE] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-lg text-[#1E3A8A] hover:opacity-90 transition-opacity"
        >
          <div className="p-2 bg-[#2563EB] rounded-xl text-white shadow-sm shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="tracking-tight text-xl font-extrabold text-[#1E3A8A]">
            CodeCraft
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
          <Link
            to="/courses"
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              isActive('/courses') || isActive('/languages')
                ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                : 'text-[#172554] hover:text-[#2563EB] hover:bg-[#F5F9FF]'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#2563EB]" />
            Courses
          </Link>

          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/dashboard')
                  ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                  : 'text-[#172554] hover:text-[#2563EB] hover:bg-[#F5F9FF]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#1E3A8A] hover:bg-[#DBEAFE]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Desktop User Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DBEAFE] hover:border-[#2563EB] text-xs font-semibold text-[#172554] transition-all shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center font-bold text-xs">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.username}</span>
                {user?.role === 'ADMIN' && (
                  <span className="text-[10px] bg-[#2563EB] text-white px-1.5 py-0.5 rounded font-bold">
                    ADMIN
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#172554] hover:bg-[#F5F9FF] rounded-lg"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#DBEAFE] bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] hover:bg-[#F5F9FF]"
          >
            Practice Courses
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] hover:bg-[#F5F9FF]"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#2563EB] hover:bg-[#DBEAFE]"
                >
                  Admin Console
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] hover:bg-[#F5F9FF]"
              >
                Profile ({user?.username})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-[#1E3A8A] bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
