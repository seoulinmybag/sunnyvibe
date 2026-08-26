import { useRef, useState } from 'react';
import type Konva from 'konva';
import CanvasEditor from './CanvasEditor';
import IconLibrary from './IconLibrary';
import OrientationPicker from './OrientationPicker';
import ImageUpload from './ImageUpload';
import TemplatePicker from './TemplatePicker';
import TextFieldsPanel from './TextFieldsPanel';
import PageSwitcher from './PageSwitcher';
import Toolbar from './Toolbar';
import { ICONS } from '../data/icons';
import { TEMPLATES } from '../data/templates';
import { ORIENTATIONS } from '../data/orientation';
import type { Orientation, PageState, PlacedIcon, SelectedElement, Side, TextField } from '../types';
import '../App.css';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

interface EditorProps {
  orientation: Orientation;
  initialPages: Record<Side, PageState>;
  /** Only the standalone `/` playground shows this today. */
  showCustomerLinkPanel?: boolean;
}

let uidCounter = 0;

export default function Editor({ orientation: initialOrientation, initialPages }: EditorProps) {
  const [orientation, setOrientation] = useState<Orientation>(initialOrientation);
  const spec = ORIENTATIONS[orientation];

  const [pages, setPages] = useState<Record<Side, PageState>>(initialPages);
  const [activeSide, setActiveSide] = useState<Side>('front');
  const activePage = pages[activeSide];

  const baseTemplate = TEMPLATES.find((t) => t.id === activePage.templateId) ?? INITIAL_TEMPLATE;
  const template = activePage.customColor
    ? { id: 'custom', label: '커스텀', background: activePage.customColor, textColorDefault: baseTemplate.textColorDefault }
    : baseTemplate;

  const [selected, setSelected] = useState<SelectedElement>(null);
  const zCounter = useRef(10);
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
    const size = 80;
    const placed: PlacedIcon = {
      uid,
      iconId,
      src: def.src,
      x: spec.displayWidth / 2 - size / 2,
      y: spec.displayHeight / 2 - size / 2,
      width: size,
      height: size,
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

  function handleReorder(dir: 'front' | 'back') {
    if (!selected) return;
    const z = dir === 'front' ? ++zCounter.current : --zCounter.current;
    if (selected.type === 'icon') {
      handleIconChange(selected.uid, { zIndex: z });
    } else {
      handleTextChange(selected.id, { zIndex: z });
    }
  }

  function handleOrientationChange(next: Orientation) {
    if (next === orientation) return;
    const oldSpec = ORIENTATIONS[orientation];
    const newSpec = ORIENTATIONS[next];
    const scaleX = newSpec.displayWidth / oldSpec.displayWidth;
    const scaleY = newSpec.displayHeight / oldSpec.displayHeight;
    const rescale = (p: PageState): PageState => ({
      ...p,
      icons: p.icons.map((i) => ({ ...i, x: i.x * scaleX, y: i.y * scaleY, width: i.width * scaleX, height: i.height * scaleY })),
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
          {/* TODO: swap for the real logo file once we have it — see src/assets/logo.png */}
          <span className="app-logo-placeholder">sunny vibe</span>
        </div>
        <div>
          <h1>청첩장 꾸미기</h1>
          <p>아이콘을 골라 나만의 청첩장을 완성하고, 이미지로 저장하거나 시안을 확정하세요.</p>
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
      />
      <main className="app-main">
        <aside className="side-col">
          <IconLibrary onAddIcon={handleAddIcon} />
        </aside>
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
            stageRef={stageRef}
          />
          <PageSwitcher side={activeSide} onChange={handleSwitchSide} />
        </section>
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
      </main>
    </div>
  );
}
