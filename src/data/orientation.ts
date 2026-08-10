import type { Orientation, OrientationSpec } from '../types';

/**
 * Print target: 16cm x 11cm physical card.
 * - display*: on-screen editing canvas size (16:11 / 11:16 ratio)
 * - printWidthPx/printHeightPx: 300dpi render size for the "시안 확정하기" PDF export
 * - downloadWidthPx/downloadHeightPx: size for the plain "이미지 다운로드" PNG
 */
export const ORIENTATIONS: Record<Orientation, OrientationSpec> = {
  landscape: {
    id: 'landscape',
    label: '가로',
    ratioLabel: '16:11',
    displayWidth: 800,
    displayHeight: 550,
    printWidthMm: 160,
    printHeightMm: 110,
    printWidthPx: 1890,
    printHeightPx: 1299,
    downloadWidthPx: 1600,
    downloadHeightPx: 1100,
  },
  portrait: {
    id: 'portrait',
    label: '세로',
    ratioLabel: '11:16',
    displayWidth: 550,
    displayHeight: 800,
    printWidthMm: 110,
    printHeightMm: 160,
    printWidthPx: 1299,
    printHeightPx: 1890,
    downloadWidthPx: 1100,
    downloadHeightPx: 1600,
  },
};
