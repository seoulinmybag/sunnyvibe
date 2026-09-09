import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';

/** 휴지통에 머무는 기간. 지나면 목록을 열 때 실제로 지운다. */
export const TRASH_DAYS = 14;

const ASSET_BUCKETS = ['order-photos', 'order-maps', 'order-qr', 'order-exports'] as const;

/** 주문 하나에 딸린 업로드/내보내기 파일을 통째로 지운다. */
async function purgeFiles(orderId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await Promise.all(
    ASSET_BUCKETS.map(async (bucket) => {
      const { data } = await admin.storage.from(bucket).list(orderId);
      if (!data?.length) return;
      await admin.storage.from(bucket).remove(data.map((f) => `${orderId}/${f.name}`));
    }),
  );
}

/** 보관 기간이 지난 주문을 실제로 지운다. 별도 배치 없이 휴지통을 열 때 정리한다. */
async function purgeExpired(): Promise<number> {
  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin.from('orders').select('id').not('deleted_at', 'is', null).lt('deleted_at', cutoff);
  if (!data?.length) return 0;
  const ids = data.map((row: { id: string }) => row.id);
  await Promise.all(ids.map(purgeFiles));
  await admin.from('orders').delete().in('id', ids);
  return ids.length;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const admin = getSupabaseAdmin();

  // GET = 휴지통 목록. 열 때마다 기한 지난 것을 먼저 정리한다.
  if (req.method === 'GET') {
    let purged = 0;
    try {
      purged = await purgeExpired();
    } catch (err) {
      console.error('purge failed', err);
    }
    const { data, error } = await admin
      .from('orders')
      .select('id, customer_name, panel_type, status, created_at, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }
    res.status(200).json({ ok: true, orders: data ?? [], purged, trashDays: TRASH_DAYS });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const orderId = typeof req.body?.id === 'string' ? req.body.id : '';
  const action = req.body?.action;
  if (!orderId || (action !== 'delete' && action !== 'restore' && action !== 'purge')) {
    res.status(400).json({ ok: false, error: 'id와 action(delete/restore/purge)이 필요해요' });
    return;
  }

  try {
    if (action === 'purge') {
      await purgeFiles(orderId);
      const { error } = await admin.from('orders').delete().eq('id', orderId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin
        .from('orders')
        .update({ deleted_at: action === 'delete' ? new Date().toISOString() : null })
        .eq('id', orderId);
      if (error) throw new Error(error.message);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = (err as Error).message;
    // deleted_at 컬럼이 아직 없으면 무슨 SQL을 돌려야 하는지 알려준다
    if (/deleted_at/.test(message)) {
      res.status(500).json({
        ok: false,
        error: "휴지통을 쓰려면 Supabase에서 한 번만 실행해주세요: alter table orders add column deleted_at timestamptz;",
      });
      return;
    }
    console.error(err);
    res.status(500).json({ ok: false, error: message });
  }
}
