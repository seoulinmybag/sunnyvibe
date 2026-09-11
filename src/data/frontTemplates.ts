/**
 * 앞면에 통째로 얹는 아이콘 세트. 배치는 카드 크기에 대한 **비율**로 적어 둔다 —
 * 규격이 늘어나도 같은 자리에 앉고, 레퍼런스 이미지를 그대로 옮겨 적을 수 있다.
 *
 * 자막·사진·이름은 템플릿에 넣지 않는다. 그건 주문마다 다르게 들어가는 자리고,
 * 얹을 때 글자(이름·생년월일·자막)가 전부 템플릿 위로 올라오도록 z를 맞춘다
 * (Editor의 handleApplyTemplate).
 */
export interface TemplateSpot {
  /** 카탈로그 아이콘 id (= 파일 slug). */
  iconId: string;
  /** 왼쪽 위 모서리. x는 가로폭, y는 세로높이에 대한 비율. */
  x: number;
  y: number;
  /** 가로폭에 대한 너비 비율. 높이는 아이콘 원본 비율대로 따라온다. */
  width: number;
  /** 색을 바꿀 수 있는 아이콘(꾸미기 테마)에만 의미가 있다. */
  color?: string;
}

export interface FrontTemplate {
  id: string;
  label: string;
  /** 패널에 한 줄로 붙는 설명. */
  note: string;
  spots: TemplateSpot[];
}

export const FRONT_TEMPLATES: FrontTemplate[] = [
  {
    id: 'kkokkoma',
    label: '꼬꼬마',
    // 좌표는 레퍼런스(꼬꼬마.png, 1889×1299 = 16:11)에서 아이콘마다 잉크 덩어리의
    // 경계 상자를 재서 그대로 비율로 옮긴 값이다. 사진이 앉는 가운데는 비어 있다.
    note: '추억 아이콘 8개로 네 귀퉁이를 감싸요.',
    spots: [
      { iconId: 'retro-25', x: 0.018, y: 0.029, width: 0.118 }, // 떡꼬치
      { iconId: 'retro-14', x: 0.219, y: 0.041, width: 0.075 }, // 롤러스케이트
      { iconId: 'retro-11', x: 0.647, y: 0.059, width: 0.085 }, // 자물쇠일기장
      { iconId: 'retro-07', x: 0.828, y: 0.156, width: 0.138 }, // 종이딱지
      { iconId: 'retro-01', x: 0.121, y: 0.227, width: 0.116 }, // 다마고찌
      { iconId: 'retro-04', x: 0.731, y: 0.3, width: 0.076 }, // 달고나
      { iconId: 'retro-05', x: 0.781, y: 0.724, width: 0.134 }, // 공깃돌
      { iconId: 'retro-19', x: 0.048, y: 0.76, width: 0.121 }, // 비눗방울
    ],
  },
  {
    id: 'flower-field',
    label: '꽃밭',
    // 꾸미기 테마의 꽃 하나를 색만 바꿔 흩뿌린다. 가운데(사진)와 아래 가운데(자막)는 비운다.
    note: '파스텔 꽃 11송이를 테두리에 흩뿌려요.',
    spots: [
      { iconId: 'flower-04', x: 0.076, y: 0.056, width: 0.11, color: '#f0906a' },
      { iconId: 'flower-04', x: 0.315, y: 0.028, width: 0.11, color: '#f5cf5e' },
      { iconId: 'flower-04', x: 0.542, y: 0.046, width: 0.11, color: '#7fd4e8' },
      { iconId: 'flower-04', x: 0.84, y: 0.028, width: 0.11, color: '#7fddb4' },
      { iconId: 'flower-04', x: 0.729, y: 0.222, width: 0.072, color: '#f5d76e' },
      { iconId: 'flower-04', x: 0.218, y: 0.287, width: 0.072, color: '#f2a0c8' },
      { iconId: 'flower-04', x: 0.84, y: 0.3, width: 0.11, color: '#b98fe0' },
      { iconId: 'flower-04', x: 0.044, y: 0.46, width: 0.11, color: '#b9dd8a' },
      { iconId: 'flower-04', x: 0.063, y: 0.723, width: 0.11, color: '#9aa4e8' },
      { iconId: 'flower-04', x: 0.769, y: 0.668, width: 0.11, color: '#f2a0b8' },
      { iconId: 'flower-04', x: 0.865, y: 0.808, width: 0.11, color: '#a8dd8a' },
    ],
  },
];
