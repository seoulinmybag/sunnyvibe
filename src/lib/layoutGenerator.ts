import { ORIENTATIONS } from '../data/orientation.js';
import { TEMPLATES } from '../data/templates.js';
import { buildCalendarSvg, parseWeddingDate } from './calendar.js';
import type { Orientation, PageState, PlacedIcon, Side, TextField } from '../types.js';

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
 * 뒷면 세로 배치는 레퍼런스 네 가지를 그대로 따른다. 공통 순서는
 * 인사말 → 좌·우 혼주+이름 → (계좌) → 날짜·장소이고, 날짜·장소는 원래 맨 아래에 온다.
 * 다만 QR과 계좌가 함께 붙어 아래가 꽉 차면 날짜·장소가 인사말 바로 밑으로 올라간다.
 */
interface BackAnchors {
  greetingY: number;
  greetingSize: number;
  familyParentsY: number;
  familyNameY: number;
  familyNameSize: number;
  accountY: number;
  dateY: number;
  venueY: number;
  mapTop: number;
  mapBottom: number;
}

/**
 * 뒷면은 옵션 조합마다 자리가 달라서 8가지를 따로 잡는다 (계좌 × 약도 × QR).
 * 약도가 없으면 날짜·장소는 맨 아래에 두되, 계좌와 QR이 함께 아래를 채우면 인사말 밑으로 올린다.
 * 약도가 있으면 인사말 → 혼주 → 계좌 → 약도 → 날짜·장소 → QR 순서로 흐른다.
 */
