import { useRef } from 'react';

interface Props {
  onUpload: (dataUrl: string) => void;
}

export default function ImageUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpload(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="panel">
      <h3 className="panel-title">내 사진 업로드</h3>
      <p className="hint">컴퓨터에 있는 사진을 올리면 청첩장에 바로 추가돼요. 위치와 크기는 자유롭게 조절할 수 있어요.</p>
      <button className="secondary full-width" onClick={() => inputRef.current?.click()}>
        사진 선택
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}
