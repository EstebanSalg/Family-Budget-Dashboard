import crypto from 'node:crypto';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export function signSession(): string {
  const payload = 'family-budget-dashboard';
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, hmac] = token.split('.');
  if (!payload || !hmac) return false;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  if (expected.length !== hmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
}
