"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "calc(100% - 32px)",
            maxWidth: "400px",
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background:
                  t.type === "success"
                    ? "rgba(0,200,150,0.95)"
                    : t.type === "error"
                    ? "rgba(255,92,92,0.95)"
                    : "rgba(30,30,30,0.97)",
                color: t.type === "success" ? "#000" : "#fff",
                padding: "14px 20px",
                borderRadius: "16px",
                fontSize: "14px",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: "600",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                border:
                  t.type === "success"
                    ? "1px solid rgba(0,200,150,0.3)"
                    : t.type === "error"
                    ? "1px solid rgba(255,92,92,0.3)"
                    : "1px solid #2C2C2C",
                animation: "slideUp 0.3s ease",
                pointerEvents: "auto",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
