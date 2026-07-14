"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * 마지막으로 칩을 터치한 시각. 칩마다 따로 들면, iOS가 만들어 낸 클릭이 **누른 적 없는 칩**으로
 * 배달됐을 때 그 칩이 켜져 버린다. 모든 칩이 함께 보도록 한곳에 둔다.
 */
let lastTouchAt = Number.NEGATIVE_INFINITY;

/** 터치 후 이 시간 안에 오는 클릭은 그 터치가 만들어 낸 것으로 본다. */
const synthesizedClickWindow = 1000;

/**
 * 선택 상태를 토글하는 칩.
 *
 * iOS Safari는 탭이 빠르면 두 번째 탭의 클릭을 **먼저 누른 요소에 합성해** 보낸다. 그래서 월을
 * 누르고 곧바로 화를 누르면 화가 아니라 월이 다시 토글된다. `touch-action: manipulation`으로도
 * 막히지 않으므로 클릭을 믿지 않는다.
 *
 * 터치에서는 `pointerdown`에 곧바로 토글하고, 뒤따르는 클릭은 두 겹으로 막는다. 하나는
 * `preventDefault()`로 클릭 자체가 생기지 않게 하는 것이고, 그래도 iOS가 만들어 보내는 클릭은
 * 마지막 터치 시각과 비교해 버린다. 마우스와 키보드는 클릭을 그대로 쓴다.
 */
export default function ToggleChip({
  pressed,
  onToggle,
  className,
  label,
  children,
}: {
  pressed: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  const toggledByTouch = useRef(false);

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") return;
        event.preventDefault();
        event.currentTarget.focus();
        lastTouchAt = event.timeStamp;
        toggledByTouch.current = true;
        onToggle();
      }}
      onPointerUp={() => {
        toggledByTouch.current = false;
      }}
      /** 손가락으로 스크롤을 시작하면 브라우저가 제스처를 가져간다. 그때 켜진 칩은 되돌린다. */
      onPointerCancel={() => {
        if (!toggledByTouch.current) return;
        toggledByTouch.current = false;
        onToggle();
      }}
      onClick={(event) => {
        if (event.timeStamp - lastTouchAt < synthesizedClickWindow) return;
        onToggle();
      }}
      className={cn(
        "flex cursor-pointer touch-manipulation items-center justify-center rounded-md border text-xs focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-none",
        pressed
          ? "border-foreground bg-foreground text-background"
          : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300",
        className,
      )}
    >
      {children}
    </button>
  );
}
