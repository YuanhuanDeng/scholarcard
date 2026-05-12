import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components.
 *
 * Use this when you need to call Supabase from code that runs in the browser
 * (forms, interactive components). For Server Components / API routes,
 * use `lib/supabase/server.ts` instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
