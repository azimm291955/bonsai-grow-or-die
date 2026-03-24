"use client";

import { useGameStore } from "@/store/useGameStore";
import { EVENT_CARDS } from "@/lib/constants";

export default function EventModal() {
  const showEvent = useGameStore((s) => s.ui.showEvent);
  const setShowEvent = useGameStore((s) => s.setShowEvent);
  if (!showEvent || !EVENT_CARDS[showEvent]) return null;
  const card = EVENT_CARDS[showEvent];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#1a1a1a", border: `1px solid ${card.color}`, borderRadius: 16, maxWidth: 420, width: "100%", padding: 32, textAlign: "center" }}>
        <h2 style={{ color: card.color, fontSize: 20, margin: 0, lineHeight: 1.4 }}>{card.title}</h2>
        <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: "20px 0", whiteSpace: "pre-line" }}>{card.text}</p>
        <p style={{ color: "#888", fontSize: 12, fontStyle: "italic", marginBottom: 24 }}>{card.effect}</p>
        <button onClick={() => setShowEvent(null)} style={{ padding: "12px 32px", background: card.color, color: "#1a1a1a", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Keep Growing</button>
      </div>
    </div>
  );
}
