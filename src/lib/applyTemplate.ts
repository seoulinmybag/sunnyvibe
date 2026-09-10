import { getIconDef } from '../data/icons';
import type { FrontTemplate } from '../data/frontTemplates';
import type { PlacedIcon } from '../types';

/**
 * 템플릿을 **낱개 아이콘**으로 펼친다. 통이미지를 한 장 얹는 게 아니라서 얹은 뒤에도
 * 고객이 하나씩 옮기고 지우고 색을 바꿀 수 있다. 기존 요소는 건드리지 않고, z는 전부
 * 위쪽(zFrom부터)으로 줘서 지금까지 꾸민 것 위에 앉는다.
 */
export function templateIcons(
  template: FrontTemplate,
  cardWidth: number,
  cardHeight: number,
  uidPrefix: string,
  zFrom: number,
): PlacedIcon[] {
  return template.spots.flatMap((spot, i) => {
    const def = getIconDef(spot.iconId);
    if (!def) return []; // 카탈로그에서 아이콘을 빼면 그 자리만 조용히 건너뛴다
    const width = spot.width * cardWidth;
    const height = width * (def.naturalHeight / def.naturalWidth);
    return [
      {
        uid: `${uidPrefix}-${i}`,
        iconId: spot.iconId,
        src: def.src,
        x: spot.x * cardWidth,
        y: spot.y * cardHeight,
        width,
        height,
        rotation: 0,
        zIndex: zFrom + i,
      },
    ];
  });
}
