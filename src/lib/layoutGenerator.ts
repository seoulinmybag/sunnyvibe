import { ORIENTATIONS } from '../data/orientation.js';
import { TEMPLATES } from '../data/templates.js';
import type { Orientation, PageState, PlacedIcon, TextField } from '../types.js';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

const DEFAULT_GREETING = '저희 두 사람, 사랑으로 하나 되어\n평생을 함께하고자 합니다.';
const FONT = "'Noto Serif KR', serif";

/** 제목은 레퍼런스처럼 사진 위에 얹는 검은 자막 바로 들어간다. */
const CAPTION_BG = '#141414';
const CAPTION_FILL = '#ffffff';
/** 사진 원본 크기를 못 읽었을 때 쓰는 세로형 인물사진 기본 비율(가로/세로). */
const DEFAULT_PHOTO_ASPECT = 0.75;

/**
 * 앞면: 보정 완료된 신랑신부 사진이 가운데·아래 맞닿게 크게 들어가고,
 * 이름은 사진 위 여백(상단), 제목은 사진 위에 겹치는 하단 중앙 자막.
 */
const FRONT: Record<Orientation, {
  photoMaxHeight: number;
  photoMaxWidth: number;
  namesY: number;
  namesSize: number;
  titleY: number;
  titleSize: number;
}> = {
  landscape: { photoMaxHeight: 0.86, photoMaxWidth: 0.55, namesY: 0.05, namesSize: 30, titleY: 0.79, titleSize: 20 },
  portrait: { photoMaxHeight: 0.86, photoMaxWidth: 0.84, namesY: 0.045, namesSize: 28, titleY: 0.81, titleSize: 18 },
};

/**
 * 뒷면(2단 접지형은 내지 우측)에는 공통으로 인사말이 들어가고,
 * 계좌/약도/QR이 그 아래를 나눠 쓴 뒤 맨 아래에 날짜·장소가 온다.
 */
const BACK: Record<Orientation, {
  greetingY: number;
  greetingSize: number;
  familyParentsY: number;
  familyParentsSize: number;
  familyNameY: number;
  familyNameSize: number;
  optionsTop: number;
  /** 혼주 블록이 들어가면 옵션 스택이 그만큼 아래에서 시작한다. */
  optionsTopWithFamily: number;
  optionsBottom: number;
  dateY: number;
  dateSize: number;
  venueY: number;
  venueSize: number;
}> = {
  landscape: {
    greetingY: 0.08, greetingSize: 16,
    familyParentsY: 0.25, familyParentsSize: 12, familyNameY: 0.3, familyNameSize: 19,
    optionsTop: 0.26, optionsTopWithFamily: 0.42, optionsBottom: 0.78,
    dateY: 0.84, dateSize: 18, venueY: 0.905, venueSize: 16,
  },
  portrait: {
    greetingY: 0.1, greetingSize: 16,
    familyParentsY: 0.3, familyParentsSize: 13, familyNameY: 0.345, familyNameSize: 21,
    optionsTop: 0.3, optionsTopWithFamily: 0.46, optionsBottom: 0.8,
    dateY: 0.855, dateSize: 18, venueY: 0.91, venueSize: 16,
  },
};

/** 옵션(계좌/약도/QR)이 하나도 없을 때 날짜·장소를 끌어올려 아래가 텅 비지 않게 한다. */
const BACK_NO_OPTIONS = { dateY: 0.56, venueY: 0.625 };

/** 고인 표시: 한자 '故' 또는 국화꽃. 인쇄 문제가 없도록 이모지가 아닌 일반 글리프를 쓴다. */
export const DECEASED_MARKS = { hanja: '故', flower: '✿' } as const;
export type DeceasedStyle = keyof typeof DECEASED_MARKS;

export interface ParentInfo {
  name: string;
  deceased: boolean;
}

export interface FamilyInfo {
  /** 신랑 또는 신부 본인 이름 */
  name: string;
  father: ParentInfo;
  mother: ParentInfo;
}

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
  photoSize: ImageSize | null;
  mapUrl: string | null;
  mapSize: ImageSize | null;
  qrUrl: string | null;
  qrSize: ImageSize | null;
  accountText: string | null;
  /** 뒷면 혼주 블록용. 이름이 하나도 없으면 블록 자체가 생략된다. */
  groom: FamilyInfo;
  bride: FamilyInfo;
  deceasedStyle: DeceasedStyle;
  names: string;
  /** 앞면 하단 자막 문구. 비우면 자막 바 없이 빈 슬롯으로 남는다. */
  title: string;
  date: string;
  venue: string;
  greeting: string;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function makeText(
  id: string,
  label: string,
  text: string,
  box: Pick<Box, 'x' | 'y' | 'width'>,
  fontSize: number,
  zIndex: number,
  extra?: Partial<TextField>,
): TextField {
  return {
    id,
    label,
    x: box.x,
    y: box.y,
    width: box.width,
    text,
    fontSize,
    fontFamily: FONT,
    fill: INITIAL_TEMPLATE.textColorDefault,
    align: 'center',
    zIndex,
    ...extra,
  };
}

