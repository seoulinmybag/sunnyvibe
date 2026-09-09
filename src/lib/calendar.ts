import { DIGIT_GLYPHS, DIGIT_METRICS } from '../data/calendarDigits.js';

/**
 * 2단 외지 뒷면(과 1단 캘린더 변형)에 들어가는 달력. 예식일에는 하트를 두른다.
 *
 * 숫자 31개를 각각 요소로 두면 레이어 목록이 파묻히고, SVG 이미지 안에서는 웹폰트를 불러올 수
 * 없어서, 초록우산어린이 만세체의 숫자를 외곽선(path)으로 박아 하나의 이미지로 만든다.
 * 그래서 인쇄에서도 폰트 설치 없이 원래 모양 그대로 나온다.
 */

export interface CalendarImage {
  dataUri: string;
  width: number;
  height: number;
}

/** 셀 크기는 글자 크기의 배수로 잡는다 — 레퍼런스의 칸 간격 비율. */
const CELL_WIDTH_EM = 1.72;
const CELL_HEIGHT_EM = 1.62;

function digitsPath(text: string, fontSize: number, centerX: number, baselineY: number, fill: string): string {
  const scale = fontSize / DIGIT_METRICS.unitsPerEm;
  const advance = [...text].reduce((sum, ch) => sum + (DIGIT_GLYPHS[ch]?.adv ?? 0), 0) * scale;
  let x = centerX - advance / 2;
  let out = '';
  for (const ch of text) {
    const glyph = DIGIT_GLYPHS[ch];
    if (!glyph) continue;
    // 폰트 좌표는 y가 위로 자라므로 뒤집는다
    out += `<path d="${glyph.d}" transform="translate(${x.toFixed(2)} ${baselineY.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" fill="${fill}"/>`;
    x += glyph.adv * scale;
  }
  return out;
}

/** 손그림 느낌의 하트 — 레퍼런스처럼 예식일 숫자를 감싼다. 24x22 상자 기준 경로. */
function heartPath(cx: number, cy: number, scale: number, color: string): string {
  const d =
    'M12 21.5C12 21.5 1.5 14.5 1.5 7.9 1.5 4.6 4.1 2 7.3 2c2 0 3.8 1 4.7 2.6C12.9 3 14.7 2 16.7 2c3.2 0 5.8 2.6 5.8 5.9 0 6.6-10.5 13.6-10.5 13.6Z';
  return (
    `<path d="${d}" transform="translate(${(cx - 12 * scale).toFixed(2)} ${(cy - 11.75 * scale).toFixed(2)}) scale(${scale.toFixed(4)})" ` +
    `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

/**
 * @param month 1-12
 * @param day   하트를 두를 날짜. null이면 표시 없이 그 달만 그린다.
 */
export function buildCalendarSvg(
  year: number,
  month: number,
  day: number | null,
  fontSize: number,
  textColor = '#111111',
  heartColor = '#e2402f',
): CalendarImage {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = 일요일
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = Math.ceil((firstWeekday + daysInMonth) / 7);

  const cellWidth = fontSize * CELL_WIDTH_EM;
  const cellHeight = fontSize * CELL_HEIGHT_EM;
  const width = cellWidth * 7;
  const height = cellHeight * rows;

  let body = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const index = firstWeekday + d - 1;
    const cx = (index % 7) * cellWidth + cellWidth / 2;
    const rowTop = Math.floor(index / 7) * cellHeight;
    const baseline = rowTop + cellHeight / 2 + fontSize * 0.36;
    if (d === day) body += heartPath(cx, rowTop + cellHeight / 2, cellHeight / 24, heartColor);
    body += digitsPath(String(d), fontSize, cx, baseline, textColor);
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}" ` +
    `width="${width.toFixed(2)}" height="${height.toFixed(2)}">${body}</svg>`;
  return { dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, width, height };
}

/** 관리자 폼의 yyyy-mm-dd를 받는다. 못 쓰는 값이면 null. */
export function parseWeddingDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > new Date(year, month, 0).getDate()) return null;
  return { year, month, day };
}
