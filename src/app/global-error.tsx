"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0, background: "#0D0D0D", color: "#FAFAFA", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", gap: "24px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle style={{ width: 32, height: 32, color: "#ef4444" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#888", margin: 0, maxWidth: 280 }}>
              A critical error occurred. Your funds are safe on-chain.
            </p>
            {error.digest && (
              <p style={{ fontSize: 10, fontFamily: "monospace", color: "#555", margin: 0 }}>ref: {error.digest}</p>
            )}
          </div>
          <button
            type="button"
            onClick={reset}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 24px", height: 48, background: "#C8F135", color: "#000", fontWeight: 700, borderRadius: 16, fontSize: 14, border: "none", cursor: "pointer" }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
