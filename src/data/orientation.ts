import type { Orientation, OrientationSpec } from '../types.js';

/**
 * Print target: 16cm x 11cm physical card. 세로 규격은 취급하지 않는다 — 주문은 전부 가로다.
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
};

/** 화면 좌표 1px = 인쇄 0.2mm. 레퍼런스가 pt로 적혀 있어 글자 크기를 환산할 때 쓴다. */
export const PX_PER_MM = ORIENTATIONS.landscape.displayWidth / ORIENTATIONS.landscape.printWidthMm;

/** 레퍼런스의 pt 값을 캔버스 px로. 1pt = 1/72인치 = 0.3528mm. */
export function ptToPx(pt: number): number {
  return Math.round(pt * 0.352778 * PX_PER_MM * 100) / 100;
}
