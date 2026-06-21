import crypto from 'node:crypto';

// Server-only. Stateless, HMAC-signed session token bound to a wallet address.
// Format: `<address>.<expiry>.<hmac>`. No DB session store needed.
//
// Requires AUTH_SECRET (a long random string) in the environment. Until it's
// set, verify/sign return null/empty so the app keeps working anonymously —
// nothing depends on the session until reads/writes are migrated behind it.

const SECRET = process.env.AUTH_SECRET || '';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE = 'split_session';

export function signSession(address: string): string {
  if (!SECRET) return '';
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${address.toLowerCase()}.${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Returns the lowercased address if the token is valid and unexpired, else null. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token || !SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [address, exp, sig] = parts;
  const payload = `${address}.${exp}`;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  try {
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch {
    return null;
  }
  if (!Number.isFinite(Number(exp)) || Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return address;
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
