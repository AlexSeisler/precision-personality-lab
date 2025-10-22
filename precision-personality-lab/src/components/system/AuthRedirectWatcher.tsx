'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 🧭 AuthRedirectWatcher
 * Listens for Supabase auth callback URLs and redirects users
 * to the correct live site after successful email verification or sign-in.
 */
export function AuthRedirectWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Detect Supabase callback URL pattern
    if (pathname.startsWith('/auth/callback')) {
      // Wait briefly for Supabase token hydration to complete
      const timeout = setTimeout(() => {
        // ✅ Redirect to live production root after verification
        router.replace('https://precision-personality-lab.vercel.app/');
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [pathname, router]);

  return null;
}
