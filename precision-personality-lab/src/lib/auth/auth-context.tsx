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
          logAuditEvent(session.user.id, 'sign_in', { email: session.user.email });
        } else if (event === 'SIGNED_OUT') {
          addToast('Signed out successfully', 'info');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [addToast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addToast(error.message, 'error');
        return { error };
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        addToast(error.message, 'error');
        return { error };
      }

      addToast('Account created! Please check your email to verify.', 'success', 5000);
      return { error: null };
    } catch (error) {
      const err = error as Error;
      addToast(err.message, 'error');
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await logAuditEvent(user.id, 'sign_out');
      }
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
