import type { Course } from "@/lib/timetable/types";

import { drawTimetable } from "./draw-timetable";
import { canvasToPdf } from "./pdf";

/** 파일 이름에 쓸 수 없는 글자를 걷어낸다. 비면 기본 이름을 쓴다. */
function fileName(name: string, extension: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, "").trim();
  return `${safe.length > 0 ? safe : "시간표"}.${extension}`;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
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
