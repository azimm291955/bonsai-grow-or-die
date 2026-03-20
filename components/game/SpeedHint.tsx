"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function SpeedHint() {
  const showAchievement = useGameStore((s) => s.ui.showAchievement);
  const achievements    = useGameStore((s) => s.state?.achievements);

  const [active, setActive]   = useState(false);
  const [rect, setRect]       = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const prevAchRef = useRef<string | null>(null);
  const rafRef     = useRef<number | null>(null);

  // Fire when first_harvest toast is dismissed
  useEffect(() => {
    if (
      prevAchRef.current === "first_harvest" &&
      showAchievement !== "first_harvest" &&
      achievements?.["first_harvest"]
    ) {
      setActive(true);
    }
    prevAchRef.current = showAchievement ?? null;
  }, [showAchievement, achievements]);

  // Track speed-controls rect while active
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setRect(getRect("speed-controls"));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  // Fade in tooltip
  useEffect(() => {
    if (!active || !rect) return;
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [active, !!rect]);

  if (!active || !rect) return null;

  const PAD = 8;
  const winW = window.innerWidth;
  const tooltipW = Math.min(340, winW - 32);
  const targetCenter = rect.left + rect.width / 2;
  let tooltipLeft = targetCenter - tooltipW / 2;
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, winW - tooltipW - 16));

  return (
    <>
      <style>{`
        @keyframes sh-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(139,195,74,0.25)} 50%{box-shadow:0 0 0 6px rgba(139,195,74,0.5), 0 0 30px rgba(139,195,74,0.3)} }
      `}</style>

      {/* Dark mask with hole over speed controls */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 400, pointerEvents: "none" }}>
        <defs>
          <mask id="sh-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - PAD} y={rect.top - PAD}
              width={rect.width + PAD * 2} height={rect.height + PAD * 2}
              rx="10" fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#sh-mask)" />
      </svg>

      {/* Pulsing ring */}
      <div style={{
        position: "fixed",
        top: rect.top - PAD, left: rect.left - PAD,
        width: rect.width + PAD * 2, height: rect.height + PAD * 2,
        borderRadius: 10, zIndex: 401, pointerEvents: "none",
        animation: "sh-pulse 1.8s ease-in-out infinite",
      }} />

      {/* Tooltip — below the speed controls */}
      <div style={{
        position: "fixed",
        left: tooltipLeft,
        width: tooltipW,
        top: rect.top + rect.height + PAD + 10,
        zIndex: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.25s, transform 0.25s",
      }}>
        <div style={{
          background: "#141414",
          border: "1px solid rgba(139,195,74,0.3)",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,195,74,0.1)",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#8BC34A", fontWeight: 700, marginBottom: 8 }}>
            RUNWAY TIMER
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 6 }}>
            Your runway is your lifeline.
          </div>
          <div style={{ fontSize: 11, color: "#777", lineHeight: 1.65, marginBottom: 12 }}>
            The <span style={{ color: "#fff", fontWeight: 600 }}>RUNWAY</span> counter in the header shows how many months of cash you have left at your current burn rate. Keep it green.
          </div>
          <div style={{ fontSize: 11, color: "#777", lineHeight: 1.65, marginBottom: 14 }}>
            Use <span style={{ color: "#8BC34A", fontWeight: 600 }}>32×</span> or <span style={{ color: "#8BC34A", fontWeight: 600 }}>64×</span> to fast-forward through grow cycles. Hit <span style={{ color: "#fff", fontWeight: 600 }}>PAUSE</span> anytime to make decisions without the clock bleeding you out.
          </div>
          <button
            onClick={() => setActive(false)}
            style={{
              width: "100%", padding: "12px 0",
              background: "rgba(139,195,74,0.12)",
              border: "1px solid rgba(139,195,74,0.4)",
              borderRadius: 8, color: "#8BC34A",
              fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1.5,
            }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </>
  );
}
