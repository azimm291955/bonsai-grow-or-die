"use client";

import { useGameStore } from "@/store/useGameStore";

const CRT_OVERLAY = `
  repeating-linear-gradient(
    0deg,
    rgba(255,255,255,0.03) 0px,
    rgba(255,255,255,0.03) 1px,
    transparent 1px,
    transparent 3px
  )
`;

export default function VcOfferModal() {
  const state = useGameStore((s) => s.state);
  const showVC = useGameStore((s) => s.ui.showVC);
  const acceptVC = useGameStore((s) => s.acceptVC);
  const declineVC = useGameStore((s) => s.declineVC);

  if (!showVC || !state) return null;
  const activeRooms = state.rooms.filter(r => r.unlocked).length;
  const roomsToLose = Math.floor(activeRooms / 2);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        background: "#0e0e0e",
        border: "1px solid #ef5350",
        borderLeft: "4px solid #ef5350",
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
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "#ef5350",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 2,
              padding: "3px 8px",
              borderRadius: 3,
              fontFamily: "var(--font-mono)",
            }}>
              EMERGENCY
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>🦅</span>
            <div>
              <h2 style={{ color: "#ef5350", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>VULTURE CAPITAL</h2>
              <p style={{ color: "#777", fontSize: 10, letterSpacing: 2, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>EMERGENCY BAILOUT</p>
            </div>
          </div>

          <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.8, margin: "0 0 16px", textAlign: "left" }}>
            You&apos;re out of cash. The lights are about to go off. A group of investors is offering you a lifeline — but it comes at a permanent cost.
          </p>

          {/* Terms */}
          <div style={{
            background: "rgba(239,83,80,0.04)",
            border: "1px solid rgba(239,83,80,0.12)",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 8, color: "#ef5350", fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: "var(--font-mono)" }}>DEAL TERMS</div>
            {([
              ["💰", "Cash injection to cover 1 quarter of overhead"],
              ["🏚️", `Lose ${roomsToLose} rooms immediately`],
              ["📉", "15% of ALL future revenue taken permanently"],
              ["🔧", "5% overhead reduction (forced restructuring)"],
            ] as [string, string][]).map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 13, color: "#ccc", textAlign: "left" }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          <button onClick={acceptVC} style={{
            width: "100%", padding: 16, background: "#ef5350", color: "#fff", border: "none",
            borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10, letterSpacing: 1,
          }}>
            Accept the Deal
          </button>
          <button onClick={declineVC} style={{
            width: "100%", padding: 14, background: "transparent", color: "#666",
            border: "1px solid #333", borderRadius: 8, fontSize: 13, cursor: "pointer",
          }}>
            Decline — Let the lights go off 💀
          </button>
        </div>
      </div>
    </div>
  );
}
