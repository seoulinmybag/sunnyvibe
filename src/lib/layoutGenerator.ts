import { ORIENTATIONS, ptToPx } from '../data/orientation.js';
import { TEMPLATES } from '../data/templates.js';
import { buildCalendarSvg, parseWeddingDate } from './calendar.js';
import type { PageState, Pages, PlacedIcon, Side, TextField } from '../types.js';

const TEMPLATE = TEMPLATES[0]; // 화이트
const SPEC = ORIENTATIONS.landscape;
const W = SPEC.displayWidth;
const H = SPEC.displayHeight;

/** 써니바이브 폰트. 굵기별로 패밀리 이름을 나눠 등록해서 (index.css) 캔버스와 SVG가 같게 나온다. */
const F = {
  light: "'Pretendard Light', sans-serif",
  regular: "'Pretendard', sans-serif",
  medium: "'Pretendard Medium', sans-serif",
  semibold: "'Pretendard SemiBold', sans-serif",
  hand: "'UhBee Skyrain', cursive",
  caption: "'KCC Sonkeechung', cursive",
  calendar: "'Yoon ManSeh', cursive",
} as const;

const DEFAULT_GREETING = '저희 두 사람, 사랑으로 하나 되어\n평생을 함께하고자 합니다.';
const ACCOUNT_HEADING = '마음 전하실 곳';
const QR_GUIDE = '모바일 청첩장을 확인해 보세요.\nQR CODE를 카메라 렌즈에 비춰주시면 됩니다.';
const CALENDAR_TITLE = 'MY WEDDING DAY';
const CALENDAR_SUBTITLE = 'weather is';
const CAPTION_BG = '#141414';
const CAPTION_FILL = '#ffffff';
/** 사진 원본 크기를 못 읽었을 때 쓰는 세로형 인물사진 기본 비율(가로/세로). */
const DEFAULT_PHOTO_ASPECT = 0.75;
/** QR은 인쇄 실측 14mm. 스캔 권장 최소치가 15mm 안팎이라 그보다 작아지지 않게 둔다. */
const QR_PRINT_MM = 14;

export const DECEASED_MARKS = { hanja: '故', flower: '✿' } as const;
export type DeceasedStyle = keyof typeof DECEASED_MARKS;

/**
 * 국화꽃은 글자가 아니라 그림이라 혼주 줄 안에 끼워 넣을 수가 없다. 대신 이름 앞에
 * 빈칸 네 개를 두고 그 자리에 아이콘을 얹는다 — 혼주가 두 분 다 고인이면 각자 이름 앞에
 * 하나씩 붙는다. 빈칸 네 개가 이어 나오는 경우는 달리 없으니 자리를 되찾기 쉽다.
 */
const FLOWER_SLOT = '    ';
const FLOWER_ICON_ID = 'system-01';
/**
 * 마크의 지름과 왼쪽 여백 — 글자 크기에 대한 비율. 빈칸 네 개가 1.004em이니 그림을
 * 0.75em으로 두면 이름과의 사이가 0.22em쯤 남아, 예전 `✿ 이름`의 간격과 비슷해진다.
 */
const FLOWER_EM = 0.75;
const FLOWER_INSET_EM = 0.03;

/**
 * Pretendard 글자 한 자의 가로폭(em). 이 폰트는 커닝을 하지 않아서 글자폭을 그냥 더하면
 * 캔버스가 실제로 재는 값과 맞아떨어진다(`故 김영수, 박정희의 아들` = 9.6541em, 실측 동일).
 * 국화꽃을 이름 바로 앞에 놓으려면 주문 생성 시점(Node, 캔버스 없음)에 폭을 알아야 해서 둔다.
 */
const EM = {
  hangul: 0.8643,
  space: 0.2509,
  comma: 0.2577,
  digit: 0.5844,
  lower: 0.4713,
  upper: 0.5942,
  other: 0.5,
} as const;

function charEm(ch: string): number {
  const c = ch.codePointAt(0)!;
  if (ch === ' ') return EM.space;
  if (ch === ',' || ch === '.' || ch === '·') return EM.comma;
  if (c >= 0x30 && c <= 0x39) return EM.digit;
  if (c >= 0x61 && c <= 0x7a) return EM.lower;
  if (c >= 0x41 && c <= 0x5a) return EM.upper;
  // 한글 음절·자모, 한자, 그 밖의 전각은 전부 한 폭
  if (c >= 0x1100 && c <= 0x11ff) return EM.hangul;
  if (c >= 0x3000 && c <= 0x9fff) return EM.hangul;
  if (c >= 0xac00 && c <= 0xd7a3) return EM.hangul;
  if (c >= 0xf900 && c <= 0xfaff) return EM.hangul;
  return EM.other;
}

