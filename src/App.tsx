import { useState } from 'react';
import Editor from './components/Editor';
import { buildInitialPages } from './lib/layoutGenerator';
import type { Orientation, PageState, Side } from './types';

function readInitParams(): { orientation: Orientation; photo: string | null } {
  const params = new URLSearchParams(window.location.search);
  const o = params.get('orientation');
  const orientation: Orientation = o === 'landscape' || o === 'portrait' ? o : 'portrait';
  return { orientation, photo: params.get('photo') };
}

/** Sample content for the scratch canvas — the real per-order values come from the admin form. */
function makeSamplePages(orientation: Orientation, photo: string | null): Record<Side, PageState> {
  return buildInitialPages({
    panelType: 'single',
    hasAccount: false,
    hasMap: false,
    hasQr: false,
    orientation,
    photoUrl: photo,
    photoSize: null,
    mapUrl: null,
    mapSize: null,
    qrUrl: null,
    qrSize: null,
    accountText: null,
    names: '김철수 · 이영희',
    title: '철수와 영희는 평생 사랑할 것을 맹세합니다',
    date: '2026년 10월 10일 토요일 오후 1시',
    venue: 'OO웨딩홀 3층 그랜드홀',
    greeting: '',
  });
}

/** The `/` playground: no persistence, no sharing — just a scratch canvas. Real orders live under /order/:id. */
export default function App() {
  const [initParams] = useState(readInitParams);
  const [initialPages] = useState<Record<Side, PageState>>(() =>
    makeSamplePages(initParams.orientation, initParams.photo),
  );

  return <Editor orientation={initParams.orientation} initialPages={initialPages} showCustomerLinkPanel />;
}
