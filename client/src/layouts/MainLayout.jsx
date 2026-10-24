import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, Code2 } from 'lucide-react';

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('codecraft_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F9FF] text-[#172554]">
      {/* Left-side Vertical Sidebar (Desktop + Mobile Slide-in Drawer) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-20 h-14 bg-white border-b border-[#DBEAFE] px-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 -ml-1 text-[#172554] hover:text-[#2563EB] hover:bg-[#F5F9FF] rounded-lg transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-[#2563EB] rounded-lg text-white">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[#1E3A8A] text-lg tracking-tight">
                CodeCraft
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center font-bold text-xs border border-[#BFDBFE]"
                title={user?.username}
              >
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
