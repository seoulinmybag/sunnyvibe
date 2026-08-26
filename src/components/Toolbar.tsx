import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type Konva from 'konva';
import { ORIENTATIONS } from '../data/orientation';
import { pageToSvgString } from '../lib/svgExport';
import type { Orientation, PageState, PlacedIcon, SelectedElement, Side, Template } from '../types';

export interface ConfirmPayload {
  frontPrintPng: string;
  backPrintPng: string;
  frontSvg: string;
  backSvg: string;
}

interface Props {
  selected: SelectedElement;
  orientation: Orientation;
  activeSide: Side;
  onSwitchSide: (side: Side) => void;
  onDelete: () => void;
  onReorder: (dir: 'front' | 'back') => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  /** true once the order is confirmed — no more edits, only the casual PNG download stays available. */
  readOnly?: boolean;
  /** both sides' design data, needed to build the SVG export regardless of which side is currently shown. */
  pages?: Record<Side, PageState>;
  resolveTemplate?: (page: PageState) => Template;
  /** when provided, "시안 확정하기" hands the generated files here instead of just saving a local PDF. */
  onConfirm?: (payload: ConfirmPayload) => Promise<void>;
}

function downloadDataUri(uri: string, filename: string) {
  const link = document.createElement('a');
  link.href = uri;
  link.download = filename;
  link.click();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Toolbar({
  selected,
  orientation,
  activeSide,
  onSwitchSide,
  onDelete,
  onReorder,
  stageRef,
  readOnly = false,
  pages,
  resolveTemplate,
  onConfirm,
}: Props) {
  const spec = ORIENTATIONS[orientation];
  const [confirming, setConfirming] = useState(false);

  function handleDownload() {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      const pixelRatio = spec.downloadWidthPx / spec.displayWidth;
      const uri = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      downloadDataUri(uri, `wedding-invitation-${orientation}-${activeSide}.png`);
    } catch (err) {
      console.error(err);
      alert('이미지를 만드는 데 실패했어요. 외부 사진 URL이 CORS를 허용하지 않으면 이 문제가 생길 수 있어요.');
    }
  }

  async function handleConfirmDesign() {
    const stage = stageRef.current;
    if (!stage || !pages || !resolveTemplate) return;
    const originalSide = activeSide;
    setConfirming(true);
    try {
      const pixelRatio = spec.printWidthPx / spec.displayWidth;
      const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

      // only the currently-mounted side's Konva nodes are queryable, so this must be
      // rebuilt fresh right after each onSwitchSide+wait below
      function getNaturalSize(icon: PlacedIcon) {
        const node = stage!.findOne('#' + icon.uid) as Konva.Image | undefined;
        const img = node?.image() as HTMLImageElement | undefined;
        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
          return { width: img.naturalWidth, height: img.naturalHeight };
        }
        return null;
      }

      onSwitchSide('front');
      await wait(80);
      const frontPrintPng = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      const frontSvg = pageToSvgString(pages.front, resolveTemplate(pages.front), spec, getNaturalSize);

      onSwitchSide('back');
      await wait(80);
      const backPrintPng = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      const backSvg = pageToSvgString(pages.back, resolveTemplate(pages.back), spec, getNaturalSize);

      onSwitchSide(originalSide);

      if (onConfirm) {
        await onConfirm({ frontPrintPng, backPrintPng, frontSvg, backSvg });
        return;
      }

      // no backend order (the standalone `/` playground) — just save a local PDF like before
      const doc = new jsPDF({ orientation: pageOrientation, unit: 'mm', format: [spec.printWidthMm, spec.printHeightMm] });
      doc.addImage(frontPrintPng, 'PNG', 0, 0, spec.printWidthMm, spec.printHeightMm, undefined, 'FAST');
      doc.addPage([spec.printWidthMm, spec.printHeightMm], pageOrientation);
      doc.addImage(backPrintPng, 'PNG', 0, 0, spec.printWidthMm, spec.printHeightMm, undefined, 'FAST');
      doc.save(`wedding-invitation-print-${orientation}.pdf`);
    } catch (err) {
      console.error(err);
      onSwitchSide(originalSide);
      alert('시안 확정에 실패했어요. 외부 사진 URL이 CORS를 허용하지 않으면 이 문제가 생길 수 있어요.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {!readOnly && (
          <>
            <button disabled={!selected} onClick={() => onReorder('back')}>
              ⬇ 뒤로
            </button>
            <button disabled={!selected} onClick={() => onReorder('front')}>
              ⬆ 앞으로
            </button>
            <button disabled={!selected} className="danger" onClick={onDelete}>
              삭제
            </button>
          </>
        )}
      </div>
      <div className="toolbar-group">
        <button onClick={handleDownload}>이미지 다운로드</button>
        {!readOnly && (
          <button className="primary" disabled={confirming} onClick={handleConfirmDesign}>
            {confirming ? '확정하는 중...' : '시안 확정하기'}
          </button>
        )}
      </div>
    </div>
  );
}
