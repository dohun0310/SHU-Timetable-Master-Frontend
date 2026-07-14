"use client";

import RecoveryScreen from "@/components/RecoveryScreen";
import { clearStoredData } from "@/lib/storage/local-timetable-shelf";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return <RecoveryScreen onRetry={reset} onClear={clearStoredData} />;
}
