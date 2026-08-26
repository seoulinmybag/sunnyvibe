import { ORIENTATIONS } from '../data/orientation';
import { TEMPLATES } from '../data/templates';
import type { Orientation, OrientationSpec, PageState, PlacedIcon, TextField } from '../types';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

// same fractional bands the standalone editor's default page uses (see src/App.tsx),
// duplicated here since this module must stay import-safe for both the browser and
// the Vercel serverless function that calls it — see the note in api/orders/create.ts
const PHOTO_LAYOUT = { photoY: 0.1, photoHeight: 0.42, messageY: 0.03, namesY: 0.58, dateY: 0.65, venueY: 0.7 };
const PLAIN_LAYOUT = { messageY: 0.1, namesY: 0.5, dateY: 0.585, venueY: 0.63 };

const DEFAULT_GREETING = '저희 두 사람, 사랑으로 하나 되어\n평생을 함께하고자 합니다.';
const FONT = "'Noto Serif KR', serif";

export interface ImageSize {
  width: number;
  height: number;
}

export interface LayoutOptions {
  panelType: 'single' | 'fold';
  hasAccount: boolean;
  hasMap: boolean;
  hasQr: boolean;
  orientation: Orientation;
  photoUrl: string | null;
  mapUrl: string | null;
  mapSize: ImageSize | null;
  qrUrl: string | null;
  qrSize: ImageSize | null;
  accountText: string | null;
  names: string;
  date: string;
  venue: string;
  greeting: string;
}

function emptyPage(): PageState {
  return { icons: [], texts: [], templateId: INITIAL_TEMPLATE.id, customColor: null };
}

