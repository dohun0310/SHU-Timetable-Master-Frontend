/**
 * 캔버스 그림 하나를 담은 최소 PDF를 직접 만든다. JPEG는 PDF가 그대로 품을 수 있는 형식이라
 * (`DCTDecode`) 다시 압축할 필요가 없고, 덕분에 PDF 라이브러리를 들이지 않아도 된다.
 */
const a4Landscape = { width: 842, height: 595 };
const margin = 24;

function jpegBytes(canvas: HTMLCanvasElement): Uint8Array {
  const base64 = canvas.toDataURL("image/jpeg", 0.95).split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** 그림 비율을 지키면서 A4 가로 안에 앉힌다. */
function fitBox(imageWidth: number, imageHeight: number) {
  const maxWidth = a4Landscape.width - margin * 2;
  const maxHeight = a4Landscape.height - margin * 2;
  const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * ratio;
  const height = imageHeight * ratio;
  return {
    width,
    height,
    x: (a4Landscape.width - width) / 2,
    y: (a4Landscape.height - height) / 2,
  };
}

const encoder = new TextEncoder();

export function canvasToPdf(canvas: HTMLCanvasElement): Blob {
  const image = jpegBytes(canvas);
  const box = fitBox(canvas.width, canvas.height);

  const content = `q ${box.width.toFixed(2)} 0 0 ${box.height.toFixed(2)} ${box.x.toFixed(2)} ${box.y.toFixed(2)} cm /Im0 Do Q`;
  // `/Length`는 글자 수가 아니라 바이트 수다. 지금은 ASCII뿐이라 같지만, 그 전제에 기대지 않는다.
  const contentLength = encoder.encode(content).length;

  const objects: Array<string | Uint8Array> = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4Landscape.width} ${a4Landscape.height}] ` +
      "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
    image,
    "\nendstream\nendobj\n",
    `5 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];

  const chunks: Uint8Array[] = [encoder.encode("%PDF-1.4\n")];
  const offsets: number[] = [];
  let length = chunks[0]!.length;

  /** xref는 객체가 파일 어디에서 시작하는지 바이트 단위로 적어야 한다. */
  const push = (chunk: string | Uint8Array, startsObject: boolean) => {
    if (startsObject) offsets.push(length);
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };

  push(objects[0] as string, true);
  push(objects[1] as string, true);
  push(objects[2] as string, true);
  push(objects[3] as string, true);
  push(objects[4] as Uint8Array, false);
  push(objects[5] as string, false);
  push(objects[6] as string, true);

  const xrefOffset = length;
  const entries = offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  const xref =
    `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${entries}` +
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  push(xref, false);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}
