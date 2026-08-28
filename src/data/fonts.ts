export interface FontOption {
  /** The CSS stack stored on the text field — keep these strings stable, saved orders reference them. */
  value: string;
  label: string;
}

export interface FontGroup {
  label: string;
  options: FontOption[];
}

function korean(family: string, label: string): FontOption {
  return { value: `'${family}', serif`, label };
}

function latin(family: string, label: string, fallback: string): FontOption {
  return { value: `'${family}', ${fallback}`, label };
}

/**
 * Every family here is served by Google Fonts under the SIL Open Font License, which allows
 * commercial use and embedding in print work — see the <link> in index.html, which must list
 * exactly these families. Latin faces have no Hangul glyphs, so Korean typed in one of them
 * falls back to the system font; that's why they're grouped separately in the picker.
 */
export const FONT_GROUPS: FontGroup[] = [
  {
    label: '한글 · 명조',
    options: [
      korean('Noto Serif KR', '본명조'),
      korean('Nanum Myeongjo', '나눔명조'),
      korean('Song Myung', '송명'),
      korean('Gowun Batang', '고운바탕'),
      korean('Hahmlet', '함렛'),
      korean('Diphylleia', '디필레이아'),
    ],
  },
  {
    label: '한글 · 고딕',
    options: [
      { value: "'Noto Sans KR', sans-serif", label: '본고딕' },
      { value: "'Gowun Dodum', sans-serif", label: '고운돋움' },
      { value: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
      { value: "'IBM Plex Sans KR', sans-serif", label: 'IBM 플렉스' },
    ],
  },
  {
    label: '한글 · 손글씨',
    options: [
      { value: "'Nanum Pen Script', cursive", label: '나눔손글씨 펜' },
      { value: "'Nanum Brush Script', cursive", label: '나눔손글씨 붓' },
      { value: "'Gaegu', cursive", label: '개구' },
      { value: "'Dongle', cursive", label: '동글' },
      { value: "'Hi Melody', cursive", label: '하이멜로디' },
      { value: "'Gamja Flower', cursive", label: '감자꽃' },
    ],
  },
  {
    label: '영문 · 세리프',
    options: [
      latin('Playfair Display', 'Playfair Display', 'serif'),
      latin('Cormorant Garamond', 'Cormorant Garamond', 'serif'),
      latin('EB Garamond', 'EB Garamond', 'serif'),
      latin('Libre Baskerville', 'Libre Baskerville', 'serif'),
    ],
  },
  {
    label: '영문 · 고딕',
    options: [
      latin('Montserrat', 'Montserrat', 'sans-serif'),
      latin('Josefin Sans', 'Josefin Sans', 'sans-serif'),
      latin('Lato', 'Lato', 'sans-serif'),
    ],
  },
  {
    label: '영문 · 필기체',
    options: [
      latin('Great Vibes', 'Great Vibes', 'cursive'),
      latin('Parisienne', 'Parisienne', 'cursive'),
      latin('Dancing Script', 'Dancing Script', 'cursive'),
      latin('Sacramento', 'Sacramento', 'cursive'),
      latin('Caveat', 'Caveat (손글씨)', 'cursive'),
    ],
  },
];

export const ALL_FONTS: FontOption[] = FONT_GROUPS.flatMap((g) => g.options);

/**
 * Canvas text doesn't pull a webfont the way DOM text does, so anything drawn on the stage has
 * to be loaded explicitly or Konva measures and paints a fallback face instead.
 */
export async function loadFonts(families: string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    families.map((family) =>
      // sample text covers both scripts so subsetted Korean faces fetch the right ranges
      document.fonts.load(`24px ${family}`, '가나다 ABC').catch(() => undefined),
    ),
  );
}
