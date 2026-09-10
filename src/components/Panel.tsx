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
        <span className="panel-caret" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="panel-body">{children}</div>}
    </div>
  );
}
