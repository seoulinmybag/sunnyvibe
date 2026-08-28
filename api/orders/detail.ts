import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';
import { resolvePagesForClient } from '../_storageUrls.js';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

async function signedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const orderId = typeof req.query.id === 'string' ? req.query.id : '';
  if (!orderId) {
    res.status(400).json({ ok: false, error: 'id가 필요해요' });
    return;
  }

  const { data: order, error } = await getSupabaseAdmin().from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error || !order) {
    res.status(404).json({ ok: false, error: '주문을 찾을 수 없어요' });
    return;
  }

  const isConfirmed = order.status === 'confirmed';

  const [photoUrl, mapUrl, qrUrl, pdfUrl, frontPngUrl, backPngUrl, frontSvgUrl, backSvgUrl] = await Promise.all([
    signedUrl('order-photos', order.photo_path),
    signedUrl('order-maps', order.map_path),
    signedUrl('order-qr', order.qr_path),
    isConfirmed ? signedUrl('order-exports', `${orderId}/design.pdf`) : Promise.resolve(null),
    isConfirmed ? signedUrl('order-exports', `${orderId}/front.png`) : Promise.resolve(null),
    isConfirmed ? signedUrl('order-exports', `${orderId}/back.png`) : Promise.resolve(null),
    isConfirmed ? signedUrl('order-exports', `${orderId}/front.svg`) : Promise.resolve(null),
    isConfirmed ? signedUrl('order-exports', `${orderId}/back.svg`) : Promise.resolve(null),
  ]);

  res.status(200).json({
    ok: true,
    order: {
      id: order.id,
      customerName: order.customer_name,
      panelType: order.panel_type,
      orientation: order.orientation,
      // the 주문서 screen edits these text fields in place, so they round-trip through here
      pages: await resolvePagesForClient(order.pages),
      status: order.status,
      createdAt: order.created_at,
      confirmedAt: order.confirmed_at,
      hasAccount: order.has_account,
      hasMap: order.has_map,
      hasQr: order.has_qr,
      photoUrl,
      mapUrl,
      qrUrl,
      customerLink: `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}/order/${order.id}`,
      exports: isConfirmed ? { pdfUrl, frontPngUrl, backPngUrl, frontSvgUrl, backSvgUrl } : null,
    },
  });
}
