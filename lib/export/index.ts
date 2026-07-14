import type { Course } from "@/lib/timetable/types";

import { drawTimetable } from "./draw-timetable";
import { canvasToPdf } from "./pdf";

/** 파일 이름에 쓸 수 없는 글자를 걷어낸다. 비면 기본 이름을 쓴다. 파일 시스템이 받을 만한 길이로 자른다. */
function fileName(name: string, extension: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60);
  return `${safe.length > 0 ? safe : "시간표"}.${extension}`;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // 곧바로 되돌리면 사파리·파이어폭스에서 내려받기가 취소되는 일이 있다.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportTimetablePng(courses: Course[], name: string): Promise<void> {
  const canvas = drawTimetable(courses, name);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("이미지를 만들지 못했습니다.");
  download(blob, fileName(name, "png"));
}

export function exportTimetablePdf(courses: Course[], name: string): void {
  const canvas = drawTimetable(courses, name);
  download(canvasToPdf(canvas), fileName(name, "pdf"));
}
