// src/lib/db.ts
import { supabase } from '@/config/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Thrown by getCurrentUser() when there is no active session.
 * Catch this in UI layers to redirect to login.
 */
export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required. Please sign in to continue.');
    this.name = 'AuthRequiredError';
  }
}

/**
 * Returns the currently authenticated Supabase user.
 * Throws AuthRequiredError if no active session exists.
 *
 * Use this inside service functions that need to inject user_id
 * rather than accepting it as a parameter from callers.
 */
export async function getCurrentUser(): Promise<User> {
  // Try local session first (no network needed) — avoids failures during token refresh
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // Fall back to server-verified user if no local session
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AuthRequiredError();
  return user;
}
