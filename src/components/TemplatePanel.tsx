import { useEffect, useState, type CSSProperties } from 'react';
import { FRONT_TEMPLATES } from '../data/frontTemplates';
import { getIconDef } from '../data/icons';
import { tintImage } from '../lib/tint';
import Panel from './Panel';

interface Props {
  /** 지금 보고 있는 면에 요소가 남아 있는 템플릿 — 적용 취소 버튼을 켤지 정한다. */
  appliedIds: ReadonlySet<string>;
  /** 지금 보고 있는 면에 템플릿 아이콘을 얹는다. 꾸며 둔 것은 그대로 두고 위에 더한다. */
  onApply: (templateId: string) => void;
  /** 지금 보고 있는 면에서 그 템플릿이 얹은 아이콘을 모두 걷어 낸다. */
  onRemove: (templateId: string) => void;
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

export default function TemplatePanel({ appliedIds, onApply, onRemove }: Props) {
  return (
    <Panel title="템플릿">
      <p className="hint">
        지금 보고 있는 면에 아이콘 세트를 얹어요. 꾸민 건 그대로 두고 위에 더해지고,
        적용 취소를 누르면 그 세트만 한 번에 빠져요.
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
            <div className="template-actions">
              <button className="secondary" onClick={() => onApply(t.id)}>
                적용
              </button>
              <button className="secondary" disabled={!appliedIds.has(t.id)} onClick={() => onRemove(t.id)}>
                적용 취소
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
