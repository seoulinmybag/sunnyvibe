/**
 * 앞면에 통째로 얹는 아이콘 세트. 배치는 카드 크기에 대한 **비율**로 적어 둔다 —
 * 규격이 늘어나도 같은 자리에 앉고, 레퍼런스 이미지를 그대로 옮겨 적을 수 있다.
 */
export interface TemplateSpot {
  /** 카탈로그 아이콘 id (= 파일 slug). */
  iconId: string;
  /** 왼쪽 위 모서리. x는 가로폭, y는 세로높이에 대한 비율. */
  x: number;
  y: number;
  /** 가로폭에 대한 너비 비율. 높이는 아이콘 원본 비율대로 따라온다. */
  width: number;
}

export interface FrontTemplate {
  id: string;
  label: string;
  /** 패널에 한 줄로 붙는 설명. */
  note: string;
  spots: TemplateSpot[];
}

/**
 * 좌표는 레퍼런스 이미지(가로 16:11)를 그대로 비율로 옮긴 값이다. 사진·이름·생년월일이
 * 앉는 가운데와 아래 가운데는 비워 두고 네 귀퉁이만 감싼다.
 */
export const FRONT_TEMPLATES: FrontTemplate[] = [
  {
    id: 'retro-schoolyard',
    label: '추억의 문방구',
    note: '떡꼬치 · 다마고찌 · 종이딱지 — 추억 아이콘 8개로 네 귀퉁이를 감싸요.',
    spots: [
      { iconId: 'retro-25', x: 0.016, y: 0.027, width: 0.119 }, // 떡꼬치 — 왼쪽 위
      { iconId: 'retro-14', x: 0.211, y: 0.035, width: 0.089 }, // 롤러스케이트
      { iconId: 'retro-01', x: 0.113, y: 0.219, width: 0.124 }, // 다마고찌
      { iconId: 'retro-11', x: 0.645, y: 0.065, width: 0.089 }, // 자물쇠일기장 — 오른쪽 위
      { iconId: 'retro-07', x: 0.821, y: 0.142, width: 0.14 }, // 종이딱지
      { iconId: 'retro-04', x: 0.724, y: 0.296, width: 0.076 }, // 달고나
      { iconId: 'retro-19', x: 0.045, y: 0.785, width: 0.123 }, // 비눗방울 — 왼쪽 아래
      { iconId: 'retro-05', x: 0.779, y: 0.723, width: 0.138 }, // 공깃돌 — 오른쪽 아래
    ],
  },
];
