import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import CanvasEditor from './CanvasEditor';
import IconLibrary from './IconLibrary';
import ImageUpload from './ImageUpload';
import TemplatePicker from './TemplatePicker';
import TextFieldsPanel from './TextFieldsPanel';
import LayerPanel from './LayerPanel';
import TemplatePanel from './TemplatePanel';
import PageSwitcher from './PageSwitcher';
import Toolbar from './Toolbar';
import logoUrl from '../assets/logo.png';
import { sortByZIndex } from '../lib/layering';
import { ICONS } from '../data/icons';
import { TEMPLATES } from '../data/templates';
import { ORIENTATIONS } from '../data/orientation';
import { FRONT_TEMPLATES } from '../data/frontTemplates';
import { templateIcons } from '../lib/applyTemplate';
import type { ConfirmPayload } from './Toolbar';
import type { LayerMove, LayerTarget } from './LayerPanel';
import { panelTypeOf, sidesFor } from '../types';
import type { Orientation, PageState, Pages, PlacedIcon, SelectedElement, Side, TextField, Template } from '../types';
import '../App.css';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

function resolveTemplate(page: PageState): Template {
  const base = TEMPLATES.find((t) => t.id === page.templateId) ?? INITIAL_TEMPLATE;
  return page.customColor ? { id: 'custom', label: '커스텀', background: page.customColor, textColorDefault: base.textColorDefault } : base;
}

interface EditorProps {
  orientation: Orientation;
  initialPages: Pages;
  /** Only the standalone `/` playground shows this today. */
  showCustomerLinkPanel?: boolean;
  /** true once the order is confirmed — canvas becomes view-only and editing panels are hidden. */
  readOnly?: boolean;
  /** fired whenever `pages` changes, so a customer-order host can debounce-save it. */
  onPagesChange?: (pages: Pages) => void;
  /** when provided, "시안 확정하기" hands the generated files here instead of just saving a local PDF. */
  onConfirm?: (payload: ConfirmPayload) => Promise<void>;
  /** when provided, the toolbar offers 임시저장 to flush the pending autosave. */
  onSaveNow?: () => Promise<void>;
  /** true while an autosave request is in flight. */
  saving?: boolean;
}

let uidCounter = 0;

/** 되돌리기로 거슬러 갈 수 있는 최대 칸 수. */
const HISTORY_LIMIT = 100;
/** 이 시간 안에 이어진 같은 종류의 변경은 되돌리기 한 칸으로 묶는다. */
const COALESCE_MS = 700;
/** 앞면 하단 자막 슬롯. 템플릿을 얹어도 이것만은 위에 남는다. */
const CAPTION_FIELD_ID = 'title';

/** New elements have to land above everything the auto-layout already placed (e.g. the 자막 caption at z 20). */
function maxZIndex(pages: Pages): number {
  let max = 10;
  for (const page of Object.values(pages)) {
    if (!page) continue;
    for (const icon of page.icons) max = Math.max(max, icon.zIndex);
    for (const text of page.texts) max = Math.max(max, text.zIndex);
  }
  return max;
}

