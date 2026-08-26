import { createHmac, timingSafeEqual } from 'node:crypto';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/** Sign a small JSON payload into a single opaque cookie-safe string. */
export function signToken(payload: Record<string, unknown>, secret: string): string {
  const body = base64url(JSON.stringify(payload));
  return `${body}.${hmac(body, secret)}`;
}

/** Verify + decode a token produced by signToken. Returns null if invalid, tampered, or expired. */
export function verifyToken<T extends { exp: number }>(token: string | undefined, secret: string): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(body, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function serializeCookie(
  name: string,
  value: string,
  opts: { maxAgeSeconds: number; path?: string },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path ?? '/'}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.VERCEL_ENV) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(name: string, path = '/'): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax`;
}
