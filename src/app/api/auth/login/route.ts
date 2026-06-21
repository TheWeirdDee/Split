import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback, isAddress } from 'viem';
import { celo } from 'viem/chains';
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

// Verifies a wallet signature (sign-in-with-Ethereum style) and, on success,
// issues an httpOnly session cookie bound to the address. Supports both EOAs
// and smart-contract wallets (ERC-1271) via the public client.

const MESSAGE_MAX_AGE_MS = 5 * 60 * 1000; // signed message must be < 5 min old

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const address = String(body?.address || '');
  const message = String(body?.message || '');
  const signature = body?.signature as `0x${string}`;

  if (!isAddress(address) || !message || !signature) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // The signed message must reference this address and be freshly issued, to
  // prevent reuse of an old signature or signing on behalf of another address.
  if (!message.includes(address)) {
    return NextResponse.json({ ok: false, error: 'address_mismatch' }, { status: 400 });
  }
  const issuedMatch = message.match(/Issued At:\s*(.+)/);
  const issuedAt = issuedMatch ? Date.parse(issuedMatch[1].trim()) : NaN;
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > MESSAGE_MAX_AGE_MS) {
    return NextResponse.json({ ok: false, error: 'stale_message' }, { status: 400 });
  }

  const publicClient = createPublicClient({
    chain: celo,
    transport: fallback([
      http('https://forno.celo.org'),
      http('https://rpc.ankr.com/celo'),
      http('https://celo.drpc.org'),
    ]),
  });

  let valid = false;
  try {
    valid = await publicClient.verifyMessage({ address: address as `0x${string}`, message, signature });
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  const token = signSession(address);
  if (!token) {
    return NextResponse.json({ ok: false, error: 'auth_not_configured' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, address: address.toLowerCase() });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