export default function Editor({
  orientation,
  initialPages,
  readOnly = false,
  onPagesChange,
  onConfirm,
  onSaveNow,
  saving,
}: EditorProps) {
  const spec = ORIENTATIONS[orientation];

  const [pages, setPages] = useState<Pages>(initialPages);
  const [activeSide, setActiveSide] = useState<Side>('front');
  // 2단이면 내지 두 면이 더 있다 — 저장된 시안에 있는 면만 보여준다
  const panelType = panelTypeOf(pages);
  const sides = sidesFor(panelType).filter((s) => pages[s]);
  const activePage = pages[activeSide] ?? pages.front!;

  useEffect(() => {
    onPagesChange?.(pages);
  }, [pages, onPagesChange]);

  const template = resolveTemplate(activePage);

  /** 여러 개를 함께 잡을 수 있다. 스타일 패널처럼 하나만 다루는 UI는 selected로 좁혀 쓴다. */
  const [selection, setSelection] = useState<SelectedElement[]>([]);
  const selected = selection.length === 1 ? selection[0] : null;
  const [initialZ] = useState(() => maxZIndex(initialPages));
  const zCounter = useRef(initialZ);
  const stageRef = useRef<Konva.Stage | null>(null);

  /**
   * 되돌리기/다시 실행. 시안 전체(Pages)를 통째로 쌓는다 — 요소가 많아야 수십 개라
   * 스냅샷이 가볍고, 어떤 편집이든 따로 취소 코드를 쓸 필요가 없다.
   * StrictMode에서 setState 콜백이 두 번 불려도 안전하도록 히스토리는 콜백 밖에서 만진다.
   */
  const pagesRef = useRef(pages);
  const history = useRef<{ past: Pages[]; future: Pages[] }>({ past: [], future: [] });
  /** 같은 손놀림(연속 타자 등)을 한 칸으로 묶기 위한 직전 커밋 표시. */
  const lastCommit = useRef<{ at: number; key: string } | null>(null);
  const [depth, setDepth] = useState({ past: 0, future: 0 });

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  /**
   * 시안을 바꾸는 유일한 통로. coalesceKey가 같은 변경이 COALESCE_MS 안에 이어지면
   * 히스토리를 새로 쌓지 않는다 — 글자 한 자마다 되돌리기 한 번이 되지 않게.
   */
  function commit(updater: (prev: Pages) => Pages, coalesceKey?: string) {
    const prev = pagesRef.current;
    const next = updater(prev);
    if (next === prev) return;
    const now = Date.now();
    const merged =
      !!coalesceKey && lastCommit.current?.key === coalesceKey && now - lastCommit.current.at < COALESCE_MS;
    const h = history.current;
    if (!merged) h.past = [...h.past, prev].slice(-HISTORY_LIMIT);
    h.future = [];
    lastCommit.current = coalesceKey ? { at: now, key: coalesceKey } : null;
    pagesRef.current = next;
    setDepth({ past: h.past.length, future: 0 });
    setPages(next);
  }

  function undo() {
    const h = history.current;
    const prev = h.past[h.past.length - 1];
    if (!prev) return;
    h.past = h.past.slice(0, -1);
    h.future = [...h.future, pagesRef.current];
    lastCommit.current = null;
    pagesRef.current = prev;
    setDepth({ past: h.past.length, future: h.future.length });
    setSelection([]);
    setPages(prev);
  }

  function redo() {
    const h = history.current;
    const next = h.future[h.future.length - 1];
    if (!next) return;
    h.future = h.future.slice(0, -1);
    h.past = [...h.past, pagesRef.current];
    lastCommit.current = null;
    pagesRef.current = next;
    setDepth({ past: h.past.length, future: h.future.length });
    setSelection([]);
    setPages(next);
  }

  // ⌘/Ctrl+Z 되돌리기, ⌘+Shift+Z 또는 Ctrl+Y 다시 실행. 문구 칸에 커서가 있어도 같게
  // 동작해야 "방금 한 것"이 하나로 이어진다 — 그래서 기본 실행취소는 막는다.
  useEffect(() => {
    if (readOnly) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function updateActivePage(updater: (p: PageState) => PageState, coalesceKey?: string) {
    commit((prev) => {
      const page = prev[activeSide];
      return page ? { ...prev, [activeSide]: updater(page) } : prev;
    }, coalesceKey);
  }

  function handleSwitchSide(side: Side) {
    setSelection([]);
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
    setSelection([{ type: 'icon', uid }]);
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
      setSelection([{ type: 'icon', uid }]);
    };
    img.src = dataUrl;
  }

  /** Free text the customer adds themselves — unlike the generated slots, these can be removed. */
  function handleAddText(text: string) {
    const id = `custom-${++uidCounter}`;
    const width = spec.displayWidth * 0.7;
    const field: TextField = {
      id,
      label: '추가 문구',
      x: (spec.displayWidth - width) / 2,
      y: spec.displayHeight / 2,
      width,
      text,
      fontSize: 16,
      fontFamily: "'Noto Serif KR', serif",
      fill: template.textColorDefault,
      align: 'center',
      zIndex: ++zCounter.current,
    };
    updateActivePage((p) => ({ ...p, texts: [...p.texts, field] }));
    setSelection([{ type: 'text', id }]);
  }

  function handleIconChange(uid: string, attrs: Partial<PlacedIcon>) {
    updateActivePage(
      (p) => ({ ...p, icons: p.icons.map((i) => (i.uid === uid ? { ...i, ...attrs } : i)) }),
      `icon:${uid}:${Object.keys(attrs).join(',')}`,
    );
  }

  function handleTextChange(id: string, attrs: Partial<TextField>) {
    updateActivePage(
      (p) => ({ ...p, texts: p.texts.map((t) => (t.id === id ? { ...t, ...attrs } : t)) }),
      `text:${id}:${Object.keys(attrs).join(',')}`,
    );
  }

  /**
   * 미리 만들어 둔 아이콘 세트를 앞면에 얹는다. 지금 있는 것은 하나도 건드리지 않고
   * 맨 위에 더하기만 하므로, 고객이 꾸며 둔 것이 초기화되지 않는다.
   */
  function handleApplyTemplate(templateId: string) {
    const template = FRONT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const added = templateIcons(
      template,
      spec.displayWidth,
      spec.displayHeight,
      `tpl-${templateId}-${++uidCounter}`,
      zCounter.current + 1,
    );
    if (!added.length) return;
    // 자막은 주문마다 다르게 들어가는 자리라 템플릿에는 없다. 얹은 아이콘이 자막을 덮지
    // 않도록 자막만 맨 위로 올려 준다.
    const captionZ = zCounter.current + added.length + 1;
    zCounter.current = captionZ;
    commit((prev) => {
      const front = prev.front;
      if (!front) return prev;
      return {
        ...prev,
        front: {
          ...front,
          icons: [...front.icons, ...added],
          texts: front.texts.map((t) => (t.id === CAPTION_FIELD_ID ? { ...t, zIndex: captionZ } : t)),
        },
      };
    });
    // 얹은 자리가 앞면이니 보고 있는 면도 앞면으로 옮겨 준다
    setSelection([]);
    setActiveSide('front');
  }

  function handleDelete() {
    if (selection.length === 0) return;
    const iconIds = new Set(selection.filter((s) => s?.type === 'icon').map((s) => (s as { uid: string }).uid));
    const textIds = new Set(selection.filter((s) => s?.type === 'text').map((s) => (s as { id: string }).id));
    updateActivePage((p) => ({
      ...p,
      icons: p.icons.filter((i) => !iconIds.has(i.uid)),
      // 자동 배치로 생긴 칸은 레이아웃의 일부라 지우지 않고 내용만 비운다
      texts: p.texts
        .filter((t) => !(textIds.has(t.id) && t.id.startsWith('custom-')))
        .map((t) => (textIds.has(t.id) && !t.id.startsWith('custom-') ? { ...t, text: '' } : t)),
    }));
    setSelection([]);
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
    for (const sel of selection) if (sel) moveLayer(sel, dir);
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
        onUndo={undo}
        onRedo={redo}
        canUndo={depth.past > 0}
        canRedo={depth.future > 0}
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
            <TemplatePanel onApply={handleApplyTemplate} />
            <LayerPanel
              icons={activePage.icons}
              texts={activePage.texts}
              selection={selection}
              onSelect={(sel, additive) =>
                setSelection((prev) => {
                  if (!additive) return sel ? [sel] : [];
                  const id = (s: SelectedElement) => (s ? (s.type === 'icon' ? s.uid : `text:${s.id}`) : '');
                  return prev.some((p) => id(p) === id(sel)) ? prev.filter((p) => id(p) !== id(sel)) : [...prev, sel];
                })
              }
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
            selection={selection}
            onSelectionChange={setSelection}
            onIconChange={handleIconChange}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onMoveLayer={(move) => selection.forEach((sel) => sel && moveLayer(sel, move))}
            stageRef={stageRef}
            interactive={!readOnly}
          />
          <PageSwitcher sides={sides} side={activeSide} panelType={panelType} onChange={handleSwitchSide} />
        </section>
        {!readOnly && (
          <aside className="side-col">
            <TemplatePicker
              templateId={activePage.templateId}
              customColor={activePage.customColor}
              onChange={handleTemplateChange}
              onCustomColor={handleCustomColor}
            />
            <TextFieldsPanel
              texts={activePage.texts}
              selected={selected}
              onChange={handleTextChange}
              onSelect={(sel) => setSelection(sel ? [sel] : [])}
              onAddText={handleAddText}
            />
            <ImageUpload onUpload={handleUploadPhoto} />
          </aside>
        )}
      </main>
    </div>
  );
}