const BACK: Record<Orientation, {
  dateSize: number;
  venueSize: number;
  familyParentsSize: number;
  accountSize: number;
  /** QR은 밴드에 끼우지 않고 우하단에 고정한다. 크기는 QR_PRINT_MM. */
  qrMarginX: number;
  qrMarginY: number;
  qrGuideY: number;
  qrGuideSize: number;
  modes: Record<
    'plain' | 'accountOnly' | 'qrOnly' | 'accountQr' | 'map' | 'mapAccount' | 'mapQr' | 'mapAccountQr',
    BackAnchors
  >;
}> = {
  landscape: {
    dateSize: 17, venueSize: 15, familyParentsSize: 12, accountSize: 11,
    qrMarginX: 0.038, qrMarginY: 0.036, qrGuideY: 0.885, qrGuideSize: 9,
    modes: {
      plain: { greetingY: 0.07, greetingSize: 15, familyParentsY: 0.48, familyNameY: 0.535, familyNameSize: 19, accountY: 0.65, dateY: 0.8, venueY: 0.875, mapTop: 0, mapBottom: 0 },
      accountOnly: { greetingY: 0.07, greetingSize: 15, familyParentsY: 0.44, familyNameY: 0.495, familyNameSize: 19, accountY: 0.65, dateY: 0.82, venueY: 0.89, mapTop: 0, mapBottom: 0 },
      qrOnly: { greetingY: 0.07, greetingSize: 15, familyParentsY: 0.46, familyNameY: 0.515, familyNameSize: 19, accountY: 0.65, dateY: 0.72, venueY: 0.785, mapTop: 0, mapBottom: 0 },
      accountQr: { greetingY: 0.07, greetingSize: 15, familyParentsY: 0.5, familyNameY: 0.55, familyNameSize: 19, accountY: 0.66, dateY: 0.4, venueY: 0.455, mapTop: 0, mapBottom: 0 },
      map: { greetingY: 0.06, greetingSize: 14, familyParentsY: 0.28, familyNameY: 0.335, familyNameSize: 18, accountY: 0.42, dateY: 0.82, venueY: 0.89, mapTop: 0.4, mapBottom: 0.76 },
      mapAccount: { greetingY: 0.05, greetingSize: 12, familyParentsY: 0.29, familyNameY: 0.335, familyNameSize: 17, accountY: 0.4, dateY: 0.83, venueY: 0.885, mapTop: 0.56, mapBottom: 0.79 },
      mapQr: { greetingY: 0.05, greetingSize: 13, familyParentsY: 0.31, familyNameY: 0.355, familyNameSize: 17, accountY: 0.42, dateY: 0.73, venueY: 0.78, mapTop: 0.42, mapBottom: 0.7 },
      mapAccountQr: { greetingY: 0.045, greetingSize: 11, familyParentsY: 0.25, familyNameY: 0.29, familyNameSize: 16, accountY: 0.35, dateY: 0.735, venueY: 0.785, mapTop: 0.54, mapBottom: 0.7 },
    },
  },
  portrait: {
    dateSize: 17, venueSize: 16, familyParentsSize: 13, accountSize: 12,
    qrMarginX: 0.045, qrMarginY: 0.032, qrGuideY: 0.918, qrGuideSize: 10,
    modes: {
      plain: { greetingY: 0.1, greetingSize: 16, familyParentsY: 0.6, familyNameY: 0.65, familyNameSize: 21, accountY: 0.73, dateY: 0.87, venueY: 0.92, mapTop: 0, mapBottom: 0 },
      accountOnly: { greetingY: 0.1, greetingSize: 16, familyParentsY: 0.605, familyNameY: 0.655, familyNameSize: 21, accountY: 0.73, dateY: 0.88, venueY: 0.915, mapTop: 0, mapBottom: 0 },
      qrOnly: { greetingY: 0.1, greetingSize: 16, familyParentsY: 0.605, familyNameY: 0.655, familyNameSize: 21, accountY: 0.73, dateY: 0.8, venueY: 0.835, mapTop: 0, mapBottom: 0 },
      accountQr: { greetingY: 0.1, greetingSize: 16, familyParentsY: 0.63, familyNameY: 0.675, familyNameSize: 21, accountY: 0.74, dateY: 0.5, venueY: 0.545, mapTop: 0, mapBottom: 0 },
      map: { greetingY: 0.085, greetingSize: 15, familyParentsY: 0.33, familyNameY: 0.375, familyNameSize: 20, accountY: 0.45, dateY: 0.87, venueY: 0.915, mapTop: 0.43, mapBottom: 0.82 },
      mapAccount: { greetingY: 0.06, greetingSize: 14, familyParentsY: 0.27, familyNameY: 0.315, familyNameSize: 19, accountY: 0.39, dateY: 0.845, venueY: 0.885, mapTop: 0.52, mapBottom: 0.79 },
      mapQr: { greetingY: 0.07, greetingSize: 14, familyParentsY: 0.28, familyNameY: 0.325, familyNameSize: 19, accountY: 0.4, dateY: 0.765, venueY: 0.8, mapTop: 0.4, mapBottom: 0.72 },
      mapAccountQr: { greetingY: 0.055, greetingSize: 13, familyParentsY: 0.24, familyNameY: 0.285, familyNameSize: 18, accountY: 0.35, dateY: 0.775, venueY: 0.812, mapTop: 0.46, mapBottom: 0.735 },
    },
  },
};

function backAnchors(orientation: Orientation, opts: LayoutOptions): BackAnchors {
  const { modes } = BACK[orientation];
  if (opts.hasMap) {
    if (opts.hasAccount && opts.hasQr) return modes.mapAccountQr;
    if (opts.hasAccount) return modes.mapAccount;
    if (opts.hasQr) return modes.mapQr;
    return modes.map;
  }
  if (opts.hasAccount && opts.hasQr) return modes.accountQr;
  if (opts.hasQr) return modes.qrOnly;
  if (opts.hasAccount) return modes.accountOnly;
  return modes.plain;
}

/** 계좌 칸 머리말과 QR 안내문구 — 레퍼런스 문구 그대로. */
const ACCOUNT_HEADING = '마음 전하실 곳';
const QR_GUIDE = '모바일 청첩장을 확인해 보세요.\nQR CODE를 카메라 렌즈에 비춰주시면 됩니다.';
/** 인쇄 시 실제 변 길이(mm). QR 스캔 권장 최소치가 15mm 안팎이라 그보다 작아지지 않게 둔다. */
const QR_PRINT_MM = 14;

