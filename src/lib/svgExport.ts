import { sortByZIndex } from './layering';
import type { OrientationSpec, PageState, PlacedIcon, TextField, Template } from '../types';

export interface ResolvedImage {
  width: number;
  height: number;
  /** base64 data URI — inlined so the SVG stays valid forever, not tied to a short-lived signed URL. */
  dataUri: string;
}

/** Looks up a placed icon's natural pixel size + an inlined data URI for its source image, when known. */
export type ImageResolver = (icon: PlacedIcon) => ResolvedImage | null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderIcon(icon: PlacedIcon, resolveImage?: ImageResolver): string {
  const cx = icon.x + icon.width / 2;
  const cy = icon.y + icon.height / 2;
  const rotateAttr = icon.rotation ? ` transform="rotate(${icon.rotation} ${cx} ${cy})"` : '';
  const resolved = resolveImage?.(icon);
  // fall back to the original src (already a data URI for library icons; an external URL for
  // photos/maps/QRs if inlining failed for some reason, e.g. a CORS-restricted source)
  const href = resolved?.dataUri ?? icon.src;

  if (icon.crop && resolved) {
    const scaleX = icon.width / icon.crop.width;
    const scaleY = icon.height / icon.crop.height;
    const imgX = -icon.crop.x * scaleX;
    const imgY = -icon.crop.y * scaleY;
    const imgW = resolved.width * scaleX;
    const imgH = resolved.height * scaleY;
    const clipId = `clip-${icon.uid}`;
    return (
      `<svg x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" viewBox="0 0 ${icon.width} ${icon.height}"${rotateAttr}>` +
      `<clipPath id="${clipId}"><rect x="0" y="0" width="${icon.width}" height="${icon.height}"/></clipPath>` +
      `<image href="${esc(href)}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" clip-path="url(#${clipId})" preserveAspectRatio="none"/>` +
      `</svg>`
    );
  }
  if (icon.crop) {
    // no natural size available (e.g. server-side regeneration without a live canvas) — cover-fit fallback
    return `<image href="${esc(href)}" x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" preserveAspectRatio="xMidYMid slice"${rotateAttr}/>`;
  }

  return `<image href="${esc(href)}" x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" preserveAspectRatio="none"${rotateAttr}/>`;
}

function textAnchorFor(align: TextField['align']): string {
  return align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
}

function anchorX(field: TextField): number {
  if (field.align === 'center') return field.x + field.width / 2;
  if (field.align === 'right') return field.x + field.width;
  return field.x;
}

/** CJK glyphs are ~1em wide, Latin/digits roughly half that — enough to size a caption bar without a text engine. */
const WIDE_CHAR = /[\u1100-\u11FF\u3000-\u303F\u3130-\u318F\u4E00-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]/;

function estimateLineWidth(line: string, fontSize: number, letterSpacing = 0): number {
  let units = 0;
  let count = 0;
  for (const ch of line) {
    units += WIDE_CHAR.test(ch) ? 1 : 0.52;
    count++;
  }
  return units * fontSize + Math.max(0, count - 1) * letterSpacing;
}

/**
 * The caption bar behind a 자막-style text field. Its width is estimated rather than measured —
 * the browser canvas does the real measuring, so a print shop may need to nudge this rect by a
 * hair. Same class of limitation as the soft-wrap note below.
 */
function renderTextBackground(field: TextField, lines: string[]): string {
  const padding = field.backgroundPadding ?? field.fontSize * 0.55;
  const lineHeight = field.fontSize * 1.3;
  const textWidth = Math.min(
    Math.max(...lines.map((line) => estimateLineWidth(line, field.fontSize, field.letterSpacing))),
    field.width,
  );
  const textHeight = field.fontSize + (lines.length - 1) * lineHeight;
  const left =
    field.align === 'center'
      ? field.x + (field.width - textWidth) / 2
      : field.align === 'right'
        ? field.x + field.width - textWidth
        : field.x;
  return (
    `<rect x="${left - padding}" y="${field.y - padding * 0.5}" ` +
    `width="${textWidth + padding * 2}" height="${textHeight + padding}" rx="2" fill="${esc(field.background!)}"/>`
  );
}

function renderText(field: TextField): string {
  // only hard line breaks (\n) become separate lines — Konva's soft-wrap within `width` isn't
  // reproduced here, a documented v1 limitation (see plan notes on SVG export scope)
  const lines = field.text.split('\n');
  const anchor = textAnchorFor(field.align);
  const x = anchorX(field);
  const lineHeight = field.fontSize * 1.3;
  const firstBaselineY = field.y + field.fontSize * 0.9;
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" y="${firstBaselineY + i * lineHeight}">${esc(line)}</tspan>`)
    .join('');
  const background = field.background && field.text.trim() !== '' ? renderTextBackground(field, lines) : '';
  const tracking = field.letterSpacing ? ` letter-spacing="${field.letterSpacing}"` : '';
  return `${background}<text font-family="${esc(field.fontFamily)}" font-size="${field.fontSize}" fill="${esc(field.fill)}" text-anchor="${anchor}"${tracking}>${tspans}</text>`;
}

/**
 * Serializes one card face to a real, editable SVG: text stays as <text> (the part a print
 * shop actually needs to fix a typo), photos/icons embed as inlined base64 <image> so the file
 * stays valid forever (no dependency on a short-lived signed URL). Physical size is set via mm
 * width/height so it opens at the correct size in Illustrator/Inkscape without manual scaling.
 */
export function pageToSvgString(page: PageState, template: Template, spec: OrientationSpec, resolveImage?: ImageResolver): string {
  const w = spec.displayWidth;
  const h = spec.displayHeight;

  let defs = '';
  let backgroundMarkup: string;
  if (template.backgroundGradient) {
    const gid = 'bg-gradient';
    defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esc(template.backgroundGradient[0])}"/><stop offset="1" stop-color="${esc(template.backgroundGradient[1])}"/></linearGradient></defs>`;
    backgroundMarkup = `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${gid})"/>`;
  } else {
    backgroundMarkup = `<rect x="0" y="0" width="${w}" height="${h}" fill="${esc(template.background)}"/>`;
  }

  const body = sortByZIndex(page.icons, page.texts)
    .map((item) => (item.kind === 'icon' ? renderIcon(item.data, resolveImage) : renderText(item.data)))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${spec.printWidthMm}mm" height="${spec.printHeightMm}mm">${defs}${backgroundMarkup}${body}</svg>`;
}
