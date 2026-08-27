import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { imageSize } from 'image-size';
import type { File as FormidableFile } from 'formidable';
import { requireAdmin } from '../_auth.js';
import { parseForm } from '../_parseForm.js';
import { getSupabaseAdmin } from '../_supabaseAdmin.js';
import { buildInitialPages } from '../../src/lib/layoutGenerator.js';
import type { DeceasedStyle, FamilyInfo, ImageSize, LayoutOptions } from '../../src/lib/layoutGenerator.js';

export const config = { api: { bodyParser: false } };

const BUCKETS = { photo: 'order-photos', map: 'order-maps', qr: 'order-qr' } as const;

function randomDigits(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function ext(file: FormidableFile): string {
  const name = file.originalFilename ?? '';
  const dot = name.lastIndexOf('.');
  return dot === -1 ? 'jpg' : name.slice(dot + 1).toLowerCase();
}

async function uploadOne(bucket: string, path: string, file: FormidableFile): Promise<{ path: string; buffer: Buffer }> {
  const buffer = await readFile(file.filepath);
  const { error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .upload(path, buffer, { contentType: file.mimetype ?? undefined, upsert: true });
  if (error) throw new Error(`upload to ${bucket} failed: ${error.message}`);
  return { path, buffer };
}

/** 부모님 이름은 두 분 다 선택 입력 — 한 분만 넣는 고객도 있어서 빈 값을 그대로 허용한다. */
function readFamily(fields: Record<string, string>, side: 'groom' | 'bride'): FamilyInfo {
  return {
    name: (fields[`${side}_name`] ?? '').trim(),
    father: {
      name: (fields[`${side}_father`] ?? '').trim(),
      deceased: fields[`${side}_father_deceased`] === 'true',
    },
    mother: {
      name: (fields[`${side}_mother`] ?? '').trim(),
      deceased: fields[`${side}_mother_deceased`] === 'true',
    },
  };
}

function probeSize(buffer: Buffer): ImageSize | null {
  try {
    const { width, height } = imageSize(buffer);
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }
  if (!requireAdmin(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  let fields: Record<string, string>;
  let files: Record<string, FormidableFile>;
  try {
    ({ fields, files } = await parseForm(req));
  } catch (err) {
    res.status(400).json({ ok: false, error: `업로드 파싱 실패: ${(err as Error).message}` });
    return;
  }

  const customerName = fields.customer_name?.trim();
  const panelType = fields.panel_type === 'fold' ? 'fold' : fields.panel_type === 'single' ? 'single' : null;
  if (!customerName || !panelType) {
    res.status(400).json({ ok: false, error: '고객명과 레이아웃 타입은 필수예요.' });
    return;
  }
  if (!files.photo) {
    res.status(400).json({ ok: false, error: '신랑신부 사진은 필수예요.' });
    return;
  }

  const hasAccount = fields.has_account === 'true';
  const hasQr = fields.has_qr === 'true';
  const hasMap = panelType === 'fold' ? true : fields.has_map === 'true';
  if (hasMap && !files.map) {
    res.status(400).json({ ok: false, error: '약도 이미지가 필요해요.' });
    return;
  }
  if (hasQr && !files.qr) {
    res.status(400).json({ ok: false, error: 'QR 이미지가 필요해요.' });
    return;
  }

  const orientation = fields.orientation === 'portrait' ? 'portrait' : 'landscape';
  const groom = readFamily(fields, 'groom');
  const bride = readFamily(fields, 'bride');
  const deceasedStyle: DeceasedStyle = fields.deceased_style === 'flower' ? 'flower' : 'hanja';
  const id = randomUUID();

  try {
    const photoPath = `${id}/photo.${ext(files.photo)}`;
    // the front layout anchors the photo to the bottom edge at its own aspect ratio, so its
    // natural size has to be known here — otherwise it would be stretched to a guessed ratio
    const { buffer: photoBuffer } = await uploadOne(BUCKETS.photo, photoPath, files.photo);
    const photoSize = probeSize(photoBuffer);

    let mapPath: string | null = null;
    let mapSize: ImageSize | null = null;
    if (hasMap && files.map) {
      mapPath = `${id}/map.${ext(files.map)}`;
      const { buffer } = await uploadOne(BUCKETS.map, mapPath, files.map);
      mapSize = probeSize(buffer);
    }

    let qrPath: string | null = null;
    let qrSize: ImageSize | null = null;
    if (hasQr && files.qr) {
      qrPath = `${id}/qr.${ext(files.qr)}`;
      const { buffer } = await uploadOne(BUCKETS.qr, qrPath, files.qr);
      qrSize = probeSize(buffer);
    }

    // signed URLs (1 hour) so the layout generator can embed real, loadable image src values
    const admin = getSupabaseAdmin();
    const { data: photoSigned } = await admin.storage.from(BUCKETS.photo).createSignedUrl(photoPath, 3600);
    const { data: mapSigned } = mapPath ? await admin.storage.from(BUCKETS.map).createSignedUrl(mapPath, 3600) : { data: null };
    const { data: qrSigned } = qrPath ? await admin.storage.from(BUCKETS.qr).createSignedUrl(qrPath, 3600) : { data: null };

    const layoutOptions: LayoutOptions = {
      panelType,
      hasAccount,
      hasMap,
      hasQr,
      orientation,
      photoUrl: photoSigned?.signedUrl ?? null,
      photoSize,
      mapUrl: mapSigned?.signedUrl ?? null,
      mapSize,
      qrUrl: qrSigned?.signedUrl ?? null,
      qrSize,
      accountText: hasAccount ? (fields.account_text ?? '') : null,
      groom,
      bride,
      deceasedStyle,
      // 앞면 표시 이름은 비워두면 신랑·신부 이름으로 자동 조합
      names: fields.names?.trim() || [groom.name, bride.name].filter(Boolean).join(' · ') || '신랑 · 신부',
      title: fields.title || '',
      date: fields.date || '',
      venue: fields.venue || '',
      greeting: fields.greeting || '',
    };
    const pages = buildInitialPages(layoutOptions);

    const rawPassword = fields.customer_password?.trim() || randomDigits(4);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const { error: insertError } = await admin.from('orders').insert({
      id,
      customer_name: customerName,
      groom_name: groom.name || null,
      bride_name: bride.name || null,
      wedding_date: fields.date || null,
      venue: fields.venue || null,
      greeting: fields.greeting || null,
      panel_type: panelType,
      has_account: hasAccount,
      has_map: hasMap,
      has_qr: hasQr,
      account_text: hasAccount ? fields.account_text || null : null,
      orientation,
      photo_path: photoPath,
      map_path: mapPath,
      qr_path: qrPath,
      pages,
      customer_password_hash: passwordHash,
      status: 'draft',
    });
    if (insertError) throw new Error(insertError.message);

    const origin = `https://${req.headers.host}`;
    res.status(200).json({
      ok: true,
      id,
      customerLink: `${origin}/order/${id}`,
      customerPassword: rawPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
}
