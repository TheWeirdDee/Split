"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Flame } from "lucide-react";

interface NudgeButtonProps {
  onNudge: (type: "broom" | "runner" | "bell") => void;
  disabled?: boolean;
}

export const NudgeButton = ({ onNudge, disabled }: NudgeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (type: "broom" | "runner" | "bell") => {
    onNudge(type);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={menuRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          padding: "6px 14px",
          background: "transparent",
          border: "1px solid #2C2C2C",
          borderRadius: "10px",
          color: "#00C896",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: "600",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.2s ease",
          touchAction: "manipulation",
        }}
      >
        <Bell style={{ width: "12px", height: "12px" }} />
        Nudge
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "#161616",
            border: "1px solid #2C2C2C",
            borderRadius: "12px",
            padding: "8px",
            display: "flex",
            gap: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            zIndex: 100,
          }}
          className="animate-fade-in"
        >
          <button
            onClick={() => handleSelect("broom")}
            title="Broom Nudge"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #2C2C2C",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s ease",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🧹
          </button>
          <button
            onClick={() => handleSelect("runner")}
            title="Runner Nudge"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #2C2C2C",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s ease",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🏃‍♂️
          </button>
          <button
            onClick={() => handleSelect("bell")}
            title="Bell Nudge"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #2C2C2C",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s ease",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🔔
          </button>
        </div>
      )}
    </div>
  );
};
