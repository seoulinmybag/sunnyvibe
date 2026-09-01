import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsPDF } from 'jspdf';
import { requireOrderAccess } from '../_auth.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';
import { ORIENTATIONS } from '../../src/data/orientation.js';
import type { Orientation } from '../../src/types.js';

const BUCKET = 'order-exports';

function dataUriToBuffer(dataUri: string): Buffer {
  const comma = dataUri.indexOf(',');
  return Buffer.from(dataUri.slice(comma + 1), 'base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const orderId = typeof req.query.id === 'string' ? req.query.id : '';
  if (!orderId || !requireOrderAccess(req, orderId)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  // 1단은 두 면, 2단 접지는 외지 2면 + 내지 2면으로 넘어온다
  const panels: Array<{ side: string; printPng: string; svg: string }> = Array.isArray(req.body?.panels) ? req.body.panels : [];
  const valid =
    panels.length > 0 &&
    panels.every(
      (p) => p && typeof p.side === 'string' && typeof p.printPng === 'string' && typeof p.svg === 'string',
    );
  if (!valid) {
    res.status(400).json({ ok: false, error: 'panels(면별 printPng/svg)가 필요해요' });
    return;
  }

  const admin = getSupabaseAdmin();
  const { data: order, error: fetchError } = await admin.from('orders').select('orientation').eq('id', orderId).maybeSingle();
  if (fetchError || !order) {
    res.status(404).json({ ok: false, error: '주문을 찾을 수 없어요' });
    return;
  }

  try {
    const orientation = (order.orientation as Orientation) ?? 'landscape';
    const spec = ORIENTATIONS[orientation];
    const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

    const doc = new jsPDF({ orientation: pageOrientation, unit: 'mm', format: [spec.printWidthMm, spec.printHeightMm] });
    panels.forEach((panel, i) => {
      if (i > 0) doc.addPage([spec.printWidthMm, spec.printHeightMm], pageOrientation);
      doc.addImage(panel.printPng, 'PNG', 0, 0, spec.printWidthMm, spec.printHeightMm, undefined, 'FAST');
    });
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const pdfPath = `${orderId}/design.pdf`;
    const uploads = await Promise.all([
      admin.storage.from(BUCKET).upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true }),
      ...panels.flatMap((panel) => [
        admin.storage
          .from(BUCKET)
          .upload(`${orderId}/${panel.side}.png`, dataUriToBuffer(panel.printPng), { contentType: 'image/png', upsert: true }),
        admin.storage
          .from(BUCKET)
          .upload(`${orderId}/${panel.side}.svg`, Buffer.from(panel.svg, 'utf-8'), { contentType: 'image/svg+xml', upsert: true }),
      ]),
    ]);
    const uploadError = uploads.find((u) => u.error)?.error;
    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await admin
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_pdf_path: pdfPath,
        confirmed_png_path: `${orderId}/${panels[0].side}.png`,
        confirmed_svg_path: `${orderId}/${panels[0].side}.svg`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    if (updateError) throw new Error(updateError.message);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
}
