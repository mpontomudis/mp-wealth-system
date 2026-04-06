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
  BookOpen,
  Target,
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
  { label: 'Reports',      to: '/reports',      icon: BarChart3      },
  { label: 'Budget',       to: '/budget',       icon: Target         },
  { label: 'Settings',     to: '/settings',     icon: Settings       },
  { label: 'Panduan', to: '/guide', icon: BookOpen },
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
          'backdrop-blur-2xl border-r',
          // light
          'bg-white/90 border-slate-200 shadow-md',
          // dark
          'dark:bg-white/5 dark:border-white/10 dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-white/10">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg transition shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10">
            <img
              src="/logo.png"
              alt="MP Wealth"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm text-slate-900 dark:text-white">MP Wealth</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">System v2.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 text-slate-400 dark:text-gray-500">
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
                        ? 'font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-white/10 dark:text-white dark:border-white/15 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={cn('shrink-0',
                        isActive ? 'text-blue-600 dark:text-white' : 'text-slate-400 dark:text-gray-500'
                      )} />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Version */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10">
          <p className="text-xs text-slate-400 dark:text-gray-500">v2.0.0 — MP Wealth System</p>
        </div>
      </aside>
    </>
  );
}
