// src/pages/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = (v: T) => {
    localStorage.setItem(key, JSON.stringify(v));
    setValue(v);
  };

  return [value, set];
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useLocalStorage<string>('mp_display_name', 'Marlon');
  const [nameInput, setNameInput] = useState(displayName);
  const [primaryCurrency, setPrimaryCurrency] = useLocalStorage<'IDR' | 'USD'>(
    'mp_primary_currency',
    'IDR',
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  const handleSaveName = () => {
    setDisplayName(nameInput.trim() || 'Marlon');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-mp-text-primary">Settings</h1>

      {/* Profile */}
      <Card title="Profile">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-mp-text-muted mb-1">Email Address</p>
            <p className="text-sm font-medium text-mp-text-primary">{user?.email ?? '—'}</p>
          </div>
          <Input
            label="Display Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            hint="Shown in the greeting on the dashboard"
          />
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSaveName}>
              Save Name
            </Button>
            {saved && (
              <span className="text-sm text-mp-green">Saved!</span>
            )}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-mp-text-secondary mb-2">
              Primary Currency Display
            </p>
            <div className="flex gap-2">
              {(['IDR', 'USD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimaryCurrency(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    primaryCurrency === c
                      ? 'bg-mp-primary text-white'
                      : 'bg-mp-background border border-mp-border text-mp-text-secondary hover:text-mp-text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-mp-text-muted mt-2">
              Controls which currency is shown first in balance displays.
            </p>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card title="Account">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-mp-text-muted">
            Signed in as <span className="text-mp-text-primary">{user?.email}</span>
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => void signOut()}
            className="self-start"
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
