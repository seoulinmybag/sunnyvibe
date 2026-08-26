import type { PlacedIcon, TextField } from '../types';

export type LayeredItem = { zIndex: number } & ({ kind: 'icon'; data: PlacedIcon } | { kind: 'text'; data: TextField });

/** Icons and texts share one z-order — reused by the canvas renderer and the SVG exporter so they can never drift apart. */
export function sortByZIndex(icons: PlacedIcon[], texts: TextField[]): LayeredItem[] {
  return [
    ...icons.map((data) => ({ kind: 'icon' as const, data, zIndex: data.zIndex })),
    ...texts.map((data) => ({ kind: 'text' as const, data, zIndex: data.zIndex })),
  ].sort((a, b) => a.zIndex - b.zIndex);
}
