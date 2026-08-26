import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .select('id, customer_name, panel_type, status, created_at, confirmed_at')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.status(200).json({ ok: true, orders: data });
}
