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
      className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-mp-surface/95 backdrop-blur-xl border-t border-mp-border"
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
                  'flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 w-full',
                  isActive
                    ? 'text-mp-primary'
                    : 'text-mp-text-muted hover:text-mp-text-secondary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
