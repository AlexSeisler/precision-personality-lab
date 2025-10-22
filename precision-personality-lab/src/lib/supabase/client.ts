import { createClient } from '@supabase/supabase-js';

/**
 * Ensure environment variables exist at build time.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file.'
  );
}

/**
 * Create the Supabase client with stable token refresh + diagnostics.
 * These settings ensure:
 *  - Session persists across reloads
 *  - Tokens auto-refresh when expired
 *  - URLs are detected in browser redirects
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Optional explicit storage adapter (for better SSR safety)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Diagnostic hooks (only active in development)
 * Log key auth lifecycle events to verify refresh + persistence.
 */
if (process.env.NODE_ENV === 'development') {
  console.info('[Supabase] Client initialized:', supabaseUrl);

  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        console.info('[Supabase] SIGNED_IN:', session?.user?.email);
        break;
      case 'TOKEN_REFRESHED':
        console.info('[Supabase] TOKEN_REFRESHED');
        break;
      case 'SIGNED_OUT':
        console.info('[Supabase] SIGNED_OUT');
        break;
      case 'USER_UPDATED':
        console.info('[Supabase] USER_UPDATED');
        break;
      default:
        console.debug('[Supabase] Auth event:', event);
    }
  });
}
