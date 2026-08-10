import type { SelectedElement, TextField } from '../types';

interface Props {
  texts: TextField[];
  selected: SelectedElement;
  onChange: (id: string, attrs: Partial<TextField>) => void;
  onSelect: (sel: SelectedElement) => void;
}

const FONT_OPTIONS = [
  { value: "'Noto Serif KR', serif", label: '명조 (세리프)' },
  { value: "'Pretendard', system-ui, sans-serif", label: '고딕 (산세리프)' },
  { value: "cursive", label: '손글씨체' },
];

export default function TextFieldsPanel({ texts, selected, onChange, onSelect }: Props) {
  const selectedField =
    selected?.type === 'text' ? texts.find((t) => t.id === selected.id) : undefined;

  return (
    <div className="panel">
      <h3 className="panel-title">청첩장 문구</h3>
      <div className="text-field-list">
        {texts.map((f) => (
          <label key={f.id} className={'text-field-item' + (selectedField?.id === f.id ? ' text-field-active' : '')}>
            <span className="text-field-label">{f.label}</span>
            <textarea
              value={f.text}
              rows={f.id === 'message' ? 3 : 1}
              onFocus={() => onSelect({ type: 'text', id: f.id })}
              onChange={(e) => onChange(f.id, { text: e.target.value })}
            />
          </label>
        ))}
      </div>

      {selectedField && (
        <div className="text-style-controls">
          <h4>선택한 문구 스타일 · {selectedField.label}</h4>
          <div className="style-row">
            <label>
              글자 크기
              <input
                type="range"
                min={12}
                max={64}
                value={selectedField.fontSize}
                onChange={(e) => onChange(selectedField.id, { fontSize: Number(e.target.value) })}
              />
              <span>{selectedField.fontSize}px</span>
            </label>
          </div>
          <div className="style-row">
            <label>
              색상
              <input
                type="color"
                value={selectedField.fill}
                onChange={(e) => onChange(selectedField.id, { fill: e.target.value })}
              />
            </label>
            <label>
              폰트
              <select
                value={selectedField.fontFamily}
                onChange={(e) => onChange(selectedField.id, { fontFamily: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="style-row align-row">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                className={'align-btn' + (selectedField.align === a ? ' align-active' : '')}
                onClick={() => onChange(selectedField.id, { align: a })}
              >
                {a === 'left' ? '왼쪽' : a === 'center' ? '가운데' : '오른쪽'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