function textEm(s: string): number {
  let sum = 0;
  for (const ch of s) sum += charEm(ch);
  return sum;
}

export interface ParentInfo {
  name: string;
  deceased: boolean;
}

export interface FamilyInfo {
  name: string;
  /** 앞면 이름 아래 들어가는 생년월일. */
  birth: string;
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
  /** 약도는 1단에서만 고를 수 있다. */
  hasMap: boolean;
  hasQr: boolean;
  /** 1단에서 달력을 넣을지. 2단 외지 뒷면은 언제나 달력이다. */
  hasCalendar: boolean;
  photoUrl: string | null;
  photoSize: ImageSize | null;
  mapUrl: string | null;
  mapSize: ImageSize | null;
  qrUrl: string | null;
  qrSize: ImageSize | null;
  accountGroom: string;
  accountBride: string;
  groom: FamilyInfo;
  bride: FamilyInfo;
  deceasedStyle: DeceasedStyle;
  /** 앞면 하단 자막. 비우면 자막 바 없이 빈 슬롯으로 남는다. */
  title: string;
  date: string;
  venue: string;
  greeting: string;
  /** yyyy-mm-dd. 달력을 그리는 데 쓴다. */
  weddingDate: string;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function text(
  id: string,
  label: string,
  value: string,
  centerX: number,
  y: number,
  width: number,
  fontSize: number,
  fontFamily: string,
  zIndex: number,
  extra?: Partial<TextField>,
): TextField {
  return {
    id,
    label,
    x: centerX - width / 2,
    y,
    width,
    text: value,
    fontSize,
    fontFamily,
    fill: TEMPLATE.textColorDefault,
    align: 'center',
    zIndex,
    ...extra,
  };
}

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

function imageInBox(uid: string, src: string, natural: ImageSize | null, box: Box, zIndex: number): PlacedIcon {
  const { width, height } = fitImage(natural, box.width, box.height);
  return {
    uid,
    iconId: uid,
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
  if (!parent.deceased) return name;
  // 국화꽃은 나중에 그림으로 얹는다 — 여기서는 자리만 비워 둔다
  return style === 'flower' ? `${FLOWER_SLOT}${name}` : `${DECEASED_MARKS[style]} ${name}`;
}

/** '송건철, 유지선의 아들' — 한 분만 입력해도 그 분만 들어간다. */
function parentsLine(family: FamilyInfo, childWord: string, style: DeceasedStyle): string {
  const names = [markedName(family.father, style), markedName(family.mother, style)].filter(Boolean);
  return names.length ? `${names.join(', ')}의 ${childWord}` : '';
}

function accountText(body: string): string {
  return body.trim() ? body.trim() : '';
}

/** 우하단 고정 QR + 좌하단 안내문구. 1단은 뒷면, 2단은 외지 뒷면에 붙는다. */
function addQr(opts: LayoutOptions, icons: PlacedIcon[], texts: TextField[], z: number): number {
  if (!opts.hasQr || !opts.qrUrl) return z;
  const size = (QR_PRINT_MM / SPEC.printWidthMm) * W;
  icons.push({
    uid: 'layout-qr',
    iconId: 'layout-qr',
    src: opts.qrUrl,
    x: W - size - W * 0.026,
    y: H - size - H * 0.042,
    width: size,
    height: size,
    rotation: 0,
    zIndex: z++,
  });
  texts.push(
    text('qr-guide', 'QR 안내문구', QR_GUIDE, W * 0.2, H * 0.885, W * 0.3, ptToPx(7), F.semibold, z++, { align: 'left' }),
  );
  return z;
}

/** 좌/우 혼주 + 이름 한 쌍. 2단 내지 아랫단과 1단 기본형이 쓰는 두 칸 배치. */
function familyColumns(
  opts: LayoutOptions,
  parentsY: number,
  parentsSize: number,
  nameY: number,
  nameSize: number,
  z: number,
): TextField[] {
  const columns = [
    { key: 'groom', family: opts.groom, centerX: W * 0.29, word: '아들', labels: ['신랑측 혼주', '신랑 이름'] },
    { key: 'bride', family: opts.bride, centerX: W * 0.71, word: '딸', labels: ['신부측 혼주', '신부 이름'] },
  ] as const;
  return columns.flatMap((col, i) => [
    text(
      `${col.key}-parents`,
      col.labels[0],
      parentsLine(col.family, col.word, opts.deceasedStyle),
      col.centerX,
      parentsY,
      W * 0.36,
      parentsSize,
      F.regular,
      z + i * 2,
    ),
    text(`${col.key}-name`, col.labels[1], col.family.name, col.centerX, nameY, W * 0.3, nameSize, F.semibold, z + i * 2 + 1, {
      letterSpacing: Math.round(nameSize * 0.22),
    }),
  ]);
}

/** 1단 변형에서 쓰는 가로 한 줄짜리 혼주+이름. 왼쪽에 혼주, 오른쪽에 이름이 나란히 선다. */
function familyRows(opts: LayoutOptions, parentsY: number, nameY: number, rowGap: number, z: number): TextField[] {
  const rows = [
    { key: 'groom', family: opts.groom, word: '아들', labels: ['신랑측 혼주', '신랑 이름'] },
    { key: 'bride', family: opts.bride, word: '딸', labels: ['신부측 혼주', '신부 이름'] },
  ] as const;
  return rows.flatMap((row, i) => [
    text(
      `${row.key}-parents`,
      row.labels[0],
      parentsLine(row.family, row.word, opts.deceasedStyle),
      W * 0.165,
      parentsY + i * rowGap,
      W * 0.28,
      ptToPx(10.53),
      F.regular,
      z + i * 2,
    ),
    text(`${row.key}-name`, row.labels[1], row.family.name, W * 0.392, nameY + i * rowGap, W * 0.2, ptToPx(18.45), F.semibold, z + i * 2 + 1, {
      letterSpacing: Math.round(ptToPx(18.45) * 0.22),
    }),
  ]);
}

/** 마음 전하실 곳 — 제목 한 줄과 좌/우 계좌 두 칸. */
function accountBlock(
  opts: LayoutOptions,
  headingCenterX: number,
  headingY: number,
  headingSize: number,
  bodySize: number,
  groomBox: { centerX: number; y: number },
  brideBox: { centerX: number; y: number },
  columnWidth: number,
  z: number,
): TextField[] {
  return [
    text('account-heading', '계좌 제목', ACCOUNT_HEADING, headingCenterX, headingY, W * 0.4, headingSize, F.semibold, z),
    text('account-groom', '신랑측 계좌', accountText(opts.accountGroom), groomBox.centerX, groomBox.y, columnWidth, bodySize, F.medium, z + 1),
    text('account-bride', '신부측 계좌', accountText(opts.accountBride), brideBox.centerX, brideBox.y, columnWidth, bodySize, F.medium, z + 2),
  ];
}

/** MY WEDDING DAY 달력 묶음 — 제목/소제목/해 아이콘/날짜 그리드. */
function calendarBlock(
  opts: LayoutOptions,
  centerX: number,
  titleY: number,
  titleSize: number,
  subtitleY: number,
  subtitleSize: number,
  gridTop: number,
  gridSize: number,
  icons: PlacedIcon[],
  texts: TextField[],
  z: number,
): number {
  texts.push(
    text('calendar-title', '달력 제목', CALENDAR_TITLE, centerX, titleY, W * 0.45, titleSize, F.calendar, z++),
    // 해 아이콘 자리를 비우려고 글자 상자를 왼쪽으로 조금 민다
    text('calendar-subtitle', '달력 소제목', CALENDAR_SUBTITLE, centerX - subtitleSize * 0.9, subtitleY, W * 0.3, subtitleSize, F.calendar, z++),
  );
  const sunSize = subtitleSize * 1.25;
  icons.push({
    uid: 'calendar-weather',
    iconId: 'calendar-weather',
    src: SUN_ICON,
    x: centerX + subtitleSize * 1.6,
    y: subtitleY - sunSize * 0.15,
    width: sunSize,
    height: sunSize,
    rotation: 0,
    zIndex: z++,
  });

  const parsed = parseWeddingDate(opts.weddingDate);
  if (parsed) {
    const grid = buildCalendarSvg(parsed.year, parsed.month, parsed.day, gridSize, TEMPLATE.textColorDefault);
    icons.push({
      uid: 'calendar-grid',
      iconId: 'calendar-grid',
      src: grid.dataUri,
      x: centerX - grid.width / 2,
      y: gridTop,
      width: grid.width,
      height: grid.height,
      rotation: 0,
      zIndex: z++,
    });
  }
  return z;
}

/**
 * 기본으로 얹는 해 아이콘. 아이콘 라이브러리는 브라우저 전용(import.meta.glob)이라 서버에서 초기
 * 시안을 만들 때 참조할 수 없어서 인라인 SVG로 둔다. 날씨 카테고리의 다른 아이콘으로 바꿔 끼울 수 있다.
 */
const SUN_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#f5a623" stroke-width="3" stroke-linecap="round">' +
    '<circle cx="24" cy="24" r="9" fill="#fbd46d" stroke="#f5a623"/>' +
    '<path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>' +
    '</svg>',
)}`;

/** 앞면(1단 커버 / 2단 외지 앞면) — 사진이 아래 맞닿게 크게, 이름은 좌우, 자막은 하단 중앙. */
function buildFront(opts: LayoutOptions): PageState {
  const nameSize = ptToPx(26);
  const birthSize = ptToPx(12);
  const texts: TextField[] = [
    text('groom-front-name', '신랑 이름 (앞면)', opts.groom.name, W * 0.17, H * 0.485, W * 0.28, nameSize, F.hand, 10),
    text('groom-birth', '신랑 생년월일', opts.groom.birth, W * 0.17, H * 0.6, W * 0.24, birthSize, F.hand, 11),
    text('bride-front-name', '신부 이름 (앞면)', opts.bride.name, W * 0.83, H * 0.485, W * 0.28, nameSize, F.hand, 12),
    text('bride-birth', '신부 생년월일', opts.bride.birth, W * 0.83, H * 0.6, W * 0.24, birthSize, F.hand, 13),
    text('title', '제목 (자막)', opts.title, W / 2, H * 0.845, W * 0.9, ptToPx(18.78), F.caption, 20, {
      fill: CAPTION_FILL,
      background: CAPTION_BG,
      backgroundPadding: Math.round(ptToPx(18.78) * 0.35),
    }),
  ];

  const icons: PlacedIcon[] = [];
  if (opts.photoUrl) {
    const { width, height } = fitImage(opts.photoSize, W * 0.5, H * 0.85);
    icons.push({
      uid: 'main-photo',
      iconId: 'customer-photo',
      src: opts.photoUrl,
      x: (W - width) / 2,
      y: H - height, // 카드 아래쪽에 맞닿게
      width,
      height,
      rotation: 0,
      zIndex: 0,
    });
  }
  return { icons, texts, templateId: TEMPLATE.id, customColor: null };
}

/**
 * 1단 후면 기본형 — 오른쪽 칸에 넣을 게 없을 때(계좌·약도·달력 모두 없음). 전부 가운데로 모은다:
 * 인사말, 좌우 혼주·이름, 하단 날짜·장소. QR만 켠 경우도 여기에 해당하고 QR은 우하단에 얹는다.
 */
function buildPlainBack(opts: LayoutOptions): PageState {
  // QR을 얹으면 아래가 좁아져서 날짜·장소를 조금 올리고 폭도 줄여 QR·안내문구와 겹치지 않게 한다
  const dateY = opts.hasQr ? H * 0.79 : H * 0.83;
  const venueY = opts.hasQr ? H * 0.845 : H * 0.885;
  const bottomWidth = opts.hasQr ? W * 0.55 : W * 0.8;
  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [
    text('message', '인사말', opts.greeting || DEFAULT_GREETING, W / 2, H * 0.1, W * 0.82, ptToPx(11.63), F.light, 1),
    ...familyColumns(opts, H * 0.595, ptToPx(10.69), H * 0.65, ptToPx(14.95), 2),
    text('date', '날짜', opts.date, W / 2, dateY, bottomWidth, ptToPx(9.88), F.regular, 8),
    text('venue', '장소', opts.venue, W / 2, venueY, bottomWidth, ptToPx(9.88), F.regular, 9),
  ];
  addQr(opts, icons, texts, 10);
  return { icons, texts, templateId: TEMPLATE.id, customColor: null };
}

/**
 * 1단 후면 변형 — 좌우 두 칸. 왼쪽은 인사말과 혼주·이름, 오른쪽은 고른 옵션(계좌 / 약도 / 달력)과
 * 날짜·장소. 셋 다 켜면 계좌가 왼쪽 아래로 내려가고 오른쪽은 약도가 쓴다.
 */
function buildOptionBack(opts: LayoutOptions): PageState {
  const rightCenter = W * 0.745;
  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [];
  let z = 1;

  const rightSlot = opts.hasMap ? 'map' : opts.hasCalendar ? 'calendar' : opts.hasAccount ? 'account' : 'none';
  // 오른쪽을 약도/달력이 쓰면 계좌는 왼쪽 아래로 내려간다
  const accountOnLeft = opts.hasAccount && rightSlot !== 'account';

  const greetingY = accountOnLeft ? H * 0.09 : H * 0.17;
  texts.push(
    text('message', '인사말', opts.greeting || DEFAULT_GREETING, W * 0.26, greetingY, W * 0.4, ptToPx(11), F.light, z++),
  );

  const rowsParentsY = accountOnLeft ? H * 0.545 : H * 0.715;
  const rowsNameY = accountOnLeft ? H * 0.525 : H * 0.695;
  texts.push(...familyRows(opts, rowsParentsY, rowsNameY, H * 0.105, z));
  z += 4;

  if (accountOnLeft) {
    texts.push(
      ...accountBlock(
        opts,
        W * 0.26,
        H * 0.8,
        ptToPx(9),
        ptToPx(6),
        { centerX: W * 0.14, y: H * 0.865 },
        { centerX: W * 0.38, y: H * 0.865 },
        W * 0.24,
        z,
      ),
    );
    z += 3;
  }

  let dateY = H * 0.7;
  let venueY = H * 0.75;

  if (rightSlot === 'account') {
    texts.push(
      ...accountBlock(
        opts,
        rightCenter,
        H * 0.14,
        ptToPx(11),
        ptToPx(8),
        { centerX: rightCenter, y: H * 0.24 },
        { centerX: rightCenter, y: H * 0.41 },
        W * 0.42,
        z,
      ),
    );
    z += 3;
  } else if (rightSlot === 'map' && opts.mapUrl) {
    icons.push(imageInBox('layout-map', opts.mapUrl, opts.mapSize, { x: W * 0.55, y: H * 0.15, width: W * 0.41, height: H * 0.51 }, z++));
    dateY = opts.hasQr ? H * 0.73 : H * 0.79;
    venueY = opts.hasQr ? H * 0.785 : H * 0.845;
  } else if (rightSlot === 'calendar') {
    z = calendarBlock(opts, rightCenter, H * 0.19, ptToPx(17.05), H * 0.28, ptToPx(10.22), H * 0.37, ptToPx(12.51), icons, texts, z);
    dateY = opts.hasQr ? H * 0.73 : H * 0.79;
    venueY = opts.hasQr ? H * 0.785 : H * 0.845;
  }

  texts.push(
    text('date', '날짜', opts.date, rightCenter, dateY, W * 0.42, ptToPx(9.88), F.regular, z++),
    text('venue', '장소', opts.venue, rightCenter, venueY, W * 0.42, ptToPx(9.88), F.regular, z++),
  );

  addQr(opts, icons, texts, z);
  return { icons, texts, templateId: TEMPLATE.id, customColor: null };
}

function buildSingleBack(opts: LayoutOptions): PageState {
  // QR은 우하단에 얹히기만 할 뿐 오른쪽 칸을 채우지 않는다
  const usesRightColumn = opts.hasAccount || opts.hasMap || opts.hasCalendar;
  return usesRightColumn ? buildOptionBack(opts) : buildPlainBack(opts);
}

/** 2단 내지 상단 — 인사말만 크게. */
function buildInnerTop(opts: LayoutOptions): PageState {
  return {
    icons: [],
    texts: [text('message', '인사말', opts.greeting || DEFAULT_GREETING, W / 2, H * 0.25, W * 0.82, ptToPx(15.19), F.light, 1)],
    templateId: TEMPLATE.id,
    customColor: null,
  };
}

/** 2단 내지 아랫단 — 좌우 혼주·이름, (계좌), 하단 날짜·장소. */
function buildInnerBottom(opts: LayoutOptions): PageState {
  const texts: TextField[] = [...familyColumns(opts, H * 0.33, ptToPx(15.02), H * 0.42, ptToPx(21), 1)];
  let z = 5;
  if (opts.hasAccount) {
    texts.push(
      ...accountBlock(
        opts,
        W / 2,
        H * 0.5,
        ptToPx(11.2),
        ptToPx(9.8),
        { centerX: W * 0.29, y: H * 0.56 },
        { centerX: W * 0.71, y: H * 0.56 },
        W * 0.42,
        z,
      ),
    );
    z += 3;
  }
  texts.push(
    text('date', '날짜', opts.date, W / 2, H * 0.8, W * 0.8, ptToPx(9.88), F.regular, z++),
    text('venue', '장소', opts.venue, W / 2, H * 0.86, W * 0.8, ptToPx(9.88), F.regular, z++),
  );
  return { icons: [], texts, templateId: TEMPLATE.id, customColor: null };
}

/** 2단 외지 뒷면 — 달력. QR을 고른 2단은 이 면 우하단에 QR이 붙는다. */
function buildOuterBack(opts: LayoutOptions): PageState {
  const icons: PlacedIcon[] = [];
  const texts: TextField[] = [];
  let z = calendarBlock(opts, W * 0.49, H * 0.28, ptToPx(20.54), H * 0.38, ptToPx(12.31), H * 0.5, ptToPx(15.07), icons, texts, 1);
  addQr(opts, icons, texts, z);
  return { icons, texts, templateId: TEMPLATE.id, customColor: null };
}

/**
 * 혼주 줄에 비워 둔 자리마다 국화꽃을 하나씩 얹는다. 폭을 글자표로 재서 이름 바로 앞에
 * 놓으므로, 한 줄에 고인이 두 분이면 두 개가 각자 이름 앞에 붙는다.
 *
 * 한 줄로 떨어지는 문구를 전제한다 — 혼주 줄은 칸보다 한참 짧아서 접히지 않는다.
 */
function placeFlowerMarks(page: PageState, zFrom: number): PageState {
  const marks: PlacedIcon[] = [];
  const texts = page.texts.map((field) => {
    if (!field.text.includes(FLOWER_SLOT)) return field;
    const size = field.fontSize * FLOWER_EM;
    const lineEm = textEm(field.text);
    // 칸 안에서 글자가 실제로 시작하는 자리
    const startX =
      field.align === 'center'
        ? field.x + (field.width - lineEm * field.fontSize) / 2
        : field.align === 'right'
          ? field.x + field.width - lineEm * field.fontSize
          : field.x;
    let from = 0;
    for (;;) {
      const at = field.text.indexOf(FLOWER_SLOT, from);
      if (at === -1) break;
      marks.push({
        uid: `deceased-${field.id}-${marks.length}`,
        iconId: FLOWER_ICON_ID,
        src: '', // 카탈로그에 있는 아이콘이라 브라우저가 id만 보고 그림을 찾아온다
        x: startX + (textEm(field.text.slice(0, at)) + FLOWER_INSET_EM) * field.fontSize,
        y: field.y + (field.fontSize - size) / 2,
        width: size,
        height: size,
        rotation: 0,
        color: field.fill,
        zIndex: zFrom + marks.length,
      });
      from = at + FLOWER_SLOT.length;
    }
    return field;
  });
  return marks.length ? { ...page, icons: [...page.icons, ...marks], texts } : page;
}

export function buildInitialPages(rawOpts: LayoutOptions): Pages {
  // 약도는 1단 전용, 2단 외지 뒷면은 언제나 달력이다
  const opts: LayoutOptions = {
    ...rawOpts,
    hasMap: rawOpts.panelType === 'fold' ? false : rawOpts.hasMap,
    hasCalendar: rawOpts.panelType === 'fold' ? true : rawOpts.hasCalendar,
  };
  const front = buildFront(opts);
  const pages: Pages =
    opts.panelType !== 'fold'
      ? { front, back: buildSingleBack(opts) }
      : {
          front,
          'inner-top': buildInnerTop(opts),
          'inner-bottom': buildInnerBottom(opts),
          back: buildOuterBack(opts),
        };
  if (opts.deceasedStyle !== 'flower') return pages;
  // 국화꽃은 자막(z 20)보다 위, 고객이 나중에 얹는 것들보다는 아래에 둔다
  const withMarks: Pages = {};
  for (const [side, page] of Object.entries(pages)) {
    withMarks[side as Side] = page ? placeFlowerMarks(page, 30) : page;
  }
  return withMarks;
}
