import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Text as KonvaText, Image as KonvaImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import { loadFonts } from '../data/fonts';
import { tintImage } from '../lib/tint';
import { getIconDefaultColor, getIconSrc, isLibraryIcon, isRecolorableIcon } from '../data/icons';
import { sortByZIndex } from '../lib/layering';
import type { PlacedIcon, TextField, Template, SelectedElement } from '../types';

interface Props {
  width: number;
  height: number;
  template: Template;
  icons: PlacedIcon[];
  texts: TextField[];
  /** 여러 개를 함께 잡을 수 있다. 비어 있으면 아무것도 선택되지 않은 상태. */
  selection: SelectedElement[];
  onSelectionChange: (selection: SelectedElement[]) => void;
  onIconChange: (uid: string, attrs: Partial<PlacedIcon>) => void;
  onTextChange: (id: string, attrs: Partial<TextField>) => void;
  onDelete: () => void;
  /** Moves the selected element one place forward/backward in the shared z-order. */
  onMoveLayer: (move: 'forward' | 'backward') => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  /** false = view-only (confirmed orders): no drag/select/edit affordances at all. */
  interactive?: boolean;
}

function IconNode({
  icon,
  isSelected,
  interactive,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragStop,
}: {
  icon: PlacedIcon;
  isSelected: boolean;
  interactive: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (attrs: Partial<PlacedIcon>) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragStop: () => void;
}) {
  const isPhoto = !isLibraryIcon(icon.iconId);
  const baseSrc = isPhoto ? icon.src : (getIconSrc(icon.iconId) ?? icon.src);
  const [tinted, setTinted] = useState<string | null>(null);

  // 색을 고른 단색 아이콘은 칠한 그림으로 바꿔 그린다. 내보내기는 캔버스에 올라간 이미지를
  // 그대로 읽으므로 인쇄물과 SVG에도 같은 색이 나간다.
  useEffect(() => {
    if (!icon.color || !isRecolorableIcon(icon.iconId)) {
      setTinted(null);
      return;
    }
    let cancelled = false;
    tintImage(baseSrc, icon.color)
      .then((uri) => {
        if (!cancelled) setTinted(uri);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [icon.color, icon.iconId, baseSrc]);

  // crossOrigin so externally-hosted customer photos don't taint the canvas on export
  const [image] = useImage(tinted ?? baseSrc, 'anonymous');
  return (
    <KonvaImage
      id={icon.uid}
      image={image}
      crop={isPhoto ? icon.crop : undefined}
      x={icon.x}
      y={icon.y}
      width={icon.width}
      height={icon.height}
      rotation={icon.rotation}
      draggable={interactive}
      onClick={interactive ? onSelect : undefined}
      onTap={interactive ? onSelect : undefined}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onDragStop();
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(12, icon.width * scaleX),
          height: Math.max(12, icon.height * scaleY),
          rotation: node.rotation(),
        });
      }}
      opacity={isSelected ? 0.92 : 1}
    />
  );
}

