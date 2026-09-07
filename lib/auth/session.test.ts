import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret';
});

describe('session signing', () => {
  it('a freshly signed session verifies as valid', async () => {
    const { signSession, verifySession } = await import('./session');
    const token = await signSession();
    expect(await verifySession(token)).toBe(true);
  });

  it('a tampered token fails verification', async () => {
    const { signSession, verifySession } = await import('./session');
    const token = await signSession();
    expect(await verifySession(token + 'x')).toBe(false);
  });

  it('undefined fails verification', async () => {
    const { verifySession } = await import('./session');
    expect(await verifySession(undefined)).toBe(false);
  });
});