/** Aspect-preserving fit inside a max box (falls back to a portrait-ish ratio when the natural size is unknown). */
function fitImage(natural: ImageSize | null, maxWidth: number, maxHeight: number): ImageSize {
  const aspect =
    natural && natural.width > 0 && natural.height > 0 ? natural.width / natural.height : DEFAULT_PHOTO_ASPECT;
  let height = maxHeight;
  let width = height * aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }
  return { width, height };
}

/** Centers an image inside an arbitrary box, at ~92% of the box so it never touches the neighbouring band. */
function makeImageIconInBox(uid: string, src: string, natural: ImageSize | null, box: Box, zIndex: number): PlacedIcon {
  const { width, height } = fitImage(natural, box.width * 0.92, box.height * 0.92);
  return {
    uid,
    iconId: uid, // synthetic non-library id, same convention as 'customer-photo'/'uploaded-photo'
    src,
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
    rotation: 0,
    zIndex,
  };
}

function markedName(parent: ParentInfo, style: DeceasedStyle): string {
  const name = parent.name.trim();
  if (!name) return '';
  return parent.deceased ? `${DECEASED_MARKS[style]} ${name}` : name;
}

/** '송건철, 유지선의 아들' — 한 분만 입력해도 그 분만 들어간다. */
function parentsLine(family: FamilyInfo, childWord: string, style: DeceasedStyle): string {
  const names = [markedName(family.father, style), markedName(family.mother, style)].filter(Boolean);
  if (names.length === 0) return '';
  return `${names.join(', ')}의 ${childWord}`;
}

function hasFamilyInfo(opts: LayoutOptions): boolean {
  return [opts.groom, opts.bride].some(
    (f) => f.name.trim() || f.father.name.trim() || f.mother.name.trim(),
  );
}

/**
 * 레퍼런스 뒷면의 혼주 블록: 좌측은 신랑측, 우측은 신부측.
 * 값이 비어도 슬롯은 남겨서 고객이 편집기에서 직접 채울 수 있게 한다.
 */
function makeFamilyBlock(
  opts: LayoutOptions,
  leftX: number,
  rightX: number,
  colWidth: number,
  parentsY: number,
  parentsSize: number,
  nameY: number,
  nameSize: number,
  startZ: number,
): TextField[] {
  const tracking = Math.round(nameSize * 0.18);
  const sides = [
    { key: 'groom', family: opts.groom, x: leftX, childWord: '아들', parentsLabel: '신랑측 혼주', nameLabel: '신랑 이름' },
    { key: 'bride', family: opts.bride, x: rightX, childWord: '딸', parentsLabel: '신부측 혼주', nameLabel: '신부 이름' },
  ] as const;
  let z = startZ;
  return sides.flatMap((side) => [
    makeText(
      `${side.key}-parents`,
      side.parentsLabel,
      parentsLine(side.family, side.childWord, opts.deceasedStyle),
      { x: side.x, y: parentsY, width: colWidth },
      parentsSize,
      z++,
    ),
    makeText(`${side.key}-name`, side.nameLabel, side.family.name, { x: side.x, y: nameY, width: colWidth }, nameSize, z++, {
      letterSpacing: tracking,
    }),
  ]);
}

function makeAccountText(text: string | null, box: Box, zIndex: number): TextField {
  return makeText('account', '계좌정보', text ?? '', { x: box.x, y: box.y + box.height * 0.15, width: box.width }, 16, zIndex);
}

