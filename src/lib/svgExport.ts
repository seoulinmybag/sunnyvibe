import { sortByZIndex } from './layering';
import type { OrientationSpec, PageState, PlacedIcon, TextField, Template } from '../types';

export interface NaturalSize {
  width: number;
  height: number;
}

/** Looks up a placed icon's source image's natural pixel size, when known (needed to reconstruct crops accurately). */
export type NaturalSizeLookup = (icon: PlacedIcon) => NaturalSize | null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderIcon(icon: PlacedIcon, getNaturalSize?: NaturalSizeLookup): string {
  const cx = icon.x + icon.width / 2;
  const cy = icon.y + icon.height / 2;
  const rotateAttr = icon.rotation ? ` transform="rotate(${icon.rotation} ${cx} ${cy})"` : '';

  if (icon.crop) {
    const natural = getNaturalSize?.(icon);
    if (natural && natural.width > 0 && natural.height > 0) {
      const scaleX = icon.width / icon.crop.width;
      const scaleY = icon.height / icon.crop.height;
      const imgX = -icon.crop.x * scaleX;
      const imgY = -icon.crop.y * scaleY;
      const imgW = natural.width * scaleX;
      const imgH = natural.height * scaleY;
      const clipId = `clip-${icon.uid}`;
      return (
        `<svg x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" viewBox="0 0 ${icon.width} ${icon.height}"${rotateAttr}>` +
        `<clipPath id="${clipId}"><rect x="0" y="0" width="${icon.width}" height="${icon.height}"/></clipPath>` +
        `<image href="${esc(icon.src)}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" clip-path="url(#${clipId})" preserveAspectRatio="none"/>` +
        `</svg>`
      );
    }
    // natural size unknown (e.g. server-side regeneration without a live canvas) — fall back to a plain cover-fit
    return `<image href="${esc(icon.src)}" x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" preserveAspectRatio="xMidYMid slice"${rotateAttr}/>`;
  }

  return `<image href="${esc(icon.src)}" x="${icon.x}" y="${icon.y}" width="${icon.width}" height="${icon.height}" preserveAspectRatio="none"${rotateAttr}/>`;
}

function textAnchorFor(align: TextField['align']): string {
  return align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
}

function anchorX(field: TextField): number {
  if (field.align === 'center') return field.x + field.width / 2;
  if (field.align === 'right') return field.x + field.width;
  return field.x;
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
  return `<text font-family="${esc(field.fontFamily)}" font-size="${field.fontSize}" fill="${esc(field.fill)}" text-anchor="${anchor}">${tspans}</text>`;
}

/**
 * Serializes one card face to a real, editable SVG: text stays as <text> (the part a print
 * shop actually needs to fix a typo), photos/icons embed as <image> (already data-URIs, so no
 * fetch step needed). Physical size is set via mm width/height so it opens at the correct
 * size in Illustrator/Inkscape without manual scaling.
 */
export function pageToSvgString(page: PageState, template: Template, spec: OrientationSpec, getNaturalSize?: NaturalSizeLookup): string {
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
    .map((item) => (item.kind === 'icon' ? renderIcon(item.data, getNaturalSize) : renderText(item.data)))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${spec.printWidthMm}mm" height="${spec.printHeightMm}mm">${defs}${backgroundMarkup}${body}</svg>`;
}
