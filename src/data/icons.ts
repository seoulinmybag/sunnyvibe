import type { IconDef } from '../types';

/**
 * Placeholder icon set. Each icon is a hand-drawn inline SVG turned into a data URI
 * so the editor works with zero external assets. To swap in real artwork later,
 * drop files into `src/assets/icons/` and replace `buildSrc` below to return an
 * `import`ed file path instead — nothing else in the app needs to change (recoloring
 * would then need to be done as real color variants, since raster/SVG files can't be
 * recolored on the fly the way these generated SVGs are).
 */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildSvg(color: string, inner: (color: string) => string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${inner(color)}</svg>`;
}

function icon(
  id: string,
  label: string,
  category: string,
  defaultColor: string,
  inner: (color: string) => string,
): IconDef {
  return {
    id,
    label,
    category,
    defaultColor,
    src: svgToDataUri(buildSvg(defaultColor, inner)),
    getSrc: (color: string) => svgToDataUri(buildSvg(color, inner)),
  };
}

const GOLD = '#b28a5b';
const PINK = '#d98ea1';
const GREEN = '#7c9473';

export const ICON_CATEGORIES = ['하트/사랑', '꽃/식물', '웨딩 소품', '장식/기타'] as const;

export const ICONS: IconDef[] = [
  // 하트/사랑
  icon('heart', '하트', '하트/사랑', PINK, () => `<path d="M32 54S8 40 8 22a13 13 0 0 1 24-7 13 13 0 0 1 24 7c0 18-24 32-24 32Z"/>`),
  icon('double-heart', '더블하트', '하트/사랑', PINK, () => `
    <path d="M22 44S6 34 6 20a9.5 9.5 0 0 1 17-6 9.5 9.5 0 0 1 17 6c0 14-18 24-18 24Z" transform="translate(-2,4) scale(0.85)"/>
    <path d="M40 50S22 39 22 24a10.5 10.5 0 0 1 19-6.5 10.5 10.5 0 0 1 19 6.5c0 15-20 26-20 26Z" transform="translate(4,-2) scale(0.85)"/>
  `),
  icon('rings', '웨딩링', '하트/사랑', GOLD, () => `<circle cx="24" cy="38" r="12"/><circle cx="40" cy="26" r="12"/>`),
  icon('love-birds', '러브버드', '하트/사랑', GOLD, () => `
    <path d="M14 40c0-10 8-18 18-18"/>
    <path d="M50 40c0-10-8-18-18-18"/>
    <circle cx="14" cy="38" r="4"/><circle cx="50" cy="38" r="4"/>
    <path d="M32 22v-6M28 18h8" />
  `),
  icon('kiss', '키스', '하트/사랑', PINK, (c) => `<path d="M20 30c4-6 20-6 24 0" /><path d="M18 40c6 6 22 6 28 0"/><circle cx="24" cy="24" r="2" fill="${c}"/><circle cx="40" cy="24" r="2" fill="${c}"/>`),

  // 꽃/식물
  icon('flower', '꽃', '꽃/식물', PINK, () => `
    <circle cx="32" cy="32" r="6"/>
    <ellipse cx="32" cy="16" rx="7" ry="11"/>
    <ellipse cx="32" cy="48" rx="7" ry="11"/>
    <ellipse cx="16" cy="32" rx="11" ry="7"/>
    <ellipse cx="48" cy="32" rx="11" ry="7"/>
  `),
  icon('leaf-branch', '잎사귀 가지', '꽃/식물', GREEN, () => `
    <path d="M10 54C24 40 40 40 54 10"/>
    <path d="M20 44c4-6 10-8 14-14"/>
    <path d="M30 34c4-6 10-8 14-14"/>
  `),
  icon('wreath', '리스', '꽃/식물', GREEN, () => `
    <circle cx="32" cy="32" r="20"/>
    <path d="M16 20c4 4 4 8 0 12M48 20c-4 4-4 8 0 12M16 44c4-4 4-8 0-12M48 44c-4-4-4-8 0-12"/>
  `),
  icon('tulip', '튤립', '꽃/식물', PINK, () => `
    <path d="M32 30V54"/>
    <path d="M32 30c-8 0-12-6-12-14 6 0 10 3 12 8 2-5 6-8 12-8 0 8-4 14-12 14Z"/>
  `),
  icon('sprout', '새싹', '꽃/식물', GREEN, () => `<path d="M32 54V30"/><path d="M32 30c0-10-8-14-16-14 0 10 6 16 16 14Z"/><path d="M32 34c0-8 8-12 16-12 0 8-6 14-16 12Z"/>`),

  // 웨딩 소품
  icon('champagne', '샴페인잔', '웨딩 소품', GOLD, () => `
    <path d="M22 10h20l-4 18a6 6 0 0 1-12 0L22 10Z"/>
    <path d="M32 34v14M24 48h16"/>
  `),
  icon('bell', '종', '웨딩 소품', GOLD, () => `<path d="M20 42c0-14 4-24 12-24s12 10 12 24"/><path d="M16 42h32"/><path d="M28 48a4 4 0 0 0 8 0"/><path d="M32 12v4"/>`),
  icon('cake', '웨딩케이크', '웨딩 소품', GOLD, () => `
    <path d="M12 52h40v-8a4 4 0 0 0-4-4H16a4 4 0 0 0-4 4v8Z"/>
    <path d="M16 40h32v-6a4 4 0 0 0-4-4H20a4 4 0 0 0-4 4v6Z"/>
    <path d="M32 30v-6M28 20c0-3 4-3 4-6s-4-3-4-6"/>
  `),
  icon('envelope', '초대장', '웨딩 소품', GOLD, () => `<rect x="10" y="18" width="44" height="30" rx="3"/><path d="M12 20l20 16 20-16"/>`),
  icon('ribbon', '리본', '웨딩 소품', PINK, () => `<path d="M32 26c-10-10-22-6-22 2s12 8 22 2Zm0 0c10-10 22-6 22 2s-12 8-22 2Z"/><path d="M32 26v28"/><path d="M32 54l-6 8M32 54l6 8"/>`),

  // 장식/기타
  icon('star', '별', '장식/기타', GOLD, () => `<path d="M32 8l6 16 17 2-13 11 4 17-14-9-14 9 4-17-13-11 17-2Z"/>`),
  icon('sparkle', '반짝임', '장식/기타', GOLD, () => `<path d="M32 8v14M32 42v14M8 32h14M42 32h14M16 16l10 10M38 38l10 10M48 16 38 26M26 38 16 48"/>`),
  icon('moon', '달', '장식/기타', GOLD, () => `<path d="M40 12a20 20 0 1 0 12 24 16 16 0 0 1-12-24Z"/>`),
  icon('frame', '모노그램 프레임', '장식/기타', GOLD, () => `<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="17"/>`),
  icon('dove', '비둘기', '장식/기타', GOLD, () => `<path d="M10 30c8-4 14 0 16 6 2-8 10-14 18-12-4 2-6 6-4 10 6-2 12 0 14 6-10 2-16-2-20-8-2 6-8 10-16 10-4-4-6-8-8-12Z"/>`),
];

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