/** Full image dimmed underneath + the current crop shown sharp, with a draggable/resizable crop box on top. */
function CropLayer({
  icon,
  onCommit,
}: {
  icon: PlacedIcon;
  onCommit: (attrs: Partial<PlacedIcon>) => void;
}) {
  const [image] = useImage(icon.src, 'anonymous');
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (rectRef.current && trRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [image]);

  if (!image) return null;
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const crop = icon.crop ?? { x: 0, y: 0, width: naturalWidth, height: naturalHeight };
  const scaleX = icon.width / crop.width;
  const scaleY = icon.height / crop.height;
  const imageX = icon.x - crop.x * scaleX;
  const imageY = icon.y - crop.y * scaleY;
  const imageWidth = naturalWidth * scaleX;
  const imageHeight = naturalHeight * scaleY;

  function commitFromRect() {
    const rect = rectRef.current;
    if (!rect) return;
    const rx = rect.x();
    const ry = rect.y();
    const rw = rect.width() * rect.scaleX();
    const rh = rect.height() * rect.scaleY();
    rect.scaleX(1);
    rect.scaleY(1);
    onCommit({
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      crop: {
        x: (rx - imageX) / scaleX,
        y: (ry - imageY) / scaleY,
        width: rw / scaleX,
        height: rh / scaleY,
      },
    });
  }

  return (
    <>
      <KonvaImage image={image} x={imageX} y={imageY} width={imageWidth} height={imageHeight} opacity={0.35} listening={false} />
      <KonvaImage image={image} x={icon.x} y={icon.y} width={icon.width} height={icon.height} crop={crop} listening={false} />
      <Rect
        ref={rectRef}
        x={icon.x}
        y={icon.y}
        width={icon.width}
        height={icon.height}
        stroke="#fff"
        strokeWidth={1.5}
        dash={[5, 4]}
        draggable
        dragBoundFunc={(pos) => {
          const w = rectRef.current?.width() ?? icon.width;
          const h = rectRef.current?.height() ?? icon.height;
          return {
            x: Math.min(Math.max(pos.x, imageX), imageX + imageWidth - w),
            y: Math.min(Math.max(pos.y, imageY), imageY + imageHeight - h),
          };
        }}
        onDragEnd={commitFromRect}
        onTransformEnd={commitFromRect}
      />
      <Transformer
        ref={trRef}
        rotateEnabled={false}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) return oldBox;
          if (newBox.x < imageX - 0.5 || newBox.y < imageY - 0.5) return oldBox;
          if (newBox.x + newBox.width > imageX + imageWidth + 0.5) return oldBox;
          if (newBox.y + newBox.height > imageY + imageHeight + 0.5) return oldBox;
          return newBox;
        }}
      />
    </>
  );
}

function TextNode({
  field,
  isSelected,
  isEditing,
  interactive,
  onSelect,
  onChange,
  onStartEdit,
  onDragStart,
  onDragMove,
  onDragStop,
}: {
  field: TextField;
  isSelected: boolean;
  isEditing: boolean;
  interactive: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (attrs: Partial<TextField>) => void;
  onStartEdit: () => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragStop: () => void;
}) {
  const textRef = useRef<Konva.Text>(null);
  const [textBox, setTextBox] = useState<{ width: number; height: number } | null>(null);
  // an empty caption would render as a stray black sliver, so the bar only appears with real text
  const hasBackground = !!field.background && field.text.trim() !== '';

  // the caption bar hugs the rendered glyphs, so it can only be sized after Konva has laid the text out
  useEffect(() => {
    if (!hasBackground) {
      setTextBox(null);
      return;
    }
    const measure = () => {
      const node = textRef.current;
      if (!node) return;
      const width = Math.min(node.getTextWidth(), field.width);
      const height = node.height();
      setTextBox((prev) =>
        prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5 ? prev : { width, height },
      );
    };
    measure();
    // web fonts land after the first paint and change the metrics — re-measure once they're ready
    document.fonts?.ready.then(measure).catch(() => {});
  }, [hasBackground, field.text, field.fontSize, field.fontFamily, field.width, field.align, field.letterSpacing, field.fontStyle]);

  const padding = field.backgroundPadding ?? Math.round(field.fontSize * 0.55);
  const barLeft =
    field.align === 'center'
      ? field.x + (field.width - (textBox?.width ?? 0)) / 2
      : field.align === 'right'
        ? field.x + field.width - (textBox?.width ?? 0)
        : field.x;

  return (
    <>
    {hasBackground && textBox && (
      <Rect
        x={barLeft - padding}
        y={field.y - padding * 0.5}
        width={textBox.width + padding * 2}
        height={textBox.height + padding}
        fill={field.background}
        cornerRadius={2}
        opacity={isEditing ? 0 : 1}
        listening={false}
      />
    )}
    <KonvaText
      ref={textRef}
      id={field.id}
      text={field.text}
      x={field.x}
      y={field.y}
      width={field.width}
      fontSize={field.fontSize}
      fontFamily={field.fontFamily}
      fill={field.fill}
      align={field.align}
      letterSpacing={field.letterSpacing ?? 0}
      fontStyle={field.fontStyle ?? 'normal'}
      draggable={interactive}
      opacity={isEditing ? 0 : 1}
      onClick={interactive ? onSelect : undefined}
      onTap={interactive ? onSelect : undefined}
      onDblClick={interactive ? onStartEdit : undefined}
      onDblTap={interactive ? onStartEdit : undefined}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onDragStop();
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(40, field.width * scaleX),
        });
      }}
      shadowColor={isSelected ? '#00000022' : undefined}
    />
    </>
  );
}

