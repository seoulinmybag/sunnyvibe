import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireOrderAccess } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';
import { resolvePagesForClient } from '../_storageUrls.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orderId = typeof req.query.id === 'string' ? req.query.id : '';
  if (!orderId || !requireOrderAccess(req, orderId)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('orders')
    .select('id, customer_name, orientation, pages, status')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    res.status(404).json({ ok: false, error: '주문을 찾을 수 없어요' });
    return;
  }

  res.status(200).json({
    ok: true,
    order: {
      id: order.id,
      customerName: order.customer_name,
      orientation: order.orientation,
      pages: await resolvePagesForClient(order.pages),
      status: order.status,
    },
  });
}
