import { cellItems } from "@/lib/timetable/cells";
import { totalCredits } from "@/lib/timetable/credits";
import { blocksAt, buildGrid, isBlockStart } from "@/lib/timetable/grid";
import { weekdayLabels, type Course } from "@/lib/timetable/types";

/**
 * 내보낸 그림은 화면 테마와 무관하게 읽혀야 하므로 항상 밝은 배경에 짙은 글씨로 그린다.
 * 다크 모드에서 내보냈다고 검은 배경에 흰 글씨인 이미지를 주면 인쇄할 수 없다.
 */
const colors = {
  background: "#FFFFFF",
  text: "#151515",
  muted: "#6B7280",
  line: "#D1D5DB",
  block: "#F3F4F6",
  conflict: "#FEE2E2",
  conflictLine: "#DC2626",
} as const;

const scale = 2;
const padding = 24;
const headerHeight = 44;
const timeColumnWidth = 44;
const dayHeaderHeight = 32;
const rowHeight = 44;
const footerHeight = 28;
const unscheduledLineHeight = 20;
const width = 900;

const font = (size: number, weight: "normal" | "bold" = "normal") =>
  `${weight} ${size}px "Pretendard", -apple-system, "Apple SD Gothic Neo", sans-serif`;

/** 칸을 넘치는 글자는 잘라 낸다. 이미지에서는 스크롤도 툴팁도 없다. */
function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;

  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/** 시간표를 캔버스에 그린다. 화면 DOM을 캡처하지 않고 도메인 데이터에서 직접 그린다. */
export function drawTimetable(courses: Course[], title: string): HTMLCanvasElement {
  const grid = buildGrid(courses);
  const unscheduledLines = grid.unscheduled.length > 0 ? grid.unscheduled.length + 1 : 0;
  const height =
    padding * 2 +
    headerHeight +
    dayHeaderHeight +
    grid.periods.length * rowHeight +
    footerHeight +
    unscheduledLines * unscheduledLineHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  context.scale(scale, scale);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);
  context.textBaseline = "middle";

  const tableWidth = width - padding * 2;

  context.fillStyle = colors.text;
  context.font = font(20, "bold");
  context.fillText(fitText(context, title, tableWidth), padding, padding + 12);

  const tableTop = padding + headerHeight;
  const dayWidth = (tableWidth - timeColumnWidth) / grid.days.length;
  const columnX = (index: number) => padding + timeColumnWidth + index * dayWidth;

  context.font = font(13, "bold");
  context.textAlign = "center";
  grid.days.forEach((day, index) => {
    context.fillStyle = colors.text;
    context.fillText(weekdayLabels[day], columnX(index) + dayWidth / 2, tableTop + dayHeaderHeight / 2);
  });

  const bodyTop = tableTop + dayHeaderHeight;

  grid.periods.forEach((period, row) => {
    const y = bodyTop + row * rowHeight;

    context.fillStyle = colors.muted;
    context.font = font(12);
    context.fillText(String(period), padding + timeColumnWidth / 2, y + rowHeight / 2);

    grid.days.forEach((day, index) => {
      const x = columnX(index);
      /** 화면과 같은 규칙으로 합친다. 한쪽만 합치면 같은 시간표가 서로 다르게 보인다. */
      const items = cellItems(blocksAt(grid, day, period));

      context.strokeStyle = colors.line;
      context.lineWidth = 1;
      context.strokeRect(x, y, dayWidth, rowHeight);

      if (items.length === 0) return;

      const itemWidth = dayWidth / items.length;
      items.forEach(({ block, locations }, order) => {
        const itemX = x + order * itemWidth;

        context.fillStyle = block.conflicted ? colors.conflict : colors.block;
        context.fillRect(itemX + 1, y + 1, itemWidth - 2, rowHeight - 2);

        if (block.conflicted) {
          context.strokeStyle = colors.conflictLine;
          context.strokeRect(itemX + 1, y + 1, itemWidth - 2, rowHeight - 2);
        }

        context.textAlign = "left";
        const inner = itemWidth - 10;

        if (isBlockStart(block, period)) {
          /** 흑백으로 인쇄하면 색만으로는 겹침을 알 수 없다. 글자로도 남긴다. */
          const name = block.conflicted ? `⚠ ${block.course.name}` : block.course.name;
          context.fillStyle = colors.text;
          context.font = font(12, "bold");
          context.fillText(fitText(context, name, inner), itemX + 5, y + 15);

          if (locations.length > 0) {
            context.fillStyle = colors.muted;
            context.font = font(11);
            context.fillText(fitText(context, locations.join(", "), inner), itemX + 5, y + 31);
          }
        } else {
          context.fillStyle = colors.muted;
          context.font = font(11);
          context.fillText("↳", itemX + 5, y + rowHeight / 2);
        }
        context.textAlign = "center";
      });
    });
  });

  const tableBottom = bodyTop + grid.periods.length * rowHeight;

  context.textAlign = "left";
  context.fillStyle = colors.text;
  context.font = font(13, "bold");
  context.fillText(`총 ${totalCredits(courses)}학점`, padding, tableBottom + footerHeight / 2);

  if (grid.unscheduled.length > 0) {
    let y = tableBottom + footerHeight + unscheduledLineHeight / 2;
    context.fillStyle = colors.text;
    context.font = font(12, "bold");
    context.fillText("시간 미지정", padding, y);

    context.fillStyle = colors.muted;
    context.font = font(12);
    for (const course of grid.unscheduled) {
      y += unscheduledLineHeight;
      const line = `${course.name} (${course.classNumber}분반 · ${course.credits}학점)`;
      context.fillText(fitText(context, line, tableWidth), padding, y);
    }
  }

  return canvas;
}
