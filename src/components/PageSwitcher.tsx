import type { Side } from '../types';

interface Props {
  side: Side;
  onChange: (side: Side) => void;
}

export default function PageSwitcher({ side, onChange }: Props) {
  return (
    <div className="page-switcher">
      <button className={'page-switcher-btn' + (side === 'front' ? ' page-switcher-active' : '')} onClick={() => onChange('front')}>
        앞
      </button>
      <button className={'page-switcher-btn' + (side === 'back' ? ' page-switcher-active' : '')} onClick={() => onChange('back')}>
        뒤
      </button>
    </div>
  );
}
