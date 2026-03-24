"use client";

import { useGameStore } from "@/store/useGameStore";

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
      <div style={{ background: "#1a1a1a", border: "2px solid #ef5350", borderRadius: 16, maxWidth: 420, width: "100%", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🦅</div>
        <h2 style={{ color: "#ef5350", fontSize: 24, margin: 0 }}>VULTURE CAPITAL</h2>
        <p style={{ color: "#888", fontSize: 12, letterSpacing: 2, marginTop: 4 }}>EMERGENCY BAILOUT</p>
        <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: "20px 0" }}>You&apos;re out of cash. The lights are about to go off. A group of investors is offering you a lifeline — but it comes at a permanent cost.</p>
        <div style={{ textAlign: "left", background: "#222", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          {([["💰","Cash injection to cover 1 quarter of overhead"],["🏚️",`Lose ${roomsToLose} rooms immediately`],["📉","15% of ALL future revenue taken permanently"],["🔧","5% overhead reduction (forced restructuring)"],["🚫","Free joint prize VOIDED forever"]] as [string,string][]).map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13, color: "#ccc" }}><span>{icon}</span><span>{text}</span></div>
          ))}
        </div>
        <button onClick={acceptVC} style={{ width: "100%", padding: 14, background: "#ef5350", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>Accept the Deal</button>
        <button onClick={declineVC} style={{ width: "100%", padding: 14, background: "none", color: "#666", border: "1px solid #444", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Decline — Let the lights go off 💀</button>
      </div>
    </div>
  );
}
