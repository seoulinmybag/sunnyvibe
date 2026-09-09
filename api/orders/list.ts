import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  // 휴지통에 든 주문은 목록에서 뺀다. deleted_at 컬럼이 아직 없는 환경에서도 죽지 않게
  // 필터가 실패하면 필터 없이 한 번 더 불러온다.
  const admin = getSupabaseAdmin();
  const columns = 'id, customer_name, panel_type, status, created_at, confirmed_at';
  let { data, error } = await admin.from('orders').select(columns).is('deleted_at', null).order('created_at', { ascending: false });
  if (error && /deleted_at/.test(error.message)) {
    ({ data, error } = await admin.from('orders').select(columns).order('created_at', { ascending: false }));
  }

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.status(200).json({ ok: true, orders: data });
}
