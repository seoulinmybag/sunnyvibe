import { useEffect, useState, type CSSProperties } from 'react';
import { FRONT_TEMPLATES } from '../data/frontTemplates';
import { getIconDef } from '../data/icons';
import { tintImage } from '../lib/tint';
import Panel from './Panel';

interface Props {
  /** 앞면에 템플릿 아이콘을 얹는다. 지금 꾸며 둔 것은 그대로 두고 위에 더한다. */
  onApply: (templateId: string) => void;
}

/**
 * 미리보기 한 칸. 색을 지정한 아이콘은 캔버스와 같은 방식(tintImage)으로 칠해서 보여 준다 —
 * 원본 PNG만 띄우면 꽃밭이 전부 기본색(연두)으로 보인다.
 */
function PreviewIcon({ src, color, style }: { src: string; color?: string; style: CSSProperties }) {
  const [tinted, setTinted] = useState<string | null>(null);

  useEffect(() => {
    if (!color) {
      setTinted(null);
      return;
    }
    let cancelled = false;
    tintImage(src, color)
      .then((uri) => {
        if (!cancelled) setTinted(uri);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [src, color]);

  // 칠한 그림이 오기 전에 원본 색이 잠깐 비치지 않게 숨겨 둔다
  const waiting = !!color && !tinted;
  return <img src={tinted ?? src} alt="" draggable={false} style={{ ...style, visibility: waiting ? 'hidden' : undefined }} />;
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
            <div className="template-card-top">
              <div className="template-preview">
                {t.spots.map((spot, i) => {
                  const def = getIconDef(spot.iconId);
                  if (!def) return null;
                  // 캔버스도 색을 바꿀 수 있는 아이콘만 칠하니 같은 조건으로 맞춘다
                  const color = def.recolorable ? spot.color : undefined;
                  return (
                    <PreviewIcon
                      key={`${spot.iconId}-${i}`}
                      src={def.src}
                      color={color}
                      style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, width: `${spot.width * 100}%` }}
                    />
                  );
                })}
              </div>
              <div className="template-card-text">
                <strong>{t.label}</strong>
                <span>{t.note}</span>
              </div>
            </div>
            <button className="secondary full-width" onClick={() => onApply(t.id)}>
              앞면에 얹기
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
