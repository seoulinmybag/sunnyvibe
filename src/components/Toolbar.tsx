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
  const [askingConfirm, setAskingConfirm] = useState(false);
  const [preview, setPreview] = useState<{ front: string; back: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

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

  /** Snapshot both faces so the customer can eyeball the whole card before committing to it. */
  async function handlePreview() {
    const stage = stageRef.current;
    if (!stage) return;
    const originalSide = activeSide;
    setPreviewing(true);
    try {
      await document.fonts?.ready;
      // screen-sized snapshots, not print resolution — this is a look-over, not an export
      const pixelRatio = 1.5;
      onSwitchSide('front');
      await wait(80);
      const front = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      onSwitchSide('back');
      await wait(80);
      const back = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      onSwitchSide(originalSide);
      setPreview({ front, back });
    } catch (err) {
      console.error(err);
      onSwitchSide(originalSide);
      alert('미리보기를 만드는 데 실패했어요. 외부 사진 URL이 CORS를 허용하지 않으면 이 문제가 생길 수 있어요.');
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirmDesign() {
    setAskingConfirm(false);
    const stage = stageRef.current;
    if (!stage || !pages || !resolveTemplate) return;
    const originalSide = activeSide;
    setConfirming(true);
    try {
      // the print PNG bakes in whatever the canvas has at this moment — wait for the webfonts
      await document.fonts?.ready;
      const pixelRatio = spec.printWidthPx / spec.displayWidth;
      const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

      // only the currently-mounted side's Konva nodes are queryable, so this must be
      // rebuilt fresh right after each onSwitchSide+wait below. Inlines every image as base64
      // so the exported SVG stays valid forever instead of pointing at a short-lived signed URL.
      function resolveImage(icon: PlacedIcon) {
        const node = stage!.findOne('#' + icon.uid) as Konva.Image | undefined;
        const img = node?.image() as HTMLImageElement | undefined;
        if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return null;
        if (icon.src.startsWith('data:')) {
          return { width: img.naturalWidth, height: img.naturalHeight, dataUri: icon.src };
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0);
          return { width: img.naturalWidth, height: img.naturalHeight, dataUri: canvas.toDataURL('image/png') };
        } catch {
          // CORS-tainted canvas — fall back to the original (possibly external) src reference
          return null;
        }
      }

      onSwitchSide('front');
      await wait(80);
      const frontPrintPng = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      const frontSvg = pageToSvgString(pages.front, resolveTemplate(pages.front), spec, resolveImage);

      onSwitchSide('back');
      await wait(80);
      const backPrintPng = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
      const backSvg = pageToSvgString(pages.back, resolveTemplate(pages.back), spec, resolveImage);

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
        <button disabled={previewing} onClick={handlePreview}>
          {previewing ? '만드는 중...' : '시안 미리보기'}
        </button>
        <button onClick={handleDownload}>이미지 다운로드</button>
        {!readOnly && (
          <button className="primary" disabled={confirming} onClick={() => setAskingConfirm(true)}>
            {confirming ? '확정하는 중...' : '시안 확정하기'}
          </button>
        )}
      </div>

      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal-card modal-preview" onClick={(e) => e.stopPropagation()}>
            <h2>시안 미리보기</h2>
            <div className="preview-grid">
              <figure>
                <img src={preview.front} alt="앞면 시안" />
                <figcaption>앞면</figcaption>
              </figure>
              <figure>
                <img src={preview.back} alt="뒷면 시안" />
                <figcaption>뒷면</figcaption>
              </figure>
            </div>
            <div className="modal-actions">
              <button onClick={() => setPreview(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {askingConfirm && (
        <div className="modal-backdrop" onClick={() => setAskingConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>시안 확정 전 오타 및 수정 요청사항 확인 부탁드립니다 😊</h2>
            <p className="modal-note">
              * 제작에 착수하게 되면 수정이 어려움으로 꼼꼼히 확인 부탁드립니다! ( Ex. 날짜, 내용, 이름, 계좌 번호 등)
            </p>
            <div className="modal-actions">
              <button onClick={() => setAskingConfirm(false)}>취소</button>
              <button className="primary" disabled={confirming} onClick={handleConfirmDesign}>
                {confirming ? '확정하는 중...' : '시안 확정하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
