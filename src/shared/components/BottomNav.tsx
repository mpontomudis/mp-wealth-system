// src/shared/components/BottomNav.tsx
import { LayoutDashboard, Receipt, BarChart3, Target, PieChart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';

const NAV_ITEMS = [
  { to: '/',             label: 'Home',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Txns',    icon: Receipt },
  { to: '/reports',      label: 'Reports', icon: BarChart3 },
  { to: '/budget',       label: 'Budget',  icon: Target },
  { to: '/assets',       label: 'Assets',  icon: PieChart },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white/95 dark:bg-mp-surface/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all duration-200 w-full mx-0.5',
                  isActive
                    ? 'text-[#4A90E2]'
                    : 'text-slate-400 dark:text-mp-text-muted hover:text-slate-600 dark:hover:text-mp-text-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-[#4A90E2]/12 dark:bg-[#4A90E2]/20'
                      : 'bg-transparent',
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium leading-none transition-all',
                    isActive ? 'font-semibold' : '',
                  )}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
