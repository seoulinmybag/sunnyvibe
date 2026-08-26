import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCookie } from '../_cookies.js';
import { ADMIN_COOKIE } from '../_auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }
  res.setHeader('Set-Cookie', clearCookie(ADMIN_COOKIE));
  res.status(200).json({ ok: true });
}
