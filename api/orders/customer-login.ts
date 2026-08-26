import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { serializeCookie, signToken } from '../_cookies.js';
import { ORDER_COOKIE, getCookieSecret } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!orderId || !password) {
    res.status(400).json({ ok: false, error: 'orderId, password가 필요해요' });
    return;
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('orders')
    .select('id, customer_name, orientation, pages, status, customer_password_hash')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    res.status(404).json({ ok: false, error: '주문을 찾을 수 없어요' });
    return;
  }

  const match = await bcrypt.compare(password, order.customer_password_hash as string);
  if (!match) {
    res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않아요' });
    return;
  }

  const token = signToken({ orderId, exp: Date.now() + THIRTY_DAYS * 1000 }, getCookieSecret());
  res.setHeader('Set-Cookie', serializeCookie(ORDER_COOKIE, token, { maxAgeSeconds: THIRTY_DAYS }));
  res.status(200).json({
    ok: true,
    order: {
      id: order.id,
      customerName: order.customer_name,
      orientation: order.orientation,
      pages: order.pages,
      status: order.status,
    },
  });
}
