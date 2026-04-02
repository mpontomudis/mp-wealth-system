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
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 bg-mp-surface border-r border-mp-border z-30 flex flex-col transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-mp-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-mp-primary text-white font-bold text-sm shrink-0">
            MP
          </div>
          <span className="text-sm font-semibold text-mp-text-primary">Wealth System</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <ul className="flex flex-col gap-1">
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-mp-primary/10 text-mp-primary font-semibold'
                        : 'text-mp-text-secondary hover:bg-mp-background hover:text-mp-text-primary',
                    )
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Version */}
        <div className="px-5 py-4 border-t border-mp-border">
          <p className="text-xs text-mp-text-muted">v2.0.0</p>
        </div>
      </aside>
    </>
  );
}
