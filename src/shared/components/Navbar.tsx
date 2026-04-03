// src/shared/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { cn } from '@/shared/utils/cn';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/trading': 'Trading',
  '/wealth': 'Wealth',
  '/transactions': 'Transactions',
  '/assets': 'Assets',
  '/reports': 'Reports',
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
        'bg-white/5 backdrop-blur-xl border-b border-white/10',
        'shadow-[0_1px_0_rgba(255,255,255,0.05)]',
        'flex items-center justify-between px-4 lg:px-6',
        className,
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
          <Clock size={12} />
          <span>WIT {time}</span>
        </div>
        {user?.email && (
          <span className="text-xs text-gray-400 hidden md:block truncate max-w-[160px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-mp-red hover:bg-mp-red/10 rounded-lg transition-all duration-200 border border-transparent hover:border-mp-red/20"
          aria-label="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:block text-xs">Logout</span>
        </button>
      </div>
    </header>
  );
}
