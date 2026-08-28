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

interface ArtSpec {
  slug: string;
  label: string;
  width: number;
  height: number;
}

const WEDDING_ART: ArtSpec[] = [
  { slug: 'ring', label: '웨딩링', width: 400, height: 386 },
  { slug: 'ring-sparkle', label: '반짝 웨딩링', width: 318, height: 400 },
  { slug: 'dress', label: '웨딩드레스', width: 288, height: 400 },
  { slug: 'tuxedo', label: '턱시도', width: 314, height: 400 },
  { slug: 'bouquet', label: '부케', width: 331, height: 400 },
  { slug: 'cake', label: '웨딩케이크', width: 382, height: 400 },
  { slug: 'glasses', label: '축배잔', width: 394, height: 400 },
  { slug: 'bell', label: '웨딩종', width: 344, height: 400 },
  { slug: 'church', label: '교회', width: 341, height: 400 },
  { slug: 'car', label: '웨딩카', width: 400, height: 201 },
  { slug: 'camera', label: '카메라', width: 400, height: 314 },
  { slug: 'letter', label: '청첩장', width: 400, height: 359 },
  { slug: 'book', label: '방명록', width: 338, height: 400 },
  { slug: 'gift', label: '선물상자', width: 400, height: 343 },
  { slug: 'hands', label: '맞잡은 손', width: 400, height: 228 },
  { slug: 'lock', label: '사랑의 자물쇠', width: 400, height: 343 },
  { slug: 'tiara', label: '티아라', width: 400, height: 315 },
];

const WEATHER_ART: ArtSpec[] = [
  { slug: 'sun', label: '해', width: 399, height: 400 },
  { slug: 'sun-red', label: '빨간 해', width: 400, height: 376 },
  { slug: 'sun-cloud', label: '해와 구름', width: 400, height: 390 },
  { slug: 'cloud', label: '구름', width: 400, height: 266 },
  { slug: 'cloud-white', label: '하얀 구름', width: 400, height: 232 },
  { slug: 'cloud-dark', label: '먹구름', width: 400, height: 252 },
  { slug: 'cloud-rain', label: '비구름', width: 342, height: 400 },
  { slug: 'cloud-rain-2', label: '비구름 2', width: 395, height: 400 },
  { slug: 'cloud-snow', label: '눈구름', width: 400, height: 368 },
  { slug: 'cloud-star', label: '별과 구름', width: 400, height: 332 },
  { slug: 'rain', label: '비', width: 400, height: 365 },
  { slug: 'snow', label: '눈', width: 391, height: 400 },
  { slug: 'umbrella', label: '우산', width: 317, height: 400 },
  { slug: 'puddle', label: '물웅덩이', width: 400, height: 241 },
  { slug: 'lightning', label: '번개', width: 313, height: 400 },
  { slug: 'wind', label: '바람', width: 400, height: 225 },
  { slug: 'tornado', label: '회오리', width: 350, height: 400 },
  { slug: 'rainbow', label: '무지개', width: 400, height: 202 },
  { slug: 'moon', label: '달', width: 364, height: 400 },
  { slug: 'moon-star', label: '달과 별', width: 400, height: 329 },
  { slug: 'star', label: '별', width: 400, height: 378 },
  { slug: 'sparkle', label: '반짝임', width: 394, height: 400 },
  { slug: 'thermometer', label: '온도계', width: 181, height: 400 },
  { slug: 'sunset', label: '일몰', width: 400, height: 274 },
];

function artIcon(folder: 'wedding' | 'weather', category: string, spec: ArtSpec): IconDef {
  const src = ART_URLS[`../assets/icons/${folder}/${spec.slug}.png`];
  return {
    id: `${folder}-${spec.slug}`,
    label: spec.label,
    category,
    recolorable: false,
    naturalWidth: spec.width,
    naturalHeight: spec.height,
    src,
    getSrc: () => src,
  };
}

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
    recolorable: true,
    naturalWidth: 64,
    naturalHeight: 64,
    src: svgToDataUri(buildSvg(defaultColor, inner)),
    getSrc: (color: string) => svgToDataUri(buildSvg(color, inner)),
  };
}

const GOLD = '#b28a5b';
const PINK = '#d98ea1';
const GREEN = '#7c9473';

export const ICON_CATEGORIES = ['웨딩', '날씨', '하트/사랑', '꽃/식물', '장식/기타'] as const;

export const ICONS: IconDef[] = [
  ...WEDDING_ART.map((spec) => artIcon('wedding', '웨딩', spec)),
  ...WEATHER_ART.map((spec) => artIcon('weather', '날씨', spec)),

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

/** Full-colour artwork can't be tinted — only the generated line icons offer a colour swatch. */
export function isRecolorableIcon(iconId: string): boolean {
  return ICONS.find((i) => i.id === iconId)?.recolorable === true;
}

export function getIconDef(iconId: string): IconDef | undefined {
  return ICONS.find((i) => i.id === iconId);
}
