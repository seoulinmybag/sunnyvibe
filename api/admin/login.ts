import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { serializeCookie, signToken } from '../_cookies.js';
import { ADMIN_COOKIE, getCookieSecret } from '../_auth.js';

const SEVEN_DAYS = 60 * 60 * 24 * 7;

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ ok: false, error: 'server not configured' });
    return;
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !safeEqual(password, expected)) {
    res.status(401).json({ ok: false });
    return;
  }

  const token = signToken({ exp: Date.now() + SEVEN_DAYS * 1000 }, getCookieSecret());
  res.setHeader('Set-Cookie', serializeCookie(ADMIN_COOKIE, token, { maxAgeSeconds: SEVEN_DAYS }));
  res.status(200).json({ ok: true });
}
