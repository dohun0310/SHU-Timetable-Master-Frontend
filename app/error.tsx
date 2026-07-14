"use client";

import RecoveryScreen from "@/components/RecoveryScreen";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return <RecoveryScreen onRetry={reset} />;
}
