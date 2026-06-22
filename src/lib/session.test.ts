import { describe, it, expect, beforeAll } from 'vitest';

// session.ts reads AUTH_SECRET at module load, so set it before importing.
let signSession: (address: string) => string;
let verifySession: (token: string | null | undefined) => string | null;

describe('session sign/verify', () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = 'test-secret-abcdef0123456789';
    const mod = await import('./session');
    signSession = mod.signSession;
    verifySession = mod.verifySession;
  });

  it('round-trips a valid token (lowercased address)', () => {
    const token = signSession('0xAbC');
    expect(verifySession(token)).toBe('0xabc');
  });

  it('rejects a tampered signature', () => {
    const token = signSession('0xabc');
    const parts = token.split('.');
    parts[2] = parts[2].slice(0, -1) + (parts[2].endsWith('0') ? '1' : '0');
    expect(verifySession(parts.join('.'))).toBeNull();
  });

  it('rejects malformed / empty tokens', () => {
    expect(verifySession('not.a.token')).toBeNull();
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession('')).toBeNull();
  });
});
