import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ authenticated: requireAdmin(req) });
}
