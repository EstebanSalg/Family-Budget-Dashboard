import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

const PUBLIC_PATHS = ['/login', '/api/login'];
// Routes with their own independent auth (e.g. a Bearer-token check inside the
// handler itself) instead of the session cookie — add future cron/webhook
// routes here as they're introduced.
const INDEPENDENTLY_AUTHENTICATED_PATHS = ['/api/recurring/scheduler'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    INDEPENDENTLY_AUTHENTICATED_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }
  const token = req.cookies.get('session')?.value;
  if (!(await verifySession(token))) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