function buildFrontPage(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const hasPhoto = !!opts.photoUrl;
  const layout = hasPhoto ? PHOTO_LAYOUT : PLAIN_LAYOUT;
  const fieldWidth = w * 0.82;
  const x = (w - fieldWidth) / 2;
  const fill = INITIAL_TEMPLATE.textColorDefault;

  const texts: TextField[] = [
    { id: 'message', label: '인사말', x, y: h * layout.messageY, width: fieldWidth, text: opts.greeting || DEFAULT_GREETING, fontSize: 20, fontFamily: FONT, fill, align: 'center', zIndex: 1 },
    { id: 'names', label: '신랑 · 신부', x, y: h * layout.namesY, width: fieldWidth, text: opts.names, fontSize: 34, fontFamily: FONT, fill, align: 'center', zIndex: 2 },
    { id: 'date', label: '날짜', x, y: h * layout.dateY, width: fieldWidth, text: opts.date, fontSize: 20, fontFamily: FONT, fill, align: 'center', zIndex: 3 },
    { id: 'venue', label: '장소', x, y: h * layout.venueY, width: fieldWidth, text: opts.venue, fontSize: 18, fontFamily: FONT, fill, align: 'center', zIndex: 4 },
  ];

  const icons: PlacedIcon[] = [];
  if (hasPhoto) {
    const width = w * 0.82;
    const height = h * PHOTO_LAYOUT.photoHeight;
    icons.push({
      uid: 'main-photo',
      iconId: 'customer-photo',
      src: opts.photoUrl!,
      x: (w - width) / 2,
      y: h * PHOTO_LAYOUT.photoY,
      width,
      height,
      rotation: 0,
      zIndex: 0,
    });
  }

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/** Fit an image within ~80% of a band's box, preserving aspect ratio (falls back to filling the box if the natural size wasn't probed). */
function fitWithinBand(natural: ImageSize | null, bandWidth: number, bandHeight: number): ImageSize {
  const maxW = bandWidth * 0.8;
  const maxH = bandHeight * 0.8;
  if (!natural || natural.width <= 0 || natural.height <= 0) return { width: maxW, height: maxH };
  const ratio = Math.min(maxW / natural.width, maxH / natural.height);
  return { width: natural.width * ratio, height: natural.height * ratio };
}

function makeImageIcon(
  uid: string,
  src: string,
  natural: ImageSize | null,
  spec: OrientationSpec,
  bandTop: number,
  bandHeight: number,
  zIndex: number,
): PlacedIcon {
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const bandBoxWidth = w * 0.82;
  const { width, height } = fitWithinBand(natural, bandBoxWidth, h * bandHeight);
  return {
    uid,
    iconId: uid, // synthetic non-library id, same convention as 'customer-photo'/'uploaded-photo'
    src,
    x: (w - width) / 2,
    y: h * bandTop + (h * bandHeight - height) / 2,
    width,
    height,
    rotation: 0,
    zIndex,
  };
}

function makeAccountText(text: string | null, spec: OrientationSpec, bandTop: number, bandHeight: number, zIndex: number): TextField {
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const fieldWidth = w * 0.82;
  return {
    id: 'account',
    label: '계좌정보',
    x: (w - fieldWidth) / 2,
    y: h * bandTop + h * bandHeight * 0.15,
    width: fieldWidth,
    text: text ?? '',
    fontSize: 16,
    fontFamily: FONT,
    fill: INITIAL_TEMPLATE.textColorDefault,
    align: 'center',
    zIndex,
  };
}

/** 1단(single panel) back side: stack whichever of 계좌/약도/QR are enabled, evenly, in that fixed order. */
function buildSinglePanelBack(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const enabled: Array<'account' | 'map' | 'qr'> = [];
  if (opts.hasAccount) enabled.push('account');
  if (opts.hasMap) enabled.push('map');
  if (opts.hasQr) enabled.push('qr');
  if (enabled.length === 0) return emptyPage();

  const bandHeight = 1 / enabled.length;
  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [];
  let z = 1;
  enabled.forEach((kind, i) => {
    const bandTop = i * bandHeight;
    if (kind === 'account') texts.push(makeAccountText(opts.accountText, spec, bandTop, bandHeight, z++));
    if (kind === 'map') icons.push(makeImageIcon('layout-map', opts.mapUrl!, opts.mapSize, spec, bandTop, bandHeight, z++));
    if (kind === 'qr') icons.push(makeImageIcon('layout-qr', opts.qrUrl!, opts.qrSize, spec, bandTop, bandHeight, z++));
  });
  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/** 2단 접지형(fold) back side: 약도 is always present and gets the largest band; 계좌/QR split the rest. */
function buildFoldBack(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const extras: Array<'account' | 'qr'> = [];
  if (opts.hasAccount) extras.push('account');
  if (opts.hasQr) extras.push('qr');

  const mapBandHeight = extras.length === 0 ? 1 : 0.55;
  const icons: PlacedIcon[] = [makeImageIcon('layout-map', opts.mapUrl!, opts.mapSize, spec, 0, mapBandHeight, 1)];
  const texts: TextField[] = [];
  const remaining = 1 - mapBandHeight;
  let z = 2;
  extras.forEach((kind, i) => {
    const bandTop = mapBandHeight + i * (remaining / extras.length);
    const bandHeight = remaining / extras.length;
    if (kind === 'account') texts.push(makeAccountText(opts.accountText, spec, bandTop, bandHeight, z++));
    if (kind === 'qr') icons.push(makeImageIcon('layout-qr', opts.qrUrl!, opts.qrSize, spec, bandTop, bandHeight, z++));
  });
  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

export function buildInitialPages(rawOpts: LayoutOptions): { front: PageState; back: PageState } {
  // 2단 접지형 always includes 약도 — normalize here even if the caller already did, defense in depth
  const opts: LayoutOptions = { ...rawOpts, hasMap: rawOpts.panelType === 'fold' ? true : rawOpts.hasMap };
  const front = buildFrontPage(opts);
  const back = opts.panelType === 'fold' ? buildFoldBack(opts) : buildSinglePanelBack(opts);
  return { front, back };
}
