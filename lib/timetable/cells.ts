import type { GridBlock } from "./grid";

/** 한 칸에 그릴 항목. 같은 강좌·같은 시간대의 meeting은 강의실만 모아 하나로 합친다. */
export interface CellItem {
  key: string;
  block: GridBlock;
  locations: string[];
}

/**
 * 같은 강좌가 같은 요일·같은 시간대에 meeting을 여러 개 갖는 경우가 실제로 있다(강의실만 다름).
 * 같은 수업이므로 칸에 두 번 그릴 이유가 없다. 하나로 합치고 강의실을 나란히 보여준다.
 * 시간대(시작·끝 교시)까지 키에 넣으므로, 시간이 다른 meeting은 그대로 각자 그려진다.
 *
 * 화면과 내보낸 그림이 같은 규칙을 써야 한다. 한쪽만 합치면 같은 시간표가 서로 다르게 보인다.
 */
export function cellItems(blocks: GridBlock[]): CellItem[] {
  const items = new Map<string, CellItem>();

  for (const block of blocks) {
    const { course, meeting } = block;
    const key = `${course.id}-${meeting.day}-${meeting.startPeriod}-${meeting.endPeriod}`;
    const item = items.get(key);

    if (!item) {
      items.set(key, {
        key,
        block,
        locations: meeting.location ? [meeting.location] : [],
      });
      continue;
    }

    if (meeting.location && !item.locations.includes(meeting.location)) {
      item.locations.push(meeting.location);
    }
  }

  return [...items.values()];
}
