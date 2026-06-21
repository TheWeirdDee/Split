import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from './session';

// Server-only helpers for authenticated API routes.

/** Supabase client with the service-role key (bypasses RLS). Server-only. */
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Whether wallet-auth is configured for this deployment. */
export const authEnabled = () => !!process.env.AUTH_SECRET;

/** Authenticated address from the session cookie, or null. */
export function getSessionAddress(req: NextRequest): string | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * The address to act as for this request:
 * - auth enabled  → the verified session address (ignores client-supplied value)
 * - auth disabled → falls back to the client-supplied address (legacy behaviour,
 *   so the app keeps working before AUTH_SECRET is configured)
 */
export function resolveCaller(req: NextRequest, fallbackAddress?: string | null): string | null {
  if (authEnabled()) return getSessionAddress(req);
  return (fallbackAddress || '').toLowerCase() || null;
}
