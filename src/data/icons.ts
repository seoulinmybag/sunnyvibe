import { ART_CATEGORIES } from './iconCatalog';
import type { IconDef } from '../types';

/**
 * Two icon sources live here:
 *  - ART_*: the real crayon-style artwork (PNG, full colour, so not recolorable).
 *    Vite emits each file as a hashed asset URL; they're trimmed to their own
 *    bounding box, so `width`/`height` below are the real proportions and the
 *    editor places them without squashing.
 *  - the generated line SVGs further down: placeholders for the categories that
 *    don't have real artwork yet (하트/사랑, 꽃/식물, 장식/기타). Those stay
 *    recolorable because they're built from a template at request time.
 */
const ART_URLS = import.meta.glob('../assets/icons/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface ArtSpec {
  slug: string;
  label: string;
  width: number;
  height: number;
}

function artIcon(folder: string, category: string, spec: ArtSpec): IconDef {
  const src = ART_URLS[`../assets/icons/${folder}/${spec.slug}.png`];
  return {
    id: spec.slug,
    label: spec.label,
    category,
    recolorable: false,
    naturalWidth: spec.width,
    naturalHeight: spec.height,
    src,
    getSrc: () => src,
  };
}

export const ICON_CATEGORIES = ART_CATEGORIES.map((c) => c.category);

export const ICONS: IconDef[] = ART_CATEGORIES.flatMap((c) => c.items.map((spec) => artIcon(c.folder, c.category, spec)));

export function iconsByCategory(category: string): IconDef[] {
  return ICONS.filter((i) => i.category === category);
}

export function isLibraryIcon(iconId: string): boolean {
  return ICONS.some((i) => i.id === iconId);
}

/** Resolve the actual image src for a placed icon, applying a custom color if given. */
export function getIconSrc(iconId: string, color?: string): string | undefined {
  const def = ICONS.find((i) => i.id === iconId);
  if (!def) return undefined;
  return color ? def.getSrc(color) : def.src;
}

export function getIconDefaultColor(iconId: string): string {
  return ICONS.find((i) => i.id === iconId)?.defaultColor ?? '#000000';
}

/** Full-colour artwork can't be tinted — only the generated line icons offer a colour swatch. */
export function isRecolorableIcon(iconId: string): boolean {
  return ICONS.find((i) => i.id === iconId)?.recolorable === true;
}

export function getIconDef(iconId: string): IconDef | undefined {
  return ICONS.find((i) => i.id === iconId);
}
