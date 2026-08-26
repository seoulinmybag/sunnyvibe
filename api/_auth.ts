import type { VercelRequest } from '@vercel/node';
import { parseCookies, verifyToken } from './_cookies.js';

const ADMIN_COOKIE = 'admin_session';
const ORDER_COOKIE = 'order_session';

interface AdminPayload {
  exp: number;
}

interface OrderPayload {
  exp: number;
  orderId: string;
}

function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error('COOKIE_SECRET is not set');
  return secret;
}

export function requireAdmin(req: VercelRequest): boolean {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifyToken<AdminPayload>(cookies[ADMIN_COOKIE], getCookieSecret());
  return payload !== null;
}

/** Reserved for Phase 3+ (customer-facing endpoints); unused until then. */
export function requireOrderAccess(req: VercelRequest, orderId: string): boolean {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifyToken<OrderPayload>(cookies[ORDER_COOKIE], getCookieSecret());
  return payload !== null && payload.orderId === orderId;
}

export { ADMIN_COOKIE, ORDER_COOKIE, getCookieSecret };
