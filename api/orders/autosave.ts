import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, requireOrderAccess } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';
import { normalizePagesForStorage } from '../_storageUrls.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const orderId = typeof req.query.id === 'string' ? req.query.id : '';
  // the customer edits from /order/:id, the admin from the 주문서 screen — same write
  if (!orderId || !(requireOrderAccess(req, orderId) || requireAdmin(req))) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const pages = req.body?.pages;
  if (!pages || typeof pages !== 'object' || !pages.front || !pages.back) {
    res.status(400).json({ ok: false, error: 'pages가 필요해요' });
    return;
  }

  const admin = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await admin.from('orders').select('status').eq('id', orderId).maybeSingle();
  if (fetchError || !existing) {
    res.status(404).json({ ok: false, error: '주문을 찾을 수 없어요' });
    return;
  }
  if (existing.status === 'confirmed') {
    // design is locked — silently reject rather than error, the client just stops trying to save
    res.status(409).json({ ok: false, error: 'confirmed' });
    return;
  }

  // first customer write flips draft -> sent, a cheap signal for the dashboard that editing has started
  const nextStatus = existing.status === 'draft' ? 'sent' : existing.status;

  const { error } = await admin
    .from('orders')
    .update({ pages: normalizePagesForStorage(pages), status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.status(200).json({ ok: true, status: nextStatus });
}
