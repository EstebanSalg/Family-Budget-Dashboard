import type { NextRequest } from 'next/server';

// Behind Fly.io's edge proxy, TLS terminates at the edge and the container
// only ever sees a plain-HTTP internal connection -- req.url's own origin
// resolves to "http://..." there, which doesn't match the "https://..."
// redirect URI registered with Google, breaking the OAuth flow with a
// generic "doesn't comply with Google's OAuth 2.0 policy" error. Fly (like
// most reverse proxies) sets X-Forwarded-Proto/X-Forwarded-Host to the
// original external request's values, so prefer those when present; local
// dev and Vercel (which Next.js already normalizes) have no such header, so
// req.url's own origin is used as-is there.
export function getRequestOrigin(req: NextRequest): string {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(req.url).origin;
}
