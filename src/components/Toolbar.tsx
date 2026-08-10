import { jsPDF } from 'jspdf';
import type Konva from 'konva';
import { ORIENTATIONS } from '../data/orientation';
import type { Orientation, SelectedElement, Side } from '../types';

interface Props {
  selected: SelectedElement;
  orientation: Orientation;
  activeSide: Side;
  onSwitchSide: (side: Side) => void;
  onDelete: () => void;
  onReorder: (dir: 'front' | 'back') => void;
  stageRef: React.RefObject<Konva.Stage | null>;
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

export default function Toolbar({ selected, orientation, activeSide, onSwitchSide, onDelete, onReorder, stageRef }: Props) {
  const spec = ORIENTATIONS[orientation];

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
    if (!stage) return;
    const originalSide = activeSide;
    try {
      const pixelRatio = spec.printWidthPx / spec.displayWidth;
      const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

      onSwitchSide('front');
      await wait(80);
      const frontUri = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });

      onSwitchSide('back');
      await wait(80);
      const backUri = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });

      onSwitchSide(originalSide);

      const doc = new jsPDF({ orientation: pageOrientation, unit: 'mm', format: [spec.printWidthMm, spec.printHeightMm] });
      doc.addImage(frontUri, 'PNG', 0, 0, spec.printWidthMm, spec.printHeightMm, undefined, 'FAST');
      doc.addPage([spec.printWidthMm, spec.printHeightMm], pageOrientation);
      doc.addImage(backUri, 'PNG', 0, 0, spec.printWidthMm, spec.printHeightMm, undefined, 'FAST');
      doc.save(`wedding-invitation-print-${orientation}.pdf`);
    } catch (err) {
      console.error(err);
      onSwitchSide(originalSide);
      alert('PDF를 만드는 데 실패했어요. 외부 사진 URL이 CORS를 허용하지 않으면 이 문제가 생길 수 있어요.');
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button disabled={!selected} onClick={() => onReorder('back')}>
          ⬇ 뒤로
        </button>
        <button disabled={!selected} onClick={() => onReorder('front')}>
          ⬆ 앞으로
        </button>
        <button disabled={!selected} className="danger" onClick={onDelete}>
          삭제
        </button>
      </div>
      <div className="toolbar-group">
        <button onClick={handleDownload}>이미지 다운로드</button>
        <button className="primary" onClick={handleConfirmDesign}>
          시안 확정하기
        </button>
      </div>
    </div>
  );
}
