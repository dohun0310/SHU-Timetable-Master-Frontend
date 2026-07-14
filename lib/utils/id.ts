/**
 * `crypto.randomUUID()`는 보안 컨텍스트(HTTPS·localhost)에서만 제공된다. 평문 HTTP로 서비스하면
 * 브라우저에 `crypto`는 있어도 이 함수가 없어 바구니 담기와 시간표 저장이 통째로 터진다.
 * 쓸 수 있으면 그대로 쓰고, 없으면 난수로 같은 형식의 id를 만든다.
 */
export function createId(): string {
  const source = globalThis.crypto;

  if (typeof source?.randomUUID === "function") return source.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof source?.getRandomValues === "function") {
    source.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // RFC 4122 버전 4 형식을 맞춘다. 저장본을 사람이 들여다볼 때 형식이 뒤섞이지 않게 한다.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
