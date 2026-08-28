import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import CanvasEditor from './CanvasEditor';
import IconLibrary from './IconLibrary';
import OrientationPicker from './OrientationPicker';
import ImageUpload from './ImageUpload';
import TemplatePicker from './TemplatePicker';
import TextFieldsPanel from './TextFieldsPanel';
import LayerPanel from './LayerPanel';
import PageSwitcher from './PageSwitcher';
import Toolbar from './Toolbar';
import logoUrl from '../assets/logo.png';
import { sortByZIndex } from '../lib/layering';
import { ICONS } from '../data/icons';
import { TEMPLATES } from '../data/templates';
import { ORIENTATIONS } from '../data/orientation';
import type { ConfirmPayload } from './Toolbar';
import type { LayerMove, LayerTarget } from './LayerPanel';
import type { Orientation, PageState, PlacedIcon, SelectedElement, Side, TextField, Template } from '../types';
import '../App.css';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

function resolveTemplate(page: PageState): Template {
  const base = TEMPLATES.find((t) => t.id === page.templateId) ?? INITIAL_TEMPLATE;
  return page.customColor ? { id: 'custom', label: '커스텀', background: page.customColor, textColorDefault: base.textColorDefault } : base;
}

interface EditorProps {
  orientation: Orientation;
  initialPages: Record<Side, PageState>;
  /** Only the standalone `/` playground shows this today. */
  showCustomerLinkPanel?: boolean;
  /** true once the order is confirmed — canvas becomes view-only and editing panels are hidden. */
  readOnly?: boolean;
  /** fired whenever `pages` changes, so a customer-order host can debounce-save it. */
  onPagesChange?: (pages: Record<Side, PageState>) => void;
  /** when provided, "시안 확정하기" hands the generated files here instead of just saving a local PDF. */
  onConfirm?: (payload: ConfirmPayload) => Promise<void>;
  /** when provided, the toolbar offers 임시저장 to flush the pending autosave. */
  onSaveNow?: () => Promise<void>;
  /** true while an autosave request is in flight. */
  saving?: boolean;
}

let uidCounter = 0;

/** New elements have to land above everything the auto-layout already placed (e.g. the 자막 caption at z 20). */
function maxZIndex(pages: Record<Side, PageState>): number {
  let max = 10;
  for (const page of Object.values(pages)) {
    for (const icon of page.icons) max = Math.max(max, icon.zIndex);
    for (const text of page.texts) max = Math.max(max, text.zIndex);
  }
  return max;
}

