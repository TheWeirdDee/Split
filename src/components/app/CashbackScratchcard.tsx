"use client";

import React, { useRef, useEffect, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/common/Button";

interface CashbackScratchcardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashbackScratchcard = ({ isOpen, onClose }: CashbackScratchcardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratched, setScratched] = useState(false);
  const [rewardAmount, setRewardAmount] = useState("0.01");
  const [claimed, setClaimed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const strokeCountRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setScratched(false);
      setClaimed(false);
      strokeCountRef.current = 0;

      // Select random micro-reward
      const rewards = ["0.005", "0.01", "0.015", "0.02", "0.05"];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setRewardAmount(randomReward);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on CSS layout
    canvas.width = 280;
    canvas.height = 140;

    // Fill silver scratch layer
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise pattern to look metallic
    for (let i = 0; i < canvas.width; i += 4) {
      for (let j = 0; j < canvas.height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = "#444444";
          ctx.fillRect(i, j, 4, 4);
        }
      }
    }

    // Add text overlay
    ctx.fillStyle = "#8A8A8A";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💰 SCRATCH HERE TO REVEAL 💰", canvas.width / 2, canvas.height / 2);
  }, [isOpen]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (scratched || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get event coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    strokeCountRef.current += 1;
    // When pointer moves sufficiently (approx. 40 redraw frames), resolve scratch
    if (strokeCountRef.current > 40) {
      setScratched(true);
    }
  };

  if (!isOpen) return null;

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
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: "#161616",
          border: "1px solid #2C2C2C",
          borderRadius: "24px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          textAlign: "center",
          alignItems: "center",
        }}
        className="animate-fade-in"
      >
        <div className="flex flex-col items-center gap-1">
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "rgba(0,200,150,0.08)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,200,150,0.15)",
            }}
          >
            <Trophy style={{ width: "20px", height: "20px", color: "#00C896" }} />
          </div>
          <h2
            style={{
              fontFamily: "Clash Display, sans-serif",
              fontSize: "18px",
              fontWeight: "700",
              color: "#F7F3EC",
              margin: "6px 0 0",
            }}
          >
            Settlement Cashback!
          </h2>
          <p style={{ fontSize: "11px", color: "#8A8A8A", margin: 0 }}>
            You settled up prompt! Scratch to claim your gas cashback.
          </p>
        </div>

        {/* Scratchcard container */}
        <div
          style={{
            position: "relative",
            width: "280px",
            height: "140px",
            background: "#0D0D0D",
            border: "2px solid #2C2C2C",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: scratched ? "default" : "crosshair",
            touchAction: "none",
          }}
        >
          {/* Revealed content layer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
            className="animate-pulse"
          >
            <span
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "36px",
                fontWeight: "800",
                color: "#00C896",
              }}
            >
              +{rewardAmount}
            </span>
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: "600",
                color: "#F7F3EC",
                letterSpacing: "0.1em",
              }}
            >
              cUSD
            </span>
          </div>

          {/* Canvas scratch layer */}
          <canvas
            ref={canvasRef}
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            onMouseMove={(e) => isDrawing && draw(e)}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={() => setIsDrawing(false)}
            onTouchMove={(e) => isDrawing && draw(e)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transition: "opacity 0.4s ease-out",
              opacity: scratched ? 0 : 1,
              pointerEvents: scratched ? "none" : "auto",
              borderRadius: "14px",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
          {claimed ? (
            <div
              style={{
                background: "rgba(0,200,150,0.06)",
                border: "1px solid rgba(0,200,150,0.2)",
                borderRadius: "12px",
                padding: "10px",
                color: "#00C896",
                fontSize: "12px",
                fontWeight: "600",
              }}
              className="animate-fade-in"
            >
              ✓ cUSD Reward Claimed Successfully!
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-12 rounded-xl text-black bg-[#00C896] hover:bg-[#009E78] font-bold text-sm"
              disabled={!scratched}
              onClick={() => {
                setClaimed(true);
                setTimeout(() => {
                  onClose();
                }, 1500);
              }}
            >
              {scratched ? "Claim Cashback" : "Scratch Card to Reveal"}
            </Button>
          )}

          {!claimed && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#8A8A8A",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "4px",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Skip reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
