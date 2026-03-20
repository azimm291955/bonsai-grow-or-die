"use client";

import { useGameStore } from "@/store/useGameStore";
import { EVENT_CARDS } from "@/lib/constants";

const CRT_OVERLAY = `
  repeating-linear-gradient(
    0deg,
    rgba(255,255,255,0.03) 0px,
    rgba(255,255,255,0.03) 1px,
    transparent 1px,
    transparent 3px
  )
`;

export default function EventModal() {
  const showEvent = useGameStore((s) => s.ui.showEvent);
  const setShowEvent = useGameStore((s) => s.setShowEvent);
  if (!showEvent || !EVENT_CARDS[showEvent]) return null;
  const card = EVENT_CARDS[showEvent];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        background: "#111",
        border: `1px solid ${card.color}`,
        borderLeft: `4px solid ${card.color}`,
        borderRadius: 12,
        maxWidth: 420,
        width: "100%",
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* CRT scanline overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: CRT_OVERLAY,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.12,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, padding: "28px 24px" }}>
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              background: card.color,
              color: "#000",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 2,
              padding: "3px 8px",
              borderRadius: 3,
              fontFamily: "var(--font-mono)",
            }}>
              MARKET UPDATE
            </div>
          </div>

          <h2 style={{ color: card.color, fontSize: 18, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.3, textAlign: "left" }}>
            {card.title}
          </h2>

          <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.8, margin: "0 0 16px", whiteSpace: "pre-line", textAlign: "left" }}>
            {card.text}
          </p>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 8, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 4, fontFamily: "var(--font-mono)" }}>EFFECT</div>
            <p style={{ color: "#999", fontSize: 12, lineHeight: 1.6, margin: 0, textAlign: "left", fontStyle: "italic" }}>{card.effect}</p>
          </div>

          <button
            onClick={() => setShowEvent(null)}
            style={{
              width: "100%",
              padding: "14px 32px",
              background: card.color,
              color: "#000",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            Keep Growing
          </button>
        </div>
      </div>
    </div>
  );
}
