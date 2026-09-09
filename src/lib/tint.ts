/**
 * 단색 실루엣 아이콘을 원하는 색으로 칠한다.
 *
 * 원본 PNG의 알파(가장자리 부드러움까지)는 그대로 두고 색만 갈아끼우는 방식이라,
 * 화면·인쇄용 PNG·SVG 내보내기가 모두 같은 그림을 쓴다. 색만 저장하고 이미지를 매번 다시
 * 만들기 때문에 시안 데이터에 base64가 쌓이지 않는다.
 */
const cache = new Map<string, string>();

export async function tintImage(src: string, color: string): Promise<string> {
  const key = `${src}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(image, 0, 0);
  // source-in: 이미 그려진 알파 안쪽만 새 색으로 채운다
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const uri = canvas.toDataURL('image/png');
  cache.set(key, uri);
  return uri;
}
