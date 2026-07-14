"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** 터치 후 따라오는 클릭을 무시할 시간. iOS의 합성 클릭은 탭 직후에 온다. */
const synthesizedClickWindow = 700;

/**
 * 선택 상태를 토글하는 칩.
 *
 * iOS Safari는 탭이 빠르면 두 번째 탭의 클릭을 **먼저 누른 요소에 합성해** 보낸다. 그래서 월을
 * 누르고 곧바로 화를 누르면 화가 아니라 월이 다시 토글된다. `touch-action: manipulation`으로도
 * 막히지 않으므로 클릭을 믿지 않는다. 터치에서는 `pointerdown`에 곧바로 토글하고, 그 뒤에 오는
 * 클릭은 어디로 배달되든 무시한다. 마우스와 키보드는 클릭을 그대로 쓴다.
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
  const touchedAt = useRef(0);

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") return;
        touchedAt.current = event.timeStamp;
        onToggle();
      }}
      onClick={(event) => {
        if (event.timeStamp - touchedAt.current < synthesizedClickWindow) return;
        onToggle();
      }}
      className={cn(
        "flex touch-manipulation items-center justify-center rounded-md border text-xs focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-none",
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
