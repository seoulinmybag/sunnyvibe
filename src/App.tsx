import { useState } from 'react';
import Editor from './components/Editor';
import { TEMPLATES } from './data/templates';
import { ORIENTATIONS } from './data/orientation';
import type { Orientation, PageState, PlacedIcon, Side, TextField } from './types';

const INITIAL_TEMPLATE = TEMPLATES[0]; // 화이트

// when a customer photo is preloaded, text is laid out around it (greeting above, details below)
// instead of overlapping the photo in the middle of the card
const PHOTO_LAYOUT = { photoY: 0.1, photoHeight: 0.42, messageY: 0.03, namesY: 0.58, dateY: 0.65, venueY: 0.7 };
const PLAIN_LAYOUT = { messageY: 0.1, namesY: 0.5, dateY: 0.585, venueY: 0.63 };

function initialTexts(width: number, height: number, fill: string, hasPhoto: boolean): TextField[] {
  const fieldWidth = width * 0.82;
  const x = (width - fieldWidth) / 2;
  const layout = hasPhoto ? PHOTO_LAYOUT : PLAIN_LAYOUT;
  return [
    { id: 'message', label: '인사말', x, y: height * layout.messageY, width: fieldWidth, text: '저희 두 사람, 사랑으로 하나 되어\n평생을 함께하고자 합니다.', fontSize: 20, fontFamily: "'Noto Serif KR', serif", fill, align: 'center', zIndex: 1 },
    { id: 'names', label: '신랑 · 신부', x, y: height * layout.namesY, width: fieldWidth, text: '김철수 · 이영희', fontSize: 34, fontFamily: "'Noto Serif KR', serif", fill, align: 'center', zIndex: 2 },
    { id: 'date', label: '날짜', x, y: height * layout.dateY, width: fieldWidth, text: '2026년 10월 10일 토요일 오후 1시', fontSize: 20, fontFamily: "'Noto Serif KR', serif", fill, align: 'center', zIndex: 3 },
    { id: 'venue', label: '장소', x, y: height * layout.venueY, width: fieldWidth, text: 'OO웨딩홀 3층 그랜드홀', fontSize: 18, fontFamily: "'Noto Serif KR', serif", fill, align: 'center', zIndex: 4 },
  ];
}

function makePage(orientation: Orientation, photoUrl: string | null): PageState {
  const s = ORIENTATIONS[orientation];
  const icons: PlacedIcon[] = [];
  if (photoUrl) {
    const width = s.displayWidth * 0.82;
    const x = (s.displayWidth - width) / 2;
    const height = s.displayHeight * PHOTO_LAYOUT.photoHeight;
    icons.push({
      uid: 'customer-photo',
      iconId: 'customer-photo',
      src: photoUrl,
      x,
      y: s.displayHeight * PHOTO_LAYOUT.photoY,
      width,
      height,
      rotation: 0,
      zIndex: 0,
    });
  }
  return {
    icons,
    texts: initialTexts(s.displayWidth, s.displayHeight, INITIAL_TEMPLATE.textColorDefault, !!photoUrl),
    templateId: INITIAL_TEMPLATE.id,
    customColor: null,
  };
}

function readInitParams(): { orientation: Orientation; photo: string | null } {
  const params = new URLSearchParams(window.location.search);
  const o = params.get('orientation');
  const orientation: Orientation = o === 'landscape' || o === 'portrait' ? o : 'portrait';
  return { orientation, photo: params.get('photo') };
}

/** The `/` playground: no persistence, no sharing — just a scratch canvas. Real orders live under /order/:id. */
export default function App() {
  const [initParams] = useState(readInitParams);
  const [initialPages] = useState<Record<Side, PageState>>(() => ({
    front: makePage(initParams.orientation, initParams.photo),
    back: makePage(initParams.orientation, null),
  }));

  return <Editor orientation={initParams.orientation} initialPages={initialPages} showCustomerLinkPanel />;
}
