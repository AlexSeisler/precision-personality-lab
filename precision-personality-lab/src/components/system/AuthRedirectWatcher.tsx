'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthRedirectWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Detect Supabase callback URL
    if (pathname.startsWith('/auth/callback')) {
      // Small delay in case Supabase still finalizing token state
      const timeout = setTimeout(() => {
        router.replace('/'); // ✅ redirect to root (http://localhost:3000/)
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [pathname, router]);

  return null;
}
