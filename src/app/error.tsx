"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-text-primary clash-display">Something went wrong</h1>
        <p className="text-sm text-text-secondary max-w-[280px]">
          An unexpected error occurred. Your funds are safe on-chain.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-text-muted">ref: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 px-6 h-12 bg-brand text-black font-bold rounded-2xl text-sm hover:bg-brand/90 transition-all cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
