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
}: {
  icon: PlacedIcon;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<PlacedIcon>) => void;
}) {
  const effectiveSrc = isLibraryIcon(icon.iconId) ? (getIconSrc(icon.iconId, icon.color) ?? icon.src) : icon.src;
  // crossOrigin so externally-hosted customer photos don't taint the canvas on export
  const [image] = useImage(effectiveSrc, 'anonymous');
  return (
    <KonvaImage
      id={icon.uid}
      image={image}
      x={icon.x}
      y={icon.y}
      width={icon.width}
      height={icon.height}
      rotation={icon.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
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

function TextNode({
  field,
  isSelected,
  onSelect,
  onChange,
}: {
  field: TextField;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<TextField>) => void;
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
      onClick={onSelect}
      onTap={onSelect}
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

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selected) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      setSelectionRect(null);
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
  }, [selected, icons, texts, stageRef]);

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

  return (
    <div className="canvas-shell">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={width} height={height} {...gradientProps} />
          {layered.map((item) =>
            item.kind === 'icon' ? (
              <IconNode
                key={item.data.uid}
                icon={item.data}
                isSelected={selected?.type === 'icon' && selected.uid === item.data.uid}
                onSelect={() => onSelect({ type: 'icon', uid: item.data.uid })}
                onChange={(attrs) => onIconChange(item.data.uid, attrs)}
              />
            ) : (
              <TextNode
                key={item.data.id}
                field={item.data}
                isSelected={selected?.type === 'text' && selected.id === item.data.id}
                onSelect={() => onSelect({ type: 'text', id: item.data.id })}
                onChange={(attrs) => onTextChange(item.data.id, attrs)}
              />
            ),
          )}
          <Transformer
            ref={trRef}
            rotateEnabled
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 12 || newBox.height < 12 ? oldBox : newBox)}
          />
        </Layer>
      </Stage>

      {selectionRect && selected && (
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
          <button className="selection-delete-btn" title="삭제" onClick={onDelete}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