function buildFrontPage(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = FRONT[opts.orientation];
  const fieldWidth = w * 0.82;
  const x = (w - fieldWidth) / 2;

  const texts: TextField[] = [
    makeText('names', '신랑 · 신부', opts.names, { x, y: h * cfg.namesY, width: fieldWidth }, cfg.namesSize, 2),
    // 사진 위에 겹쳐야 하므로 z는 사진보다 확실히 높게
    makeText('title', '제목 (자막)', opts.title, { x, y: h * cfg.titleY, width: fieldWidth }, cfg.titleSize, 20, {
      fill: CAPTION_FILL,
      background: CAPTION_BG,
      backgroundPadding: Math.round(cfg.titleSize * 0.55),
    }),
  ];

  const icons: PlacedIcon[] = [];
  if (opts.photoUrl) {
    const { width, height } = fitImage(opts.photoSize, w * cfg.photoMaxWidth, h * cfg.photoMaxHeight);
    icons.push({
      uid: 'main-photo',
      iconId: 'customer-photo',
      src: opts.photoUrl,
      x: (w - width) / 2,
      y: h - height, // 카드 아래쪽에 맞닿게
      width,
      height,
      rotation: 0,
      zIndex: 0,
    });
  }

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/** 1단(single panel) back side: 인사말 → 계좌/약도/QR 스택 → 날짜·장소. */
function buildSinglePanelBack(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = BACK[opts.orientation];
  const fieldWidth = w * 0.82;
  const x = (w - fieldWidth) / 2;

  const enabled: Array<'account' | 'map' | 'qr'> = [];
  if (opts.hasAccount) enabled.push('account');
  if (opts.hasMap) enabled.push('map');
  if (opts.hasQr) enabled.push('qr');

  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [
    makeText('message', '인사말', opts.greeting || DEFAULT_GREETING, { x, y: h * cfg.greetingY, width: fieldWidth }, cfg.greetingSize, 1),
  ];

  let z = 2;
  const showFamily = hasFamilyInfo(opts);
  if (showFamily) {
    const colWidth = w * 0.39;
    texts.push(
      ...makeFamilyBlock(
        opts,
        w * 0.07,
        w * 0.54,
        colWidth,
        h * cfg.familyParentsY,
        cfg.familyParentsSize,
        h * cfg.familyNameY,
        cfg.familyNameSize,
        z,
      ),
    );
    z += 4;
  }

  const optionsTop = showFamily ? cfg.optionsTopWithFamily : cfg.optionsTop;
  if (enabled.length > 0) {
    const bandHeight = ((cfg.optionsBottom - optionsTop) / enabled.length) * h;
    enabled.forEach((kind, i) => {
      const box: Box = { x, y: h * optionsTop + i * bandHeight, width: fieldWidth, height: bandHeight };
      if (kind === 'account') texts.push(makeAccountText(opts.accountText, box, z++));
      if (kind === 'map') icons.push(makeImageIconInBox('layout-map', opts.mapUrl!, opts.mapSize, box, z++));
      if (kind === 'qr') icons.push(makeImageIconInBox('layout-qr', opts.qrUrl!, opts.qrSize, box, z++));
    });
  }

  const dateY = enabled.length > 0 ? cfg.dateY : BACK_NO_OPTIONS.dateY;
  const venueY = enabled.length > 0 ? cfg.venueY : BACK_NO_OPTIONS.venueY;
  texts.push(makeText('date', '날짜', opts.date, { x, y: h * dateY, width: fieldWidth }, cfg.dateSize, z++));
  texts.push(makeText('venue', '장소', opts.venue, { x, y: h * venueY, width: fieldWidth }, cfg.venueSize, z++));

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/**
 * 2단 접지형(fold) 내지: 좌측은 약도(+계좌/QR), 우측은 인사말과 날짜·장소.
 * 접지 미리보기는 없고 한 장의 캔버스를 좌/우로 나눠 쓴다.
 */
function buildFoldBack(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const colWidth = w * 0.42;
  const leftX = w * 0.04;
  const rightX = w * 0.54;

  const extras: Array<'account' | 'qr'> = [];
  if (opts.hasAccount) extras.push('account');
  if (opts.hasQr) extras.push('qr');

  const mapBottom = extras.length === 0 ? 0.88 : 0.6;
  const icons: PlacedIcon[] = [
    makeImageIconInBox(
      'layout-map',
      opts.mapUrl!,
      opts.mapSize,
      { x: leftX, y: h * 0.1, width: colWidth, height: h * (mapBottom - 0.1) },
      1,
    ),
  ];
  const texts: TextField[] = [
    makeText('message', '인사말', opts.greeting || DEFAULT_GREETING, { x: rightX, y: h * 0.12, width: colWidth }, 16, 2),
    makeText('date', '날짜', opts.date, { x: rightX, y: h * 0.74, width: colWidth }, 17, 3),
    makeText('venue', '장소', opts.venue, { x: rightX, y: h * 0.81, width: colWidth }, 15, 4),
  ];

  let z = 5;
  if (hasFamilyInfo(opts)) {
    // 우측 패널을 다시 반으로 나눠 신랑측/신부측을 나란히 둔다
    const subWidth = colWidth / 2 - w * 0.01;
    texts.push(
      ...makeFamilyBlock(opts, rightX, rightX + colWidth - subWidth, subWidth, h * 0.52, 11, h * 0.575, 17, z),
    );
    z += 4;
  }
  const extrasBandHeight = ((0.9 - mapBottom) / Math.max(extras.length, 1)) * h;
  extras.forEach((kind, i) => {
    const box: Box = { x: leftX, y: h * mapBottom + i * extrasBandHeight, width: colWidth, height: extrasBandHeight };
    if (kind === 'account') texts.push(makeAccountText(opts.accountText, box, z++));
    if (kind === 'qr') icons.push(makeImageIconInBox('layout-qr', opts.qrUrl!, opts.qrSize, box, z++));
  });

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

export function buildInitialPages(rawOpts: LayoutOptions): { front: PageState; back: PageState } {
  // 2단 접지형 always includes 약도 — normalize here even if the caller already did, defense in depth
  const opts: LayoutOptions = { ...rawOpts, hasMap: rawOpts.panelType === 'fold' ? true : rawOpts.hasMap };
  const front = buildFrontPage(opts);
  const back = opts.panelType === 'fold' && opts.mapUrl ? buildFoldBack(opts) : buildSinglePanelBack(opts);
  return { front, back };
}
