// src/shared/components/Layout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { Navbar } from '@/shared/components/Navbar';
import { BottomNav } from '@/shared/components/BottomNav';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mp-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="pt-16 lg:ml-60 min-h-screen pb-20 lg:pb-0">
        <div className="p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
