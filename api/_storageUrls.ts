import { getSupabaseAdmin } from './_supabaseAdmin.js';

/**
 * Signed storage URLs expire, so a design can't keep one in its saved state — an order opened
 * the next day would render with dead <image> links. What gets stored is a permanent
 * `storage://bucket/path` pointer instead, swapped for a fresh signed URL on every read.
 *
 * Reads also repair legacy rows: orders created before this existed have expired signed URLs
 * baked into their pages, and those parse back to the same pointer.
 */

/** Long enough that a single editing session never outlives its own images. */
const SIGNED_URL_TTL = 60 * 60 * 12;

const BUCKETS = ['order-photos', 'order-maps', 'order-qr'] as const;

const STORAGE_REF = /^storage:\/\/([^/]+)\/(.+)$/;
/** …/storage/v1/object/{sign|public|authenticated}/<bucket>/<path>?token=… */
const OBJECT_URL = /\/storage\/v1\/object\/(?:sign\/|public\/|authenticated\/)?([^/?]+)\/([^?]+)/;

function isOurBucket(name: string): boolean {
  return (BUCKETS as readonly string[]).includes(name);
}

/** Permanent pointer for a src, or null if it isn't one of our stored files (icons, data URIs). */
export function toStorageRef(src: string): string | null {
  if (STORAGE_REF.test(src)) return src;
  if (src.startsWith('data:')) return null;
  const match = OBJECT_URL.exec(src);
  if (!match) return null;
  const [, bucket, path] = match;
  if (!isOurBucket(bucket)) return null;
  return `storage://${bucket}/${decodeURIComponent(path)}`;
}

interface LooseIcon {
  src?: unknown;
}

function forEachIcon(pages: unknown, visit: (icon: LooseIcon) => void): void {
  if (!pages || typeof pages !== 'object') return;
  for (const page of Object.values(pages as Record<string, unknown>)) {
    if (!page || typeof page !== 'object') continue;
    const icons = (page as { icons?: unknown }).icons;
    if (!Array.isArray(icons)) continue;
    for (const icon of icons) {
      if (icon && typeof icon === 'object') visit(icon as LooseIcon);
    }
  }
}

/** Call before writing pages to the database. */
export function normalizePagesForStorage<T>(pages: T): T {
  forEachIcon(pages, (icon) => {
    if (typeof icon.src !== 'string') return;
    const ref = toStorageRef(icon.src);
    if (ref) icon.src = ref;
  });
  return pages;
}

/** Call before handing pages to a browser. */
export async function resolvePagesForClient<T>(pages: T): Promise<T> {
  const refs = new Set<string>();
  forEachIcon(pages, (icon) => {
    if (typeof icon.src !== 'string') return;
    const ref = toStorageRef(icon.src);
    if (ref) refs.add(ref);
  });
  if (refs.size === 0) return pages;

  const admin = getSupabaseAdmin();
  const signed = new Map<string, string>();
  await Promise.all(
    [...refs].map(async (ref) => {
      const match = STORAGE_REF.exec(ref);
      if (!match) return;
      const { data } = await admin.storage.from(match[1]).createSignedUrl(match[2], SIGNED_URL_TTL);
      if (data?.signedUrl) signed.set(ref, data.signedUrl);
    }),
  );

  forEachIcon(pages, (icon) => {
    if (typeof icon.src !== 'string') return;
    const ref = toStorageRef(icon.src);
    const url = ref ? signed.get(ref) : undefined;
    if (url) icon.src = url;
  });
  return pages;
}
