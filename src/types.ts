export interface IconDef {
  id: string;
  label: string;
  category: string;
  /** Only set for recolorable line icons. */
  defaultColor?: string;
  /** false for full-colour artwork, which can't be tinted. */
  recolorable: boolean;
  /** The artwork's own proportions, so placing it doesn't squash it. */
  naturalWidth: number;
  naturalHeight: number;
  /** Image source at the default color — used for the icon library tile. */
  src: string;
  /** Regenerate the icon's image src at an arbitrary color. */
  getSrc: (color: string) => string;
}

export interface PlacedIcon {
  uid: string;
  iconId: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  /** Only meaningful for recolorable library icons (see isLibraryIcon). */
  color?: string;
  /** Visible sub-rectangle of the source image, in the image's natural pixel space. Photos only. */
  crop?: { x: number; y: number; width: number; height: number };
}

export interface TextField {
  id: string;
  label: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  width: number;
  zIndex: number;
  /** Caption bar behind the text (the reference's black 자막 look). Undefined = no bar. */
  background?: string;
  /** Breathing room between the text and the caption bar's edge. Defaults to ~0.55em. */
  backgroundPadding?: number;
  /** Extra tracking between glyphs — the widely-spaced 신랑·신부 이름 look (송 지 원). */
  letterSpacing?: number;
}

export interface Template {
  id: string;
  label: string;
  background: string;
  backgroundGradient?: [string, string];
  textColorDefault: string;
}

export type SelectedElement =
  | { type: 'icon'; uid: string }
  | { type: 'text'; id: string }
  | null;

export type Orientation = 'landscape' | 'portrait';

export interface OrientationSpec {
  id: Orientation;
  label: string;
  ratioLabel: string;
  displayWidth: number;
  displayHeight: number;
  printWidthMm: number;
  printHeightMm: number;
  printWidthPx: number;
  printHeightPx: number;
  downloadWidthPx: number;
  downloadHeightPx: number;
}

/**
 * 1단은 front/back 두 면, 2단 접지는 여기에 내지 두 면이 더 붙는다.
 * front = 외지 앞(표지), back = 외지 뒤(달력), inner-left = 내지 좌(약도·교통), inner-right = 내지 우(인사말).
 */
export type Side = 'front' | 'back' | 'inner-left' | 'inner-right';

export type PanelType = 'single' | 'fold';

/** A design's panels. 1단 has front/back; 2단 adds the two inner panels. */
export type Pages = Partial<Record<Side, PageState>>;

export const SINGLE_SIDES: Side[] = ['front', 'back'];
export const FOLD_SIDES: Side[] = ['front', 'back', 'inner-left', 'inner-right'];

export function sidesFor(panelType: PanelType): Side[] {
  return panelType === 'fold' ? FOLD_SIDES : SINGLE_SIDES;
}

export function sideLabel(side: Side, panelType: PanelType): string {
  if (panelType === 'fold') {
    if (side === 'front') return '외지 앞';
    if (side === 'back') return '외지 뒤';
    return side === 'inner-left' ? '내지 좌' : '내지 우';
  }
  return side === 'front' ? '앞' : '뒤';
}

/** Which panels a saved design actually has, in print order. */
export function panelTypeOf(pages: Partial<Record<Side, unknown>>): PanelType {
  return pages['inner-left'] || pages['inner-right'] ? 'fold' : 'single';
}

export interface PageState {
  icons: PlacedIcon[];
  texts: TextField[];
  templateId: string;
  customColor: string | null;
}
