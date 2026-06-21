import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  const address = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ address });
}
