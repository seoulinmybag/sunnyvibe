import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import { getIconDefaultColor, getIconSrc, isLibraryIcon } from '../data/icons';
import type { PlacedIcon, TextField, Template, SelectedElement } from '../types';

interface Props {
  width: number;
  height: number;
  template: Template;
  icons: PlacedIcon[];
  texts: TextField[];
  selected: SelectedElement;
  onSelect: (sel: SelectedElement) => void;
  onIconChange: (uid: string, attrs: Partial<PlacedIcon>) => void;
  onTextChange: (id: string, attrs: Partial<TextField>) => void;
  onDelete: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

function IconNode({
  icon,
  isSelected,
  onSelect,
  onChange,
  onStartCrop,
}: {
  icon: PlacedIcon;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<PlacedIcon>) => void;
  onStartCrop: () => void;
}) {
  const isPhoto = !isLibraryIcon(icon.iconId);
  const effectiveSrc = isPhoto ? icon.src : (getIconSrc(icon.iconId, icon.color) ?? icon.src);
  // crossOrigin so externally-hosted customer photos don't taint the canvas on export
  const [image] = useImage(effectiveSrc, 'anonymous');
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
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={isPhoto ? onStartCrop : undefined}
      onDblTap={isPhoto ? onStartCrop : undefined}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
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
  onSelect,
  onChange,
  onStartEdit,
}: {
  field: TextField;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<TextField>) => void;
  onStartEdit: () => void;
}) {
  return (
    <KonvaText
      id={field.id}
      text={field.text}
      x={field.x}
      y={field.y}
      width={field.width}
      fontSize={field.fontSize}
      fontFamily={field.fontFamily}
      fill={field.fill}
      align={field.align}
      draggable
      opacity={isEditing ? 0 : 1}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onStartEdit}
      onDblTap={onStartEdit}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
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
  );
}

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
  selected,
  onSelect,
  onIconChange,
  onTextChange,
  onDelete,
  stageRef,
}: Props) {
  const trRef = useRef<Konva.Transformer>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [croppingUid, setCroppingUid] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selected || croppingUid || editingTextId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      if (!selected) setSelectionRect(null);
      return;
    }
    const id = selected.type === 'icon' ? selected.uid : selected.id;
    const node = stage.findOne('#' + id);
    if (node) {
      tr.nodes([node]);
      setSelectionRect(node.getClientRect({ relativeTo: stage }));
    } else {
      tr.nodes([]);
      setSelectionRect(null);
    }
    tr.getLayer()?.batchDraw();
  }, [selected, icons, texts, stageRef, croppingUid, editingTextId]);

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]);

  function startEditingText(field: TextField) {
    setCroppingUid(null);
    onSelect({ type: 'text', id: field.id });
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
    onSelect({ type: 'icon', uid: icon.uid });
    setCroppingUid(icon.uid);
  }

  const gradientProps = template.backgroundGradient
    ? {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: height },
        fillLinearGradientColorStops: [0, template.backgroundGradient[0], 1, template.backgroundGradient[1]],
      }
    : { fill: template.background };

  // icons and texts share one z-order so "앞으로/뒤로" and photo-behind-text placement work correctly
  const layered: Array<{ zIndex: number } & ({ kind: 'icon'; data: PlacedIcon } | { kind: 'text'; data: TextField })> = [
    ...icons.map((data) => ({ kind: 'icon' as const, data, zIndex: data.zIndex })),
    ...texts.map((data) => ({ kind: 'text' as const, data, zIndex: data.zIndex })),
  ].sort((a, b) => a.zIndex - b.zIndex);

  const selectedIcon = selected?.type === 'icon' ? icons.find((i) => i.uid === selected.uid) : undefined;
  const showColorSwatch = !!selectedIcon && isLibraryIcon(selectedIcon.iconId);
  const showCropButton = !!selectedIcon && !isLibraryIcon(selectedIcon.iconId);
  const croppingIcon = croppingUid ? icons.find((i) => i.uid === croppingUid) : undefined;
  const editingField = editingTextId ? texts.find((t) => t.id === editingTextId) : undefined;

  return (
    <div className="canvas-shell">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            onSelect(null);
            setCroppingUid(null);
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) {
            onSelect(null);
            setCroppingUid(null);
          }
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={width} height={height} {...gradientProps} />
          {layered.map((item) => {
            if (item.kind === 'icon') {
              if (item.data.uid === croppingUid) return null;
              return (
                <IconNode
                  key={item.data.uid}
                  icon={item.data}
                  isSelected={selected?.type === 'icon' && selected.uid === item.data.uid}
                  onSelect={() => onSelect({ type: 'icon', uid: item.data.uid })}
                  onChange={(attrs) => onIconChange(item.data.uid, attrs)}
                  onStartCrop={() => startCropping(item.data)}
                />
              );
            }
            return (
              <TextNode
                key={item.data.id}
                field={item.data}
                isSelected={selected?.type === 'text' && selected.id === item.data.id}
                isEditing={editingTextId === item.data.id}
                onSelect={() => onSelect({ type: 'text', id: item.data.id })}
                onChange={(attrs) => onTextChange(item.data.id, attrs)}
                onStartEdit={() => startEditingText(item.data)}
              />
            );
          })}
          <Transformer
            ref={trRef}
            rotateEnabled
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 12 || newBox.height < 12 ? oldBox : newBox)}
          />
          {croppingIcon && <CropLayer icon={croppingIcon} onCommit={(attrs) => onIconChange(croppingIcon.uid, attrs)} />}
        </Layer>
      </Stage>

      {editingField && (
        <textarea
          ref={textareaRef}
          className="text-edit-overlay"
          style={{
            left: editingField.x,
            top: editingField.y,
            width: editingField.width,
            minHeight: selectionRect?.height ?? editingField.fontSize * 1.4,
            fontSize: editingField.fontSize,
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

      {croppingIcon && (
        <div
          className="selection-toolbar crop-toolbar"
          style={{ left: croppingIcon.x + croppingIcon.width, top: croppingIcon.y }}
        >
          <button className="selection-delete-btn crop-done-btn" title="자르기 완료" onClick={() => setCroppingUid(null)}>
            ✓
          </button>
        </div>
      )}

      {!croppingIcon && !editingField && selectionRect && selected && (
        <div
          className="selection-toolbar"
          style={{
            left: selectionRect.x + selectionRect.width,
            top: selectionRect.y,
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
          <button className="selection-delete-btn" title="삭제" onClick={onDelete}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
