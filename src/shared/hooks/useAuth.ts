// src/shared/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth(): {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // During TOKEN_REFRESHED the session is briefly null before the new
      // token arrives. Ignore transient null during refresh to avoid
      // redirecting the user to /login unexpectedly.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, isLoading, signOut };
}
