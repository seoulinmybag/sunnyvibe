import { TEMPLATES } from '../data/templates';

interface Props {
  templateId: string;
  customColor: string | null;
  onChange: (id: string) => void;
  onCustomColor: (color: string) => void;
}

export default function TemplatePicker({ templateId, customColor, onChange, onCustomColor }: Props) {
  return (
    <div className="panel">
      <h3 className="panel-title">배경 템플릿</h3>
      <div className="template-row">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={'template-swatch' + (!customColor && t.id === templateId ? ' template-active' : '')}
            style={{
              background: t.backgroundGradient
                ? `linear-gradient(180deg, ${t.backgroundGradient[0]}, ${t.backgroundGradient[1]})`
                : t.background,
              border: t.id === 'white' ? '1px solid #e5e4e7' : undefined,
            }}
            title={t.label}
            onClick={() => onChange(t.id)}
          >
            <span style={{ color: t.textColorDefault }}>{t.label}</span>
          </button>
        ))}
        <label
          className={'template-swatch custom-color-swatch' + (customColor ? ' template-active' : '')}
          style={{ background: customColor ?? 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)' }}
          title="커스텀 색상 선택"
        >
          <input
            type="color"
            value={customColor ?? '#ffffff'}
            onChange={(e) => onCustomColor(e.target.value)}
          />
          <span style={{ color: customColor ? '#fff' : '#1a1a1a', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
            커스텀
          </span>
        </label>
      </div>
      <p className="hint">컬러 휠에서 원하는 배경색을 직접 선택할 수 있어요.</p>
    </div>
  );
}
