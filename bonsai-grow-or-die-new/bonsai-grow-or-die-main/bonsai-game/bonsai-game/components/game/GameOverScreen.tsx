"use client";

import { useGameStore } from "@/store/useGameStore";
import { formatCash } from "@/lib/helpers";

export default function GameOverScreen() {
  const state = useGameStore((s) => s.state);
  const resetGame = useGameStore((s) => s.resetGame);
  if (!state) return null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a1a 0%, #2a1010 50%, #1a1a1a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 16px" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💀</div>
        <h1 style={{ color: "#ef5350", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: 2 }}>GAME OVER</h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>{state.deathCause || "The lights went off."}</p>
        <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>Final cash: <span style={{ color: "#ef5350", fontWeight: 700 }}>{formatCash(state.cash)}</span></p>
        <button onClick={resetGame} style={{ marginTop: 32, padding: "14px 36px", background: "#333", color: "#aaa", border: "1px solid #555", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Try Again</button>
      </div>
    </div>
  );
}
