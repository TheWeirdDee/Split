import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  const address = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  // `enabled` tells the client whether auth is configured server-side, so it
  // won't keep prompting for a signature when AUTH_SECRET isn't set.
  return NextResponse.json({ address, enabled: !!process.env.AUTH_SECRET });
}
