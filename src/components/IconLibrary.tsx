import { useState } from 'react';
import { ICONS, ICON_CATEGORIES, iconsByCategory } from '../data/icons';

interface Props {
  onAddIcon: (iconId: string) => void;
}

export default function IconLibrary({ onAddIcon }: Props) {
  const [category, setCategory] = useState<string>(ICON_CATEGORIES[0]);
  const items = iconsByCategory(category);

  return (
    <div className="panel">
      <h3 className="panel-title">꾸미기</h3>
      <div className="tab-row">
        {ICON_CATEGORIES.map((c) => (
          <button
            key={c}
            className={'tab' + (c === category ? ' tab-active' : '')}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="icon-grid">
        {items.map((icon) => (
          <button
            key={icon.id}
            className="icon-tile"
            title={icon.label}
            onClick={() => onAddIcon(icon.id)}
          >
            <img src={icon.src} alt={icon.label} draggable={false} />
            <span>{icon.label}</span>
          </button>
        ))}
      </div>
      <p className="hint">아이콘을 클릭하면 청첩장 중앙에 추가돼요. 총 {ICONS.length}개 (임시 아이콘)</p>
    </div>
  );
}
