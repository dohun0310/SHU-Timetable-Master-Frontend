"use client";

/** 저장본이 깨져 렌더가 터진 경우에도 사용자가 DevTools 없이 빠져나올 수 있어야 한다. */
export default function RecoveryScreen({
  onRetry,
  onClear,
}: {
  onRetry: () => void;
  onClear: () => void;
}) {
  /** 메모리에 남은 깨진 스냅샷까지 확실히 버리려면 지운 뒤 새로 불러와야 한다. */
  const clearAndRestart = () => {
    onClear();
    window.location.reload();
  };

  return (
    <div className="bg-foreground/5 rounded-lg border border-gray-100 p-10 text-center dark:border-gray-800">
      <h2 className="text-base font-semibold">화면을 표시하지 못했습니다</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        저장된 바구니가 손상되었을 수 있습니다. 아래 버튼을 누르면 저장된 바구니를 비우고 처음부터
        다시 시작합니다.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearAndRestart}
          className="bg-foreground text-background hover:bg-foreground/85 rounded-md px-4 py-2 text-sm font-medium"
        >
          저장된 바구니 비우고 새로 시작
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
