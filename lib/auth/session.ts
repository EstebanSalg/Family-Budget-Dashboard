// Uses the Web Crypto API (global `crypto.subtle`), not `node:crypto` — this file
// is imported by middleware.ts, which runs on the Edge Runtime and has no access
// to Node's crypto module. Web Crypto works in both the Edge Runtime and Node.js.

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signSession(): Promise<string> {
  const payload = 'family-budget-dashboard';
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, hmac] = token.split('.');
  if (!payload || !hmac) return false;

  const key = await getHmacKey();
  const expectedSignature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedHex = toHex(expectedSignature);
  if (expectedHex.length !== hmac.length) return false;

  // Constant-time compare: Web Crypto has no built-in timingSafeEqual, so
  // accumulate an XOR difference over every character instead of short-
  // circuiting on the first mismatch (which would leak timing information).
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ hmac.charCodeAt(i);
  }
  return diff === 0;
}
