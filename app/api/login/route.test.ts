// app/api/login/route.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

function makeRequest(password: string): NextRequest {
  return new NextRequest('http://localhost/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

const ORIGINAL_DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

describe('POST /api/login', () => {
  afterEach(() => {
    if (ORIGINAL_DASHBOARD_PASSWORD === undefined) {
      delete process.env.DASHBOARD_PASSWORD;
    } else {
      process.env.DASHBOARD_PASSWORD = ORIGINAL_DASHBOARD_PASSWORD;
    }
  });

  it('fails closed with 500 when DASHBOARD_PASSWORD is not set, rather than authenticating an empty password', async () => {
    delete process.env.DASHBOARD_PASSWORD;
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret';
    const { POST } = await import('./route');

    // Pre-fix, an unset DASHBOARD_PASSWORD made both sides of the comparison
    // `undefined`, so this empty password would have authenticated.
    const res = await POST(makeRequest(''));

    expect(res.status).toBe(500);
    expect(res.cookies.get('session')).toBeUndefined();
  });

  it('rejects an incorrect password with 401 when DASHBOARD_PASSWORD is set', async () => {
    process.env.DASHBOARD_PASSWORD = 'correct-horse';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret';
    const { POST } = await import('./route');

    const res = await POST(makeRequest('wrong'));

    expect(res.status).toBe(401);
  });

  it('accepts the correct password and issues a session cookie', async () => {
    process.env.DASHBOARD_PASSWORD = 'correct-horse';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret';
    const { POST } = await import('./route');

    const res = await POST(makeRequest('correct-horse'));

    expect(res.status).toBe(200);
    expect(res.cookies.get('session')).toBeDefined();
  });
});
