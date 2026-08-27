export interface IconDef {
  id: string;
  label: string;
  category: string;
  defaultColor: string;
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

export type Side = 'front' | 'back';

export interface PageState {
  icons: PlacedIcon[];
  texts: TextField[];
  templateId: string;
  customColor: string | null;
}
