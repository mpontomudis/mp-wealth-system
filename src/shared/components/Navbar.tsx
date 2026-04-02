// src/shared/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
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
        'fixed top-0 right-0 left-0 lg:left-60 h-16 bg-mp-surface border-b border-mp-border z-10 flex items-center justify-between px-4 lg:px-6',
        className,
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-mp-text-secondary hover:bg-mp-background transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-mp-text-primary">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-mp-text-muted hidden sm:block">
          WIT {time}
        </span>
        {user?.email && (
          <span className="text-sm text-mp-text-secondary hidden md:block truncate max-w-[180px]">
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-mp-text-secondary hover:text-mp-red hover:bg-mp-red/10 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