export default function Editor({
  orientation: initialOrientation,
  initialPages,
  readOnly = false,
  onPagesChange,
  onConfirm,
  onSaveNow,
  saving,
}: EditorProps) {
  const [orientation, setOrientation] = useState<Orientation>(initialOrientation);
  const spec = ORIENTATIONS[orientation];

  const [pages, setPages] = useState<Record<Side, PageState>>(initialPages);
  const [activeSide, setActiveSide] = useState<Side>('front');
  const activePage = pages[activeSide];

  useEffect(() => {
    onPagesChange?.(pages);
  }, [pages, onPagesChange]);

  const template = resolveTemplate(activePage);

  const [selected, setSelected] = useState<SelectedElement>(null);
  const [initialZ] = useState(() => maxZIndex(initialPages));
  const zCounter = useRef(initialZ);
  const stageRef = useRef<Konva.Stage | null>(null);

  function updateActivePage(updater: (p: PageState) => PageState) {
    setPages((prev) => ({ ...prev, [activeSide]: updater(prev[activeSide]) }));
  }

  function handleSwitchSide(side: Side) {
    setSelected(null);
    setActiveSide(side);
  }

  function handleAddIcon(iconId: string) {
    const def = ICONS.find((i) => i.id === iconId);
    if (!def) return;
    const uid = `icon-${++uidCounter}`;
    // fit inside a square box at the artwork's own ratio — the PNG icons aren't square
    const box = 110;
    const ratio = Math.min(box / def.naturalWidth, box / def.naturalHeight);
    const width = def.naturalWidth * ratio;
    const height = def.naturalHeight * ratio;
    const placed: PlacedIcon = {
      uid,
      iconId,
      src: def.src,
      x: spec.displayWidth / 2 - width / 2,
      y: spec.displayHeight / 2 - height / 2,
      width,
      height,
      rotation: 0,
      zIndex: ++zCounter.current,
    };
    updateActivePage((p) => ({ ...p, icons: [...p.icons, placed] }));
    setSelected({ type: 'icon', uid });
  }

  function handleUploadPhoto(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      const maxW = spec.displayWidth * 0.7;
      const maxH = spec.displayHeight * 0.4;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      const width = img.naturalWidth * ratio;
      const height = img.naturalHeight * ratio;
      const uid = `upload-${++uidCounter}`;
      const placed: PlacedIcon = {
        uid,
        iconId: 'uploaded-photo',
        src: dataUrl,
        x: spec.displayWidth / 2 - width / 2,
        y: spec.displayHeight / 2 - height / 2,
        width,
        height,
        rotation: 0,
        zIndex: ++zCounter.current,
      };
      updateActivePage((p) => ({ ...p, icons: [...p.icons, placed] }));
      setSelected({ type: 'icon', uid });
    };
    img.src = dataUrl;
  }

  function handleIconChange(uid: string, attrs: Partial<PlacedIcon>) {
    updateActivePage((p) => ({ ...p, icons: p.icons.map((i) => (i.uid === uid ? { ...i, ...attrs } : i)) }));
  }

  function handleTextChange(id: string, attrs: Partial<TextField>) {
    updateActivePage((p) => ({ ...p, texts: p.texts.map((t) => (t.id === id ? { ...t, ...attrs } : t)) }));
  }

  function handleDelete() {
    if (!selected) return;
    if (selected.type === 'icon') {
      updateActivePage((p) => ({ ...p, icons: p.icons.filter((i) => i.uid !== selected.uid) }));
      setSelected(null);
    } else {
      // text fields are fixed slots; clear content instead of removing the field
      handleTextChange(selected.id, { text: '' });
    }
  }

  /**
   * Rewrites every zIndex on the page as 0..n-1 around the move. The old scheme just bumped a
   * shared counter, which drifts out of step with what the layer list shows (and made "뒤로"
   * land above elements that were never touched).
   */
  function moveLayer(target: LayerTarget, move: LayerMove) {
    updateActivePage((page) => {
      const ordered = sortByZIndex(page.icons, page.texts);
      const index = ordered.findIndex((item) =>
        item.kind === 'icon'
          ? target.type === 'icon' && item.data.uid === target.uid
          : target.type === 'text' && item.data.id === target.id,
      );
      if (index === -1) return page;

      const to =
        move === 'forward' ? index + 1 : move === 'backward' ? index - 1 : move === 'front' ? ordered.length - 1 : 0;
      if (to === index || to < 0 || to >= ordered.length) return page;

      const [moved] = ordered.splice(index, 1);
      ordered.splice(to, 0, moved);

      const iconZ = new Map<string, number>();
      const textZ = new Map<string, number>();
      ordered.forEach((item, i) => {
        if (item.kind === 'icon') iconZ.set(item.data.uid, i);
        else textZ.set(item.data.id, i);
      });
      zCounter.current = ordered.length;

      return {
        ...page,
        icons: page.icons.map((i) => ({ ...i, zIndex: iconZ.get(i.uid) ?? i.zIndex })),
        texts: page.texts.map((t) => ({ ...t, zIndex: textZ.get(t.id) ?? t.zIndex })),
      };
    });
  }

  function handleReorder(dir: 'front' | 'back') {
    if (!selected) return;
    moveLayer(selected, dir);
  }

  function handleOrientationChange(next: Orientation) {
    if (next === orientation) return;
    const oldSpec = ORIENTATIONS[orientation];
    const newSpec = ORIENTATIONS[next];
    const scaleX = newSpec.displayWidth / oldSpec.displayWidth;
    const scaleY = newSpec.displayHeight / oldSpec.displayHeight;
    // 사진·아이콘은 가로/세로를 따로 늘리면 그림이 찌그러진다. 한 배율(작은 쪽)로만 줄이고,
    // 카드 안에서의 상대적인 중심 위치를 유지해 원래 있던 자리로 옮긴다.
    const uniform = Math.min(scaleX, scaleY);
    const rescale = (p: PageState): PageState => ({
      ...p,
      icons: p.icons.map((i) => {
        const width = i.width * uniform;
        const height = i.height * uniform;
        const centerX = ((i.x + i.width / 2) / oldSpec.displayWidth) * newSpec.displayWidth;
        const centerY = ((i.y + i.height / 2) / oldSpec.displayHeight) * newSpec.displayHeight;
        return { ...i, x: centerX - width / 2, y: centerY - height / 2, width, height };
      }),
      // 텍스트는 그림이 아니라서 폭이 카드 너비를 따라가는 게 자연스럽다
      texts: p.texts.map((t) => ({ ...t, x: t.x * scaleX, y: t.y * scaleY, width: t.width * scaleX })),
    });
    setPages((prev) => ({ front: rescale(prev.front), back: rescale(prev.back) }));
    setOrientation(next);
  }

  function handleTemplateChange(id: string) {
    updateActivePage((p) => ({ ...p, templateId: id, customColor: null }));
  }

  function handleCustomColor(color: string) {
    updateActivePage((p) => ({ ...p, customColor: color }));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <img src={logoUrl} alt="sunny vibe" className="app-logo" />
        </div>
        <div>
          <h1>청첩장 꾸미기</h1>
          {readOnly ? (
            <p className="app-readonly-banner">확정된 시안이에요 — 더 이상 수정할 수 없어요.</p>
          ) : (
            <p>아이콘을 골라 나만의 청첩장을 완성하고, 이미지로 저장하거나 시안을 확정하세요.</p>
          )}
        </div>
      </header>
      <Toolbar
        selected={selected}
        orientation={orientation}
        activeSide={activeSide}
        onSwitchSide={handleSwitchSide}
        onDelete={handleDelete}
        onReorder={handleReorder}
        stageRef={stageRef}
        readOnly={readOnly}
        pages={pages}
        resolveTemplate={resolveTemplate}
        onConfirm={onConfirm}
        onSaveNow={onSaveNow}
        saving={saving}
      />
      <main className={readOnly ? 'app-main app-main-readonly' : 'app-main'}>
        {!readOnly && (
          <aside className="side-col">
            <IconLibrary onAddIcon={handleAddIcon} />
            <LayerPanel
              icons={activePage.icons}
              texts={activePage.texts}
              selected={selected}
              onSelect={setSelected}
              onMove={moveLayer}
            />
          </aside>
        )}
        <section className="center-col">
          <CanvasEditor
            width={spec.displayWidth}
            height={spec.displayHeight}
            template={template}
            icons={activePage.icons}
            texts={activePage.texts}
            selected={selected}
            onSelect={setSelected}
            onIconChange={handleIconChange}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onMoveLayer={(move) => selected && moveLayer(selected, move)}
            stageRef={stageRef}
            interactive={!readOnly}
          />
          <PageSwitcher side={activeSide} onChange={handleSwitchSide} />
        </section>
        {!readOnly && (
          <aside className="side-col">
            <OrientationPicker orientation={orientation} onChange={handleOrientationChange} />
            <ImageUpload onUpload={handleUploadPhoto} />
            <TemplatePicker
              templateId={activePage.templateId}
              customColor={activePage.customColor}
              onChange={handleTemplateChange}
              onCustomColor={handleCustomColor}
            />
            <TextFieldsPanel texts={activePage.texts} selected={selected} onChange={handleTextChange} onSelect={setSelected} />
          </aside>
        )}
      </main>
    </div>
  );
}
