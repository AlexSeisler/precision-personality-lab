'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useUIStore } from '@/store/ui-store';
import { logAuditEvent } from '@/lib/api/audit-logs';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUIStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        logAuditEvent('session_restored', { email: session.user.email });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          addToast('Welcome back!', 'success');
          await logAuditEvent('sign_in', { email: session.user.email });
        } else if (event === 'SIGNED_OUT') {
          addToast('Signed out successfully', 'info');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [addToast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addToast(error.message, 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_in',
          email,
          message: error.message
        });
        return { error };
      }

      if (!data.session) {
        const err = new Error('No session returned');
        addToast('Authentication failed', 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_in',
          email,
          message: 'No session returned'
        });
        return { error: err };
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      await logAuditEvent('auth_error', {
        action: 'sign_in',
        message: err.message
      });
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        addToast(error.message, 'error');
        await logAuditEvent('auth_error', {
          action: 'sign_up',
          email,
          message: error.message
        });
        return { error };
      }

      if (data.user) {
        await logAuditEvent('sign_up', { email });
      }

      addToast('Account created successfully!', 'success');
      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      await logAuditEvent('auth_error', {
        action: 'sign_up',
        message: err.message
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await logAuditEvent('sign_out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        addToast(error.message, 'error');
      }
    } catch (error) {
      addToast('Error signing out', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
