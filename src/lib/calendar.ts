/**
 * The 2단 back cover carries a month calendar with the wedding day marked by a heart.
 *
 * It's generated as one SVG image rather than dozens of text elements: 31 draggable numbers
 * would bury the layer list, and the grid only ever changes when the date does. Text inside an
 * SVG image can't reach the page's webfonts, so the numbers use a system stack — the title above
 * the grid is a normal text field and does get the handwriting face.
 */

export interface CalendarImage {
  dataUri: string;
  width: number;
  height: number;
}

const CELL_WIDTH = 44;
const CELL_HEIGHT = 40;
const NUMBER_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Hand-drawn looking heart, drawn around the wedding day. Path is authored on a 24x22 box. */
function heartPath(cx: number, cy: number, scale: number, color: string): string {
  const path =
    'M12 21.5C12 21.5 1.5 14.5 1.5 7.9 1.5 4.6 4.1 2 7.3 2c2 0 3.8 1 4.7 2.6C12.9 3 14.7 2 16.7 2c3.2 0 5.8 2.6 5.8 5.9 0 6.6-10.5 13.6-10.5 13.6Z';
  const tx = cx - 12 * scale;
  const ty = cy - 11.75 * scale;
  return `<path d="${path}" transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * @param year   full year, e.g. 2026
 * @param month  1-12
 * @param day    the day to mark, or null to draw a plain month
 */
export function buildCalendarSvg(
  year: number,
  month: number,
  day: number | null,
  textColor = '#333333',
  heartColor = '#e2402f',
): CalendarImage {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = 일요일
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = Math.ceil((firstWeekday + daysInMonth) / 7);

  const width = CELL_WIDTH * 7;
  const height = CELL_HEIGHT * rows;

  let cells = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const index = firstWeekday + d - 1;
    const col = index % 7;
    const row = Math.floor(index / 7);
    const cx = col * CELL_WIDTH + CELL_WIDTH / 2;
    const cy = row * CELL_HEIGHT + CELL_HEIGHT / 2;
    if (d === day) cells += heartPath(cx, cy, CELL_HEIGHT / 26, heartColor);
    cells +=
      `<text x="${cx}" y="${cy}" font-family="${NUMBER_FONT}" font-size="17" fill="${textColor}" ` +
      `text-anchor="middle" dominant-baseline="central">${d}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${cells}</svg>`;
  return { dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, width, height };
}

/** Accepts the admin form's yyyy-mm-dd; returns null when it isn't a usable date. */
export function parseWeddingDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > new Date(year, month, 0).getDate()) return null;
  return { year, month, day };
}
