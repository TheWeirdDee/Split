"use client";
import React, { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Flame, Trophy, Sprout, Zap, Gem } from "lucide-react";

const STREAK_BADGES = [
  { days: 1, label: "First Step", icon: Sprout, color: "#00C896" },
  { days: 3, label: "On a Roll", icon: Flame, color: "#FF9500" },
  { days: 7, label: "Week Warrior", icon: Zap, color: "#FFCC00" },
  { days: 14, label: "2-Week Streak", icon: Gem, color: "#5AC8FA" },
  { days: 30, label: "Monthly Legend", icon: Trophy, color: "#AF52DE" },
];

/**
 * Records a daily check-in on mount and renders the user's current streak with
 * a tier badge (First Step → Monthly Legend). Shows a "+1 TODAY" marker when the
 * streak advanced this open, and renders nothing until a streak exists.
 */
export const DailyCheckIn = () => {
  const { profile, recordDailyCheckIn } = useProfile();
  const [checkedIn, setCheckedIn] = useState(false);
  const [newStreak, setNewStreak] = useState<number | null>(null);

  useEffect(() => {
    const doCheckIn = async () => {
      const result = await recordDailyCheckIn();
      if (result) {
        const today = new Date().toISOString().split("T")[0];
        const alreadyWas = profile?.last_checkin === today;
        if (!alreadyWas) {
          setNewStreak(result.streak_count);
          setCheckedIn(true);
        }
      }
    };
    doCheckIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = newStreak ?? profile?.streak_count ?? 0;
  const badge = [...STREAK_BADGES].reverse().find((b) => streak >= b.days);
  const BadgeIcon = badge?.icon;

  if (streak === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(0,200,150,0.08) 0%, rgba(0,200,150,0.03) 100%)",
        border: "1px solid rgba(0,200,150,0.2)",
        borderRadius: "20px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "80px", height: "80px",
        background: "radial-gradient(circle, rgba(0,200,150,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Streak icon */}
      <div style={{
        width: "44px", height: "44px", flexShrink: 0,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {BadgeIcon ? (
          <BadgeIcon 
            style={{ 
              width: "22px", 
              height: "22px", 
              color: badge.color,
            }} 
          />
        ) : (
          <Flame style={{ width: "22px", height: "22px", color: "#FF9500" }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Flame style={{ width: "14px", height: "14px", color: "#00C896" }} />
          <span style={{
            fontFamily: "DM Sans, sans-serif", fontWeight: "700",
            fontSize: "15px", color: "#F7F3EC",
          }}>
            {streak}-day streak
          </span>
          {checkedIn && (
            <span style={{
              fontSize: "10px", background: "rgba(0,200,150,0.15)",
              color: "#00C896", padding: "2px 7px", borderRadius: "100px",
              fontFamily: "DM Mono, monospace", fontWeight: "700",
            }}>
              +1 TODAY
            </span>
          )}
        </div>
        {badge && (
          <p style={{
            fontFamily: "DM Sans, sans-serif", fontSize: "12px",
            color: "#8A8A8A", margin: "3px 0 0",
          }}>
            {badge.label} badge earned
          </p>
        )}
      </div>

      {/* Streak number */}
      <span style={{
        fontFamily: "Clash Display, sans-serif", fontWeight: "700",
        fontSize: "32px", color: "#00C896", lineHeight: 1,
      }}>
        {streak}
      </span>
    </div>
  );
};

