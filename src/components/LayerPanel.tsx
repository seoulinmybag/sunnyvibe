import { getIconDef, isLibraryIcon } from '../data/icons';
import { sortByZIndex } from '../lib/layering';
import type { PlacedIcon, SelectedElement, TextField } from '../types';
import Panel from './Panel';

/** Which way a layer moves. 'forward'/'backward' step one place; 'front'/'back' jump to the end. */
export type LayerMove = 'forward' | 'backward' | 'front' | 'back';

export type LayerTarget = { type: 'icon'; uid: string } | { type: 'text'; id: string };

interface Props {
  icons: PlacedIcon[];
  texts: TextField[];
  /** 함께 잡힌 것들. 목록에서도 전부 표시해야 무엇이 같이 움직일지 보인다. */
  selection: SelectedElement[];
  onSelect: (sel: SelectedElement, additive: boolean) => void;
  onMove: (target: LayerTarget, move: LayerMove) => void;
}

/** Friendly names for the placed images that aren't library icons. */
const PHOTO_LABELS: Record<string, string> = {
  'main-photo': '신랑신부 사진',
  'customer-photo': '신랑신부 사진',
  'layout-map': '약도',
  'layout-qr': 'QR 코드',
};

function iconLabel(icon: PlacedIcon): string {
  if (isLibraryIcon(icon.iconId)) return getIconDef(icon.iconId)?.label ?? '아이콘';
  return PHOTO_LABELS[icon.uid] ?? PHOTO_LABELS[icon.iconId] ?? '사진';
}

function textPreview(field: TextField): string {
  const firstLine = field.text.split('\n')[0].trim();
  if (!firstLine) return '(비어 있음)';
  return firstLine.length > 14 ? `${firstLine.slice(0, 14)}…` : firstLine;
}

export default function LayerPanel({ icons, texts, selection, onSelect, onMove }: Props) {
  // sortByZIndex is back-to-front; the list reads front-to-back like every other layer UI
  const items = sortByZIndex(icons, texts).reverse();

  return (
    <Panel title="레이어" defaultOpen={false}>
      <p className="hint layer-hint">
        목록 위에 있을수록 앞에 보여요. 화살표로 순서를 바꾸고, ⌘(Ctrl)을 누른 채 누르면 여러 개를 함께 잡을 수 있어요.
      </p>
      <ul className="layer-list">
        {items.map((item, i) => {
          const target: LayerTarget =
            item.kind === 'icon' ? { type: 'icon', uid: item.data.uid } : { type: 'text', id: item.data.id };
          const isSelected = selection.some((sel) =>
            !sel ? false : sel.type === 'icon' ? sel.uid === (target as { uid?: string }).uid : sel.id === (target as { id?: string }).id,
          );
          return (
            <li key={item.kind === 'icon' ? item.data.uid : `text-${item.data.id}`} className={'layer-row' + (isSelected ? ' layer-row-active' : '')}>
              <button
                className="layer-pick"
                onClick={(e) => onSelect(target, e.ctrlKey || e.metaKey || e.shiftKey)}
              >
                {item.kind === 'icon' ? (
                  <img src={item.data.src} alt="" draggable={false} />
                ) : (
                  <span className="layer-text-badge">T</span>
                )}
                <span className="layer-name">
                  {item.kind === 'icon' ? iconLabel(item.data) : item.data.label}
                  {item.kind === 'text' && <em>{textPreview(item.data)}</em>}
                </span>
              </button>
              <span className="layer-move">
                <button title="앞으로" disabled={i === 0} onClick={() => onMove(target, 'forward')}>
                  ▲
                </button>
                <button title="뒤로" disabled={i === items.length - 1} onClick={() => onMove(target, 'backward')}>
                  ▼
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
