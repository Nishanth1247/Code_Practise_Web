import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FF] text-[#172554]">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
