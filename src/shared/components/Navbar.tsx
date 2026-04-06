// src/shared/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut, Clock, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { cn } from '@/shared/utils/cn';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/trading': 'Trading',
  '/wealth': 'Wealth',
  '/transactions': 'Transactions',
  '/assets': 'Assets',
  '/reports': 'Reports',
  '/budget': 'Budget',
  '/settings': 'Settings',
};

function getWITTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jayapura',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface NavbarProps {
  onMenuToggle: () => void;
  className?: string;
}

export function Navbar({ onMenuToggle, className }: NavbarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const [time, setTime] = useState(getWITTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(getWITTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = pageTitles[location.pathname] ?? 'MP Wealth';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 lg:left-60 h-16 z-10',
        'backdrop-blur-xl border-b',
        'flex items-center justify-between px-4 lg:px-6',
        // light
        'bg-white/80 border-slate-200 shadow-sm',
        // dark
        'dark:bg-white/5 dark:border-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]',
        className,
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-all duration-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 text-slate-500 bg-slate-100 border border-slate-200 dark:text-gray-400 dark:bg-white/5 dark:border-white/10">
          <Clock size={12} />
          <span>WIT {time}</span>
        </div>
        {user?.email && (
          <span className="text-xs hidden md:block truncate max-w-[160px] rounded-lg px-2.5 py-1.5 text-slate-500 bg-slate-100 border border-slate-200 dark:text-gray-400 dark:bg-white/5 dark:border-white/10">
            {user.email}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-all duration-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-yellow-300"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 border border-transparent text-slate-500 hover:text-mp-red hover:bg-red-50 hover:border-red-200 dark:text-gray-400 dark:hover:text-mp-red dark:hover:bg-mp-red/10 dark:hover:border-mp-red/20"
          aria-label="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:block text-xs">Logout</span>
        </button>
      </div>
    </header>
  );
}
