// src/shared/components/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Receipt,
  PieChart,
  BarChart3,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Trading', to: '/trading', icon: TrendingUp },
  { label: 'Wealth', to: '/wealth', icon: Wallet },
  { label: 'Transactions', to: '/transactions', icon: Receipt },
  { label: 'Assets', to: '/assets', icon: PieChart },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 z-30 flex flex-col transition-transform duration-300 ease-out',
          'bg-white/5 backdrop-blur-2xl border-r border-white/10',
          'shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition shrink-0">
            <img
              src="/logo.png"
              alt="MP Wealth"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm text-white">MP Wealth</p>
            <p className="text-xs text-gray-400">System v2.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 mb-2">
            Navigation
          </p>
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                      isActive
                        ? 'bg-white/10 text-white font-semibold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                        : 'text-gray-400 hover:bg-white/[0.06] hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={cn('shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Version */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-gray-500">v2.0.0 — MP Wealth System</p>
        </div>
      </aside>
    </>
  );
}