const CALENDAR_TITLE = 'MY WEDDING DAY';
const CALENDAR_SUBTITLE = 'weather is';
/** 손글씨 느낌이 나야 레퍼런스와 맞아서 기본 글꼴만 다르게 준다. */
const CALENDAR_FONT = "'Caveat', cursive";

/**
 * 기본으로 얹는 해 아이콘. 아이콘 라이브러리는 브라우저 전용(import.meta.glob)이라 서버에서
 * 초기 시안을 만들 때 참조할 수 없어서, 여기에 인라인 SVG로 둔다. 고객이 지우고 날씨 카테고리의
 * 다른 아이콘으로 바꿔 끼울 수 있다.
 */
const SUN_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#f5a623" stroke-width="3" stroke-linecap="round">' +
    '<circle cx="24" cy="24" r="9" fill="#fbd46d" stroke="#f5a623"/>' +
    '<path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>' +
    '</svg>',
)}`;

/** 2단 외지 뒷면(달력)과 내지 좌측(약도·교통) 배치. */
const FOLD_PAGES: Record<Orientation, {
  calendar: { titleY: number; titleSize: number; subtitleY: number; subtitleSize: number; gridTop: number; gridHeight: number; gridWidth: number };
  transport: { mapTop: number; mapBottom: number; rows: number[]; labelSize: number; valueSize: number };
}> = {
  landscape: {
    calendar: { titleY: 0.16, titleSize: 34, subtitleY: 0.3, subtitleSize: 17, gridTop: 0.42, gridHeight: 0.4, gridWidth: 0.5 },
    transport: { mapTop: 0.05, mapBottom: 0.5, rows: [0.58, 0.65, 0.73, 0.83, 0.92], labelSize: 10, valueSize: 9 },
  },
  portrait: {
    calendar: { titleY: 0.28, titleSize: 30, subtitleY: 0.355, subtitleSize: 16, gridTop: 0.43, gridHeight: 0.24, gridWidth: 0.56 },
    transport: { mapTop: 0.06, mapBottom: 0.56, rows: [0.63, 0.685, 0.755, 0.85, 0.93], labelSize: 11, valueSize: 10 },
  },
};

const TRANSPORT_ROWS = [
  { key: 'address', label: '주소' },
  { key: 'phone', label: '전화' },
  { key: 'subway', label: '지하철' },
  { key: 'bus', label: '버스' },
  { key: 'parking', label: '주차' },
] as const;

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
  /** 레퍼런스처럼 좌/우 두 칸으로 나뉜다. 빈 쪽은 그대로 빈 슬롯으로 남는다. */
  accountGroom: string;
  accountBride: string;
  /** 뒷면 혼주 블록용. 이름이 하나도 없으면 블록 자체가 생략된다. */
  groom: FamilyInfo;
  bride: FamilyInfo;
  deceasedStyle: DeceasedStyle;
  names: string;
  /** 앞면 하단 자막 문구. 비우면 자막 바 없이 빈 슬롯으로 남는다. */
  title: string;
  /** yyyy-mm-dd. 2단 외지 뒷면의 달력을 그리는 데만 쓴다. */
  weddingDate: string;
  /** 2단 내지 좌측의 교통 안내. 비면 빈 슬롯으로 남는다. */
  transport: {
    address: string;
    phone: string;
    subway: string;
    bus: string;
    parking: string;
  };
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

/** '마음 전하실 곳' 머리말을 붙인 계좌 칸. 고객이 지우거나 고칠 수 있게 본문의 첫 줄로 넣는다. */
function makeAccountText(
  id: 'account-groom' | 'account-bride',
  label: string,
  body: string,
  box: Pick<Box, 'x' | 'y' | 'width'>,
  fontSize: number,
  zIndex: number,
): TextField {
  const text = body.trim() ? `${ACCOUNT_HEADING}\n${body.trim()}` : '';
  return makeText(id, label, text, box, fontSize, zIndex);
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

/** 우하단 고정 QR + 좌하단 안내문구. 1단은 뒷면, 2단은 외지 뒷면(달력)에 붙는다. */
function addQrBlock(opts: LayoutOptions, icons: PlacedIcon[], texts: TextField[], startZ: number): number {
  if (!opts.hasQr || !opts.qrUrl) return startZ;
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = BACK[opts.orientation];
  let z = startZ;
  // 화면 좌표가 아니라 인쇄 mm 기준으로 잡아야 실제 출력에서 스캔되는 크기가 나온다
  const size = (QR_PRINT_MM / spec.printWidthMm) * w;
  icons.push({
    uid: 'layout-qr',
    iconId: 'layout-qr',
    src: opts.qrUrl,
    x: w - size - w * cfg.qrMarginX,
    y: h - size - h * cfg.qrMarginY,
    width: size,
    height: size,
    rotation: 0,
    zIndex: z++,
  });
  texts.push(
    makeText('qr-guide', 'QR 안내문구', QR_GUIDE, { x: w * 0.05, y: h * cfg.qrGuideY, width: w * 0.55 }, cfg.qrGuideSize, z++, {
      align: 'left',
    }),
  );
  return z;
}

/** 2단 외지 뒷면 — MY WEDDING DAY 달력. QR을 쓰는 2단이면 QR도 이 면 우하단에 붙는다. */
function buildCalendarPage(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = FOLD_PAGES[opts.orientation].calendar;
  const fieldWidth = w * 0.82;
  const x = (w - fieldWidth) / 2;

  const texts: TextField[] = [
    makeText('calendar-title', '달력 제목', CALENDAR_TITLE, { x, y: h * cfg.titleY, width: fieldWidth }, cfg.titleSize, 1, {
      fontFamily: CALENDAR_FONT,
    }),
    // 해 아이콘 자리를 비워두려고 글자 상자를 살짝 왼쪽으로 민다
    makeText('calendar-subtitle', '달력 소제목', CALENDAR_SUBTITLE, { x: x - w * 0.03, y: h * cfg.subtitleY, width: fieldWidth }, cfg.subtitleSize, 2, {
      fontFamily: CALENDAR_FONT,
    }),
  ];

  const iconSize = w * 0.05;
  const icons: PlacedIcon[] = [
    {
      uid: 'calendar-weather',
      iconId: 'calendar-weather',
      src: SUN_ICON,
      x: w / 2 + w * 0.05,
      y: h * cfg.subtitleY - iconSize * 0.15,
      width: iconSize,
      height: iconSize,
      rotation: 0,
      zIndex: 3,
    },
  ];

  const parsed = parseWeddingDate(opts.weddingDate);
  if (parsed) {
    const grid = buildCalendarSvg(parsed.year, parsed.month, parsed.day, INITIAL_TEMPLATE.textColorDefault);
    const width = w * cfg.gridWidth;
    const height = (width / grid.width) * grid.height;
    icons.push({
      uid: 'calendar-grid',
      iconId: 'calendar-grid',
      src: grid.dataUri,
      x: (w - width) / 2,
      y: h * cfg.gridTop,
      width,
      height,
      rotation: 0,
      zIndex: 4,
    });
  }

  addQrBlock(opts, icons, texts, 5);
  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/** 2단 내지 좌측 — 약도와 그 아래 주소·전화·지하철·버스·주차 안내. */
function buildTransportPage(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = FOLD_PAGES[opts.orientation].transport;

  const icons: PlacedIcon[] = [];
  if (opts.mapUrl) {
    icons.push(
      makeImageIconInBox(
        'layout-map',
        opts.mapUrl,
        opts.mapSize,
        { x: w * 0.06, y: h * cfg.mapTop, width: w * 0.88, height: h * (cfg.mapBottom - cfg.mapTop) },
        1,
      ),
    );
  }

  // 라벨과 값을 따로 두어야 레퍼런스처럼 왼쪽 라벨 열이 세로로 맞는다
  let z = 2;
  const texts: TextField[] = [];
  TRANSPORT_ROWS.forEach((row, i) => {
    const y = h * cfg.rows[i];
    texts.push(
      makeText(`transport-${row.key}-label`, `${row.label} (제목)`, row.label, { x: w * 0.06, y, width: w * 0.14 }, cfg.labelSize, z++, {
        align: 'left',
      }),
      makeText(`transport-${row.key}`, row.label, opts.transport[row.key], { x: w * 0.21, y, width: w * 0.73 }, cfg.valueSize, z++, {
        align: 'left',
      }),
    );
  });

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

/**
 * 1단 뒷면 — 레퍼런스 배치:
 * 인사말 / 날짜 / 장소 / 좌·우 혼주+이름 / 좌·우 계좌 / 우하단 QR + 좌하단 안내문구.
 * 약도가 있으면 위 블록들이 올라가고 약도가 가운데 밴드를 차지한다.
 */
function buildSinglePanelBack(opts: LayoutOptions): PageState {
  const spec = ORIENTATIONS[opts.orientation];
  const w = spec.displayWidth;
  const h = spec.displayHeight;
  const cfg = BACK[opts.orientation];
  const fieldWidth = w * 0.82;
  const x = (w - fieldWidth) / 2;

  // 좌/우 두 칸은 혼주·이름·계좌가 같은 세로선을 공유한다
  const colWidth = w * 0.39;
  const leftX = w * 0.07;
  const rightX = w * 0.54;

  const anchors = backAnchors(opts.orientation, opts);

  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [
    makeText('message', '인사말', opts.greeting || DEFAULT_GREETING, { x, y: h * anchors.greetingY, width: fieldWidth }, anchors.greetingSize, 1),
    makeText('date', '날짜', opts.date, { x, y: h * anchors.dateY, width: fieldWidth }, cfg.dateSize, 2),
    makeText('venue', '장소', opts.venue, { x, y: h * anchors.venueY, width: fieldWidth }, cfg.venueSize, 3),
  ];
  let z = 4;

  if (hasFamilyInfo(opts)) {
    texts.push(
      ...makeFamilyBlock(
        opts,
        leftX,
        rightX,
        colWidth,
        h * anchors.familyParentsY,
        cfg.familyParentsSize,
        h * anchors.familyNameY,
        anchors.familyNameSize,
        z,
      ),
    );
    z += 4;
  }

  if (opts.hasAccount) {
    const y = h * anchors.accountY;
    texts.push(
      makeAccountText('account-groom', '신랑측 계좌', opts.accountGroom, { x: leftX, y, width: colWidth }, cfg.accountSize, z++),
      makeAccountText('account-bride', '신부측 계좌', opts.accountBride, { x: rightX, y, width: colWidth }, cfg.accountSize, z++),
    );
  }

  if (opts.hasMap && opts.mapUrl) {
    icons.push(
      makeImageIconInBox(
        'layout-map',
        opts.mapUrl,
        opts.mapSize,
        { x, y: h * anchors.mapTop, width: fieldWidth, height: h * (anchors.mapBottom - anchors.mapTop) },
        z++,
      ),
    );
  }

  z = addQrBlock(opts, icons, texts, z);

  return { icons, texts, templateId: INITIAL_TEMPLATE.id, customColor: null };
}

export function buildInitialPages(rawOpts: LayoutOptions): Partial<Record<Side, PageState>> {
  // 2단 접지형은 내지 좌측이 약도 면이라 약도가 항상 붙는다
  const opts: LayoutOptions = { ...rawOpts, hasMap: rawOpts.panelType === 'fold' ? true : rawOpts.hasMap };
  const front = buildFrontPage(opts);

  if (opts.panelType !== 'fold') {
    return { front, back: buildSinglePanelBack(opts) };
  }

  return {
    front,
    // 외지 뒷면은 달력이 차지하고, 약도와 QR은 각자 자기 면으로 간다
    back: buildCalendarPage(opts),
    'inner-left': buildTransportPage(opts),
    'inner-right': buildSinglePanelBack({ ...opts, hasMap: false, hasQr: false }),
  };
}
