"use client";

import RecoveryScreen from "@/components/RecoveryScreen";
import { clearStoredData } from "@/lib/storage/local-timetable-shelf";
import "./globals.css";

/** 레이아웃까지 터진 경우의 마지막 그물. 여기서도 저장본을 비우고 나갈 수 있어야 한다. */
export default function GlobalErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko" className="h-full">
      <body className="bg-background flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-md">
          <RecoveryScreen onRetry={reset} onClear={clearStoredData} />
        </div>
      </body>
    </html>
  );
}
