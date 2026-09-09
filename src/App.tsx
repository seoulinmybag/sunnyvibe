import { useState } from 'react';
import Editor from './components/Editor';
import { buildInitialPages } from './lib/layoutGenerator';
import type { Pages } from './types';

/** Sample content for the scratch canvas — the real per-order values come from the admin form. */
function makeSamplePages(photo: string | null): Pages {
  return buildInitialPages({
    panelType: 'single',
    hasAccount: false,
    hasMap: false,
    hasQr: false,
    hasCalendar: false,
    photoUrl: photo,
    photoSize: null,
    mapUrl: null,
    mapSize: null,
    qrUrl: null,
    qrSize: null,
    accountGroom: '',
    accountBride: '',
    groom: {
      name: 'Minho',
      birth: '1997.05.13',
      father: { name: '김영수', deceased: false },
      mother: { name: '박정희', deceased: false },
    },
    bride: {
      name: 'Hyejin',
      birth: '1997.05.13',
      father: { name: '이상훈', deceased: false },
      mother: { name: '최미경', deceased: false },
    },
    deceasedStyle: 'hanja',
    title: '민호와 혜진이는 평생 사랑할 것을 맹세합니다',
    date: '2026년 10월 10일 토요일 오후 1시',
    venue: 'OO웨딩홀 3층 그랜드홀',
    greeting: '',
    weddingDate: '',
  });
}

/** The `/` playground: no persistence, no sharing — just a scratch canvas. Real orders live under /order/:id. */
export default function App() {
  const [initialPages] = useState<Pages>(() =>
    makeSamplePages(new URLSearchParams(window.location.search).get('photo')),
  );

  return <Editor orientation="landscape" initialPages={initialPages} showCustomerLinkPanel />;
}
