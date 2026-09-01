import { sideLabel } from '../types';
import type { PanelType, Side } from '../types';

interface Props {
  sides: Side[];
  side: Side;
  panelType: PanelType;
  onChange: (side: Side) => void;
}

export default function PageSwitcher({ sides, side, panelType, onChange }: Props) {
  return (
    <div className="page-switcher">
      {sides.map((s) => (
        <button
          key={s}
          className={'page-switcher-btn' + (side === s ? ' page-switcher-active' : '')}
          onClick={() => onChange(s)}
        >
          {sideLabel(s, panelType)}
        </button>
      ))}
    </div>
  );
}
