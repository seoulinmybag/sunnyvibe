import { useState } from 'react';
import { ICON_CATEGORIES, iconsByCategory } from '../data/icons';
import Panel from './Panel';

interface Props {
  onAddIcon: (iconId: string) => void;
}

export default function IconLibrary({ onAddIcon }: Props) {
  const [category, setCategory] = useState<string>(ICON_CATEGORIES[0]);
  const items = iconsByCategory(category);

  return (
    <Panel title="꾸미기">
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
      {/* 숨긴 갈래(국화꽃·보관)는 세지 않는다 */}
      <p className="hint">
        아이콘을 클릭하면 청첩장 중앙에 추가돼요. 총{' '}
        {ICON_CATEGORIES.reduce((sum, category) => sum + iconsByCategory(category).length, 0)}개
      </p>
    </Panel>
  );
}
