'use client';

import { useAuth } from '@/lib/auth/auth-context';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="animate-pulse">🔄 Connecting to Supabase...</div>
      </div>
    );
  }

  return <>{children}</>;
}
