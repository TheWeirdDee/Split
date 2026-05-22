"use client";
import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#161616",
          border: "1px solid #2C2C2C",
          borderRadius: "24px",
          padding: "24px",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "slideUpDialog 0.25s ease",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontWeight: "700",
              fontSize: "17px",
              color: "#F7F3EC",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#8A8A8A",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {message}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: "48px",
              background: "transparent",
              border: "1px solid #2C2C2C",
              borderRadius: "14px",
              color: "#8A8A8A",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: "48px",
              background: danger ? "rgba(255,92,92,0.15)" : "rgba(0,200,150,0.15)",
              border: `1px solid ${danger ? "rgba(255,92,92,0.4)" : "rgba(0,200,150,0.4)"}`,
              borderRadius: "14px",
              color: danger ? "#FF5C5C" : "#00C896",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUpDialog {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
