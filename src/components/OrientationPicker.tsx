import { ORIENTATIONS } from '../data/orientation';
import type { Orientation } from '../types';

interface Props {
  orientation: Orientation;
  onChange: (o: Orientation) => void;
}

export default function OrientationPicker({ orientation, onChange }: Props) {
  return (
    <div className="panel">
      <h3 className="panel-title">청첩장 방향</h3>
      <div className="orientation-row">
        {(Object.values(ORIENTATIONS)).map((spec) => (
          <button
            key={spec.id}
            className={'orientation-btn' + (spec.id === orientation ? ' orientation-active' : '')}
            onClick={() => onChange(spec.id)}
          >
            <span
              className="orientation-swatch"
              style={{
                width: spec.id === 'landscape' ? 28 : 19,
                height: spec.id === 'landscape' ? 19 : 28,
              }}
            />
            <span>
              {spec.label} ({spec.ratioLabel})
            </span>
          </button>
        ))}
      </div>
      <p className="hint">인쇄 규격 16cm × 11cm 기준이에요.</p>
    </div>
  );
}
