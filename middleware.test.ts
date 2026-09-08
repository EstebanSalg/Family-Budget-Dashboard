import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

function requestFor(pathname: string, opts?: { cookie?: string }): NextRequest {
  const req = new NextRequest(new URL(pathname, 'http://localhost:3000'));
  if (opts?.cookie) {
    req.cookies.set('session', opts.cookie);
  }
  return req;
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret';
});

describe('middleware', () => {
  it('lets the cron scheduler route through with no session cookie (real Vercel Cron has none)', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(requestFor('/api/recurring/scheduler'));
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(308);
    expect(res.headers.get('location')).toBeNull();
  });

  it('lets a nested path under the cron scheduler route through too', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(requestFor('/api/recurring/scheduler/anything'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('does NOT exempt a same-level sibling path that merely shares the scheduler prefix as a string', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(requestFor('/api/recurring/scheduler-status'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('still redirects an ordinary protected route with no session cookie', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(requestFor('/'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('still redirects other /api routes with no session cookie (exemption is narrowly scoped)', async () => {
    const { middleware } = await import('./middleware');
    const res = await middleware(requestFor('/api/recurring'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('lets a protected route through when a valid session cookie is present', async () => {
    const { middleware } = await import('./middleware');
    const { signSession } = await import('@/lib/auth/session');
    const token = await signSession();
    const res = await middleware(requestFor('/', { cookie: token }));
    expect(res.headers.get('location')).toBeNull();
  });

  it('lets /login and /api/login through with no session cookie', async () => {
    const { middleware } = await import('./middleware');
    const loginRes = await middleware(requestFor('/login'));
    const apiLoginRes = await middleware(requestFor('/api/login'));
    expect(loginRes.headers.get('location')).toBeNull();
    expect(apiLoginRes.headers.get('location')).toBeNull();
  });
});