/** How close (in canvas px) an element's centre has to get before it snaps to the card's centre. */
const SNAP_DISTANCE = 8;

/**
 * How far above the selection Konva hangs the rotate handle. It has to stay well under the gap
 * `.selection-toolbar` keeps from the selection (32px), or the floating buttons cover the handle
 * and swallow the click — the handle never sticks out further than this offset plus half an
 * anchor, at any rotation, so the two can't meet.
 */
const ROTATE_ANCHOR_OFFSET = 20;

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CanvasEditor({
  width,
  height,
  template,
  icons,
  texts,
  selection,
  onSelectionChange,
  onIconChange,
  onTextChange,
  onDelete,
  onMoveLayer,
  stageRef,
  interactive = true,
}: Props) {
  const trRef = useRef<Konva.Transformer>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  /** 빈 곳에서 끌어 만드는 선택 사각형. 놓는 순간 안에 걸친 요소를 전부 잡는다. */
  const [marquee, setMarquee] = useState<SelectionRect | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  /** 여러 개를 함께 끌 때, 끌리는 요소의 이동량을 나머지에 그대로 옮기기 위한 기준점. */
  const dragOrigin = useRef<{ x: number; y: number; others: Array<{ node: Konva.Node; x: number; y: number }> } | null>(null);

  const selected = selection.length === 1 ? selection[0] : null;
  const idOf = (sel: SelectedElement) => (sel ? (sel.type === 'icon' ? sel.uid : `text:${sel.id}`) : '');
  const selectedIds = new Set(selection.map(idOf));
  const isPicked = (sel: SelectedElement) => selectedIds.has(idOf(sel));

  /** 보조키를 누른 채 누르면 선택에 더하거나 빼고, 그냥 누르면 그것만 남긴다. */
  function pick(sel: SelectedElement, evt: MouseEvent | TouchEvent) {
    const additive = 'ctrlKey' in evt && (evt.ctrlKey || evt.metaKey || evt.shiftKey);
    if (!additive) {
      onSelectionChange([sel]);
      return;
    }
    onSelectionChange(isPicked(sel) ? selection.filter((s) => idOf(s) !== idOf(sel)) : [...selection, sel]);
  }
  const [croppingUid, setCroppingUid] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [guides, setGuides] = useState({ vertical: false, horizontal: false });
  /** 크기·회전을 끄는 동안은 떠 있는 버튼을 숨긴다 — 손잡이 근처에서 알짱거려 잡기 어렵다. */
  const [transforming, setTransforming] = useState(false);

  /**
   * Nudges a dragged element onto the card's centre line when it comes close, and shows the
   * guide while it's held there — centring by eye alone is the fiddliest part of the editor.
   * Uses the node's rendered box so rotated elements snap by what you actually see.
   */
  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const stage = stageRef.current;
    if (!stage || selection.length < 2) {
      dragOrigin.current = null;
      return;
    }
    const others = selection
      .map((sel) => stage.findOne('#' + (sel!.type === 'icon' ? sel!.uid : sel!.id)))
      .filter((n): n is Konva.Node => !!n && n !== node)
      .map((n) => ({ node: n, x: n.x(), y: n.y() }));
    dragOrigin.current = { x: node.x(), y: node.y(), others };
  }

  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    // Konva can emit one more dragmove on the frame after dragend; without this the guide it
    // turns back on never gets cleared and stays painted on the card.
    if (!node.isDragging()) return;
    const layer = node.getLayer();
    if (!layer) return;
    const box = node.getClientRect({ relativeTo: layer });
    const dx = width / 2 - (box.x + box.width / 2);
    const dy = height / 2 - (box.y + box.height / 2);
    const vertical = Math.abs(dx) <= SNAP_DISTANCE;
    const horizontal = Math.abs(dy) <= SNAP_DISTANCE;
    if (vertical) node.x(node.x() + dx);
    if (horizontal) node.y(node.y() + dy);
    setGuides((prev) => (prev.vertical === vertical && prev.horizontal === horizontal ? prev : { vertical, horizontal }));

    // 함께 잡힌 나머지도 같은 만큼 옮겨서 서로의 배치가 흐트러지지 않게 한다
    const origin = dragOrigin.current;
    if (origin) {
      const shiftX = node.x() - origin.x;
      const shiftY = node.y() - origin.y;
      for (const other of origin.others) {
        other.node.x(other.x + shiftX);
        other.node.y(other.y + shiftY);
      }
    }
  }

  function handleDragStop() {
    setGuides((prev) => (prev.vertical || prev.horizontal ? { vertical: false, horizontal: false } : prev));
    // 같이 끌려온 요소들의 최종 위치를 각자 저장한다
    const origin = dragOrigin.current;
    if (origin) {
      for (const other of origin.others) {
        const id = other.node.id();
        if (icons.some((i) => i.uid === id)) onIconChange(id, { x: other.node.x(), y: other.node.y() });
        else onTextChange(id, { x: other.node.x(), y: other.node.y() });
      }
      dragOrigin.current = null;
    }
  }

  // shrink the card to fit narrow (mobile) screens, keeping the canvas at full resolution
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setScale(Math.min(1, w / width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  // Canvas text never triggers a webfont download the way DOM text does, so the faces this page
  // uses are loaded by hand and the stage repainted — otherwise Konva measures and draws a fallback.
  const fontKey = texts.map((t) => t.fontFamily).join('|');
  useEffect(() => {
    let cancelled = false;
    const families = [...new Set(fontKey.split('|').filter(Boolean))];
    loadFonts(families).then(() => {
      if (!cancelled) stageRef.current?.batchDraw();
    });
    return () => {
      cancelled = true;
    };
  }, [fontKey, stageRef]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!interactive || selection.length === 0 || croppingUid || editingTextId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      if (selection.length === 0) setSelectionRect(null);
      return;
    }
    const nodes = selection
      .map((sel) => stage.findOne('#' + (sel!.type === 'icon' ? sel!.uid : sel!.id)))
      .filter((node): node is Konva.Node => !!node);
    tr.nodes(nodes);
    // 떠 있는 버튼을 붙일 자리 — 선택된 것들을 모두 감싸는 사각형
    const boxes = nodes.map((node) => node.getClientRect({ relativeTo: stage }));
    setSelectionRect(
      boxes.length
        ? boxes.reduce((acc, b) => {
            const x = Math.min(acc.x, b.x);
            const y = Math.min(acc.y, b.y);
            return { x, y, width: Math.max(acc.x + acc.width, b.x + b.width) - x, height: Math.max(acc.y + acc.height, b.y + b.height) - y };
          })
        : null,
    );
    tr.getLayer()?.batchDraw();
  }, [selection, icons, texts, stageRef, croppingUid, editingTextId, interactive]);

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]);

  function startEditingText(field: TextField) {
    setCroppingUid(null);
    onSelectionChange([{ type: 'text', id: field.id }]);
    setEditingTextId(field.id);
    setEditingValue(field.text);
  }

  function commitEditingText() {
    if (editingTextId) {
      onTextChange(editingTextId, { text: editingValue });
    }
    setEditingTextId(null);
  }

  function startCropping(icon: PlacedIcon) {
    setEditingTextId(null);
    onSelectionChange([{ type: 'icon', uid: icon.uid }]);
    setCroppingUid(icon.uid);
  }

  const gradientProps = template.backgroundGradient
    ? {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: height },
        fillLinearGradientColorStops: [0, template.backgroundGradient[0], 1, template.backgroundGradient[1]],
      }
    : { fill: template.background };

  const layered = sortByZIndex(icons, texts);

  const selectedIcon = selected?.type === 'icon' ? icons.find((i) => i.uid === selected.uid) : undefined;
  const showColorSwatch = !!selectedIcon && isRecolorableIcon(selectedIcon.iconId);
  const showCropButton = !!selectedIcon && !isLibraryIcon(selectedIcon.iconId);
  const croppingIcon = croppingUid ? icons.find((i) => i.uid === croppingUid) : undefined;
  const editingField = editingTextId ? texts.find((t) => t.id === editingTextId) : undefined;

  return (
    <div className="canvas-viewport" ref={viewportRef} style={{ maxWidth: width, height: height * scale }}>
      <div className="canvas-shell" style={{ width, height, transform: `scale(${scale})` }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={(e) => {
          if (!interactive || e.target !== e.target.getStage()) return;
          onSelectionChange([]);
          setCroppingUid(null);
          const pos = e.target.getStage()?.getPointerPosition();
          if (pos) marqueeStart.current = { x: pos.x, y: pos.y };
        }}
        onMouseMove={(e) => {
          const start = marqueeStart.current;
          if (!start) return;
          const pos = e.target.getStage()?.getPointerPosition();
          if (!pos) return;
          setMarquee({
            x: Math.min(start.x, pos.x),
            y: Math.min(start.y, pos.y),
            width: Math.abs(pos.x - start.x),
            height: Math.abs(pos.y - start.y),
          });
        }}
        onMouseUp={() => {
          const box = marquee;
          marqueeStart.current = null;
          setMarquee(null);
          // 손이 조금 흔들린 정도는 그냥 빈 곳 클릭으로 본다
          if (!box || box.width < 5 || box.height < 5) return;
          const stage = stageRef.current;
          if (!stage) return;
          const overlaps = (id: string) => {
            const node = stage.findOne('#' + id);
            if (!node) return false;
            const r = node.getClientRect({ relativeTo: stage });
            return !(r.x > box.x + box.width || r.x + r.width < box.x || r.y > box.y + box.height || r.y + r.height < box.y);
          };
          const hits: SelectedElement[] = [
            ...icons.filter((i) => overlaps(i.uid)).map((i) => ({ type: 'icon' as const, uid: i.uid })),
            ...texts.filter((t) => t.text.trim() && overlaps(t.id)).map((t) => ({ type: 'text' as const, id: t.id })),
          ];
          if (hits.length) onSelectionChange(hits);
        }}
        onTouchStart={(e) => {
          if (interactive && e.target === e.target.getStage()) {
            onSelectionChange([]);
            setCroppingUid(null);
          }
        }}
      >
        <Layer>
          {/* listening={false}: 배경이 클릭을 먹으면 카드 빈 공간을 눌러도 선택이 안 풀린다 */}
          <Rect x={0} y={0} width={width} height={height} listening={false} {...gradientProps} />
          {layered.map((item) => {
            if (item.kind === 'icon') {
              if (item.data.uid === croppingUid) return null;
              return (
                <IconNode
                  key={item.data.uid}
                  icon={item.data}
                  isSelected={isPicked({ type: 'icon', uid: item.data.uid })}
                  interactive={interactive}
                  onSelect={(e) => pick({ type: 'icon', uid: item.data.uid }, e.evt)}
                  onChange={(attrs) => onIconChange(item.data.uid, attrs)}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragStop={handleDragStop}
                />
              );
            }
            return (
              <TextNode
                key={item.data.id}
                field={item.data}
                isSelected={isPicked({ type: 'text', id: item.data.id })}
                isEditing={editingTextId === item.data.id}
                interactive={interactive}
                onSelect={(e) => pick({ type: 'text', id: item.data.id }, e.evt)}
                onChange={(attrs) => onTextChange(item.data.id, attrs)}
                onStartEdit={() => startEditingText(item.data)}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragStop={handleDragStop}
              />
            );
          })}
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              fill="#aa3bff18"
              stroke="#aa3bff"
              strokeWidth={1}
              listening={false}
            />
          )}
          {guides.vertical && (
            <Line points={[width / 2, 0, width / 2, height]} stroke="#ff3b9a" strokeWidth={1} dash={[5, 4]} listening={false} />
          )}
          {guides.horizontal && (
            <Line points={[0, height / 2, width, height / 2]} stroke="#ff3b9a" strokeWidth={1} dash={[5, 4]} listening={false} />
          )}
          {interactive && (
            <Transformer
              ref={trRef}
              rotateEnabled
              rotateAnchorOffset={ROTATE_ANCHOR_OFFSET}
              flipEnabled={false}
              onTransformStart={() => setTransforming(true)}
              onTransformEnd={() => setTransforming(false)}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 12 || newBox.height < 12 ? oldBox : newBox)}
            />
          )}
          {interactive && croppingIcon && <CropLayer icon={croppingIcon} onCommit={(attrs) => onIconChange(croppingIcon.uid, attrs)} />}
        </Layer>
      </Stage>
      </div>

      {interactive && editingField && (
        <textarea
          ref={textareaRef}
          className="text-edit-overlay"
          style={{
            left: editingField.x * scale,
            top: editingField.y * scale,
            width: editingField.width * scale,
            minHeight: (selectionRect?.height ?? editingField.fontSize * 1.4) * scale,
            fontSize: editingField.fontSize * scale,
            fontFamily: editingField.fontFamily,
            color: editingField.fill,
            textAlign: editingField.align,
          }}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={commitEditingText}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingTextId(null);
            }
          }}
        />
      )}

      {interactive && croppingIcon && (
        <div
          className="selection-toolbar crop-toolbar"
          style={{ left: (croppingIcon.x + croppingIcon.width) * scale, top: croppingIcon.y * scale }}
        >
          <button className="selection-delete-btn crop-done-btn" title="자르기 완료" onClick={() => setCroppingUid(null)}>
            ✓
          </button>
        </div>
      )}

      {interactive && !transforming && !croppingIcon && !editingField && selectionRect && selected && (
        <div
          className="selection-toolbar"
          style={{
            left: (selectionRect.x + selectionRect.width) * scale,
            top: selectionRect.y * scale,
          }}
        >
          {showColorSwatch && selectedIcon && (
            <label
              className="selection-color-swatch"
              style={{ background: selectedIcon.color ?? getIconDefaultColor(selectedIcon.iconId) }}
              title="아이콘 색상 변경"
            >
              <input
                type="color"
                value={selectedIcon.color ?? getIconDefaultColor(selectedIcon.iconId) ?? '#000000'}
                onChange={(e) => onIconChange(selectedIcon.uid, { color: e.target.value })}
              />
            </label>
          )}
          {showCropButton && selectedIcon && (
            <button className="selection-crop-btn" title="사진 자르기" onClick={() => startCropping(selectedIcon)}>
              ⤢
            </button>
          )}
          <button className="selection-layer-btn" title="앞으로 가져오기" onClick={() => onMoveLayer('forward')}>
            ▲
          </button>
          <button className="selection-layer-btn" title="뒤로 보내기" onClick={() => onMoveLayer('backward')}>
            ▼
          </button>
          <button className="selection-delete-btn" title="삭제" onClick={onDelete}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
