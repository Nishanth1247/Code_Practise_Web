import React from 'react';
import { Outlet } from 'react-router-dom';
import { StandaloneNavbar } from '../components/common/StandaloneNavbar';

export function StandaloneLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FF] text-[#172554]">
      <StandaloneNavbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
