import { useState } from 'react';
import type { Orientation } from '../types';

interface Props {
  orientation: Orientation;
}

export default function CustomerLinkPanel({ orientation }: Props) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  function generate() {
    const trimmed = photoUrl.trim();
    if (!trimmed) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('photo', trimmed);
    url.searchParams.set('orientation', orientation);
    setLink(url.toString());
    setCopied(false);
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => setCopied(true));
  }

  return (
    <div className="panel">
      <h3 className="panel-title">고객별 맞춤 링크 만들기</h3>
      <p className="hint">
        고객 사진 URL을 넣으면 그 사진이 미리 들어간 전용 편집 링크를 만들어 드려요. 사진은 미리 외부에
        업로드되어 있어야 하고(CORS 허용 필요), 그 이미지의 URL을 아래에 붙여넣으면 됩니다.
      </p>
      <input
        type="text"
        className="text-input"
        placeholder="https://example.com/customer-photo.jpg"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
      />
      <button className="secondary full-width" onClick={generate} disabled={!photoUrl.trim()}>
        링크 생성
      </button>
      {link && (
        <div className="generated-link-row">
          <input type="text" className="text-input" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? '복사됨!' : '복사'}</button>
        </div>
      )}
    </div>
  );
}
