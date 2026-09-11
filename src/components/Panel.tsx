import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  /** false면 제목만 보인 채로 시작한다 — 목록이 긴 패널은 접어 두는 편이 훑기 좋다. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** 사이드 패널 한 칸. 제목을 누르면 접히고 펼쳐진다. */
export default function Panel({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={'panel' + (open ? '' : ' panel-closed')}>
      <button
        type="button"
        className="panel-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <h3 className="panel-title">{title}</h3>
        {/* 닫히면 오른쪽, 열리면 아래를 가리키는 세모 */}
        <svg className={'panel-caret' + (open ? ' panel-caret-open' : '')} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 2.5 L12.5 8 L5 13.5 Z" />
        </svg>
      </button>
      {open && <div className="panel-body">{children}</div>}
    </div>
  );
}
