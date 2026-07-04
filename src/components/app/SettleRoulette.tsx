"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Dices, ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { AmountDisplay } from "@/components/common/AmountDisplay";

interface SettleRouletteProps {
  isOpen: boolean;
  onClose: () => void;
  originalAmount: number;
  onConfirm: (adjustedAmount: number) => void;
}

const MULTIPLIERS = [
  { value: -0.05, label: "-5.0% (Save!)", color: "#00C896" },
  { value: -0.03, label: "-3.0% (Discount)", color: "#00C896" },
  { value: -0.01, label: "-1.0% (Minor Save)", color: "#00C896" },
  { value: 0.0, label: "+0.0% (Standard)", color: "#8A8A8A" },
  { value: 0.01, label: "+1.0% (Tipping)", color: "#FF9500" },
  { value: 0.03, label: "+3.0% (Generous)", color: "#FF9500" },
  { value: 0.05, label: "+5.0% (Extra Tip!)", color: "#FF5C5C" },
];

export const SettleRoulette = ({
  isOpen,
  onClose,
  originalAmount,
  onConfirm,
}: SettleRouletteProps) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof MULTIPLIERS[number] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setSpinning(false);
    }
  }, [isOpen]);

  const startSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    let count = 0;
    const totalTicks = 25 + Math.floor(Math.random() * 10); // Random duration
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MULTIPLIERS.length);
      count++;

      if (count >= totalTicks) {
        clearInterval(interval);
        // Determine final index
        const finalIndex = Math.floor(Math.random() * MULTIPLIERS.length);
        setActiveIndex(finalIndex);
        setResult(MULTIPLIERS[finalIndex]);
        setSpinning(false);
      }
    }, 100);
  };

  if (!isOpen) return null;

  const adjustedAmount = result
    ? Math.max(0.01, originalAmount * (1 + result.value))
    : originalAmount;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13,13,13,0.9)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#161616",
          border: "1px solid #2C2C2C",
          borderRadius: "24px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
        className="animate-fade-in"
      >
        <div className="flex flex-col items-center gap-2">
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(0,200,150,0.1)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,200,150,0.2)",
            }}
          >
            <Dices style={{ width: "24px", height: "24px", color: "#00C896" }} />
          </div>
          <h2
            style={{
              fontFamily: "Clash Display, sans-serif",
              fontSize: "20px",
              fontWeight: "700",
              color: "#F7F3EC",
              margin: 0,
            }}
          >
            Settle Roulette
          </h2>
          <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
            Spin the wheel to randomize your final split amount (±5%).
          </p>
        </div>

        {/* Multipliers wheel/list area */}
        <div
          style={{
            background: "#0D0D0D",
            border: "1px solid #2C2C2C",
            borderRadius: "16px",
            padding: "16px",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {spinning ? (
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "22px",
                fontWeight: "700",
                color: MULTIPLIERS[activeIndex].color,
                transition: "all 0.1s ease-in-out",
              }}
            >
              {MULTIPLIERS[activeIndex].label}
            </div>
          ) : result ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
              className="animate-bounce"
            >
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: result.color,
                }}
              >
                {result.label}
              </span>
              <span style={{ fontSize: "11px", color: "#8A8A8A" }}>
                Multiplier Selected!
              </span>
            </div>
          ) : (
            <button
              onClick={startSpin}
              style={{
                background: "transparent",
                border: "none",
                color: "#00C896",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles style={{ width: "16px", height: "16px" }} />
              Tap to Spin the Wheel
            </button>
          )}
        </div>

        {/* Calculation display */}
        {result && (
          <div
            style={{
              background: "#0D0D0D",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "#8A8A8A" }}>Original Amount</span>
              <span style={{ color: "#F7F3EC", fontFamily: "DM Mono, monospace" }}>
                {originalAmount.toFixed(2)} usdm
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "#8A8A8A" }}>Adjustment</span>
              <span style={{ color: result.color, fontFamily: "DM Mono, monospace", fontWeight: "600" }}>
                {result.value >= 0 ? "+" : ""}
                {(result.value * originalAmount).toFixed(2)} usdm
              </span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #2C2C2C", margin: 0 }} />
            <div className="flex justify-between items-center">
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#F7F3EC" }}>Final Pay</span>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#00C896", fontFamily: "DM Mono, monospace" }}>
                {adjustedAmount.toFixed(2)} usdm
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variant="outline"
            style={{ flex: 1, height: "48px" }}
            onClick={onClose}
            disabled={spinning}
          >
            Cancel
          </Button>
          <Button
            style={{ flex: 1, height: "48px", background: result ? "#00C896" : "#4A4A4A" }}
            disabled={spinning || !result}
            onClick={() => onConfirm(adjustedAmount)}
          >
            Confirm Pay
          </Button>
        </div>
      </div>
    </div>
  );
};
