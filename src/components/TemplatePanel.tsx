import { FRONT_TEMPLATES } from '../data/frontTemplates';
import { getIconDef } from '../data/icons';
import Panel from './Panel';

interface Props {
  /** 앞면에 템플릿 아이콘을 얹는다. 지금 꾸며 둔 것은 그대로 두고 위에 더한다. */
  onApply: (templateId: string) => void;
}

export default function TemplatePanel({ onApply }: Props) {
  return (
    <Panel title="템플릿">
      <p className="hint">
        미리 만들어 둔 아이콘 세트를 앞면에 얹어요. 지금 꾸민 건 그대로 두고 위에 더해지고,
        얹은 뒤에도 하나씩 옮기거나 지울 수 있어요.
      </p>
      <div className="template-list">
        {FRONT_TEMPLATES.map((t) => (
          <div key={t.id} className="template-card">
            <div className="template-preview">
              {t.spots.map((spot, i) => {
                const def = getIconDef(spot.iconId);
                if (!def) return null;
                return (
                  <img
                    key={`${spot.iconId}-${i}`}
                    src={spot.color ? def.getSrc(spot.color) : def.src}
                    alt=""
                    draggable={false}
                    style={{
                      left: `${spot.x * 100}%`,
                      top: `${spot.y * 100}%`,
                      width: `${spot.width * 100}%`,
                    }}
                  />
                );
              })}
            </div>
            <div className="template-card-body">
              <strong>{t.label}</strong>
              <span>{t.note}</span>
              <button className="secondary full-width" onClick={() => onApply(t.id)}>
                앞면에 얹기
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
