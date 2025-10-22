'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useUIStore } from '@/store/ui-store';
import { logAuditEvent } from '@/lib/api/audit-logs';

/**
 * 🧠 AuthContext
 * Provides Supabase auth state, session management, and lifecycle-safe listeners.
 * This version ensures no hydration flicker by gating state updates behind hydration.
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { addToast } = useUIStore();

  /**
   * 🧩 Step 1: Mark when client hydration completes.
   * Prevents premature Supabase listener execution during SSR rehydration.
   */
  useEffect(() => {
    setHydrated(true);
  }, []);

  /**
   * 🧩 Step 2: Initialize Supabase session and listen for auth state changes.
   * This entire block runs only after hydration to avoid SSR timing issues.
   */
  useEffect(() => {
    if (!hydrated) return; // Wait until browser hydration completes
    let mounted = true;

    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error retrieving session:', error.message);
          setLoading(false);
          setAuthReady(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);

        // Guard to avoid undefined UUID errors
        if (session?.user?.id) {
          await logAuditEvent('session_restored', { email: session.user.email });
        } else {
          console.warn('⚠️ Skipped session_restored audit, no user.id present.');
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setLoading(false);
        setAuthReady(false);
      }
    };

    initSession();

    /**
     * 🧠 Supabase Auth State Listener
     * Ensures that all session changes are captured after hydration.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);

        if (event === 'SIGNED_IN' && session?.user?.id) {
          addToast('Welcome back!', 'success');
          await logAuditEvent('sign_in', { email: session.user.email });
        } else if (event === 'SIGNED_OUT') {
          addToast('Signed out successfully', 'info');
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrated, addToast]);

  /**
   * ✉️ Sign-In Flow — handles direct Supabase password authentication.
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        addToast(error.message, 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_in',
          email,
          message: error.message,
        });
        return { error };
      }

      if (!data.session) {
        const err = new Error('No session returned');
        addToast('Authentication failed', 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_in',
          email,
          message: 'No session returned',
        });
        return { error: err };
      }

      // Ensure user.id exists before logging
      if (data.session.user?.id) {
        await logAuditEvent('sign_in', { email: data.session.user.email });
      }

      setUser(data.session.user);
      setSession(data.session);
      setAuthReady(true);

      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      await logAuditEvent('auth_error', {
        action: 'sign_in',
        message: err.message,
      });
      return { error: err };
    }
  };

  /**
   * ✉️ Sign-Up Flow — ensures production redirect URL is correct.
   */
  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        'https://precision-personality-lab.vercel.app/auth/callback';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        addToast(error.message, 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_up',
          email,
          message: error.message,
        });
        return { error };
      }

      if (data.user?.id) {
        await logAuditEvent('sign_up', { email });
      }

      addToast('Verification email sent — check your inbox.', 'info');
      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      await logAuditEvent('auth_error', {
        action: 'sign_up',
        message: err.message,
      });
      return { error: err };
    }
  };

  /**
   * 🚪 Sign-Out Flow — clears session and logs audit event.
   */
  const signOut = async () => {
    try {
      if (user?.id) {
        await logAuditEvent('sign_out', { email: user.email });
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        addToast(error.message, 'error');
      } else {
        setUser(null);
        setSession(null);
        setAuthReady(false);
      }
    } catch (error) {
      console.error('Sign-out error:', error);
      addToast('Error signing out', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authReady,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🪝 Custom hook — returns validated Auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
