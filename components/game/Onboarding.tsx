"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getClaimStatusAction } from "@/app/actions/claims";
import { loadGameAction } from "@/app/actions/saves";
import type { GameState } from "@/lib/types";

export default function Onboarding() {
  const nameInput = useGameStore((s) => s.ui.nameInput);
  const setNameInput = useGameStore((s) => s.setNameInput);
  const startGame = useGameStore((s) => s.startGame);
  const loadCloudSave = useGameStore((s) => s.loadCloudSave);

  const [claimCount, setClaimCount] = useState<number | null>(null);
  const capacity = 2000;
  useEffect(() => {
    getClaimStatusAction().then(({ count }) => setClaimCount(count));
  }, []);

  // ── Recovery flow state ──
  const [showRecover, setShowRecover] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverLoading, setRecoverLoading] = useState(false);

  async function handleRecover() {
    const code = recoveryInput.trim().toUpperCase();
    // Normalize: accept with or without "BG-" prefix
    const playerId = code.startsWith("BG-") ? code : `BG-${code}`;

    if (playerId.length < 5) {
      setRecoverError("Enter your recovery code (e.g. BG-7kX9mP)");
      return;
    }

    setRecoverLoading(true);
    setRecoverError(null);

    try {
      const result = await loadGameAction(playerId);
      if (result.ok && result.gameState) {
        loadCloudSave(result.gameState as GameState);
      } else {
        setRecoverError(result.error === "No save found"
          ? "No save found for that code. Check it and try again."
          : "Something went wrong. Try again.");
      }
    } catch {
      setRecoverError("Connection error. Try again.");
    } finally {
      setRecoverLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #1a2e1a 0%, #111 40%, #0a0a0a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 2 + (i % 3) * 2, height: 2 + (i % 3) * 2, borderRadius: "50%",
            background: i % 3 === 0 ? "rgba(139,195,74,0.3)" : i % 3 === 1 ? "rgba(206,147,216,0.2)" : "rgba(255,183,77,0.15)",
            left: `${(i * 17 + 7) % 100}%`, top: `${(i * 13 + 11) % 100}%`,
            animation: `float${i % 4} ${8 + (i % 4) * 3}s ease-in-out infinite`,
            animationDelay: `${-(i * 0.7)}s`,
          }} />
        ))}
        <style>{`
          @keyframes float0 { 0%,100%{transform:translateY(0) translateX(0);opacity:0.3} 50%{transform:translateY(-80px) translateX(20px);opacity:0.8} }
          @keyframes float1 { 0%,100%{transform:translateY(0) translateX(0);opacity:0.2} 50%{transform:translateY(-120px) translateX(-30px);opacity:0.6} }
          @keyframes float2 { 0%,100%{transform:translateY(0) translateX(0);opacity:0.4} 50%{transform:translateY(-60px) translateX(15px);opacity:0.9} }
          @keyframes float3 { 0%,100%{transform:translateY(0) translateX(0);opacity:0.2} 50%{transform:translateY(-100px) translateX(-20px);opacity:0.7} }
          @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(139,195,74,0.2), 0 0 60px rgba(139,195,74,0.05)} 50%{box-shadow:0 0 30px rgba(139,195,74,0.4), 0 0 80px rgba(139,195,74,0.1)} }
          @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
          @keyframes fade-up { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        `}</style>
      </div>
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(139,195,74,0.4), transparent)" }} />
      <div style={{ textAlign: "center", maxWidth: 420, padding: "32px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-block", borderRadius: 24, padding: 4, marginBottom: 24, animation: "pulse-glow 4s ease-in-out infinite" }}>
          <img src="/bonsai-logo.png" alt="Bonsai" style={{ width: 150, height: 150, objectFit: "contain", borderRadius: 20, filter: "drop-shadow(0 0 20px rgba(139,195,74,0.3))" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: 10, textShadow: "0 0 40px rgba(139,195,74,0.3)", animation: "fade-up 0.8s ease-out both" }}>BONSAI</h1>
        <div style={{ fontSize: 13, letterSpacing: 8, marginTop: 6, marginBottom: 32, fontWeight: 600, background: "linear-gradient(90deg, #666, #8BC34A, #CE93D8, #FFB74D, #666)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 6s linear infinite, fade-up 0.8s ease-out 0.2s both" }}>GROW OR DIE</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap", animation: "fade-up 0.8s ease-out 0.4s both" }}>
          {([["$1M", "Starting Cash", "#8BC34A"], ["10 YRS", "To Survive", "#FFB74D"], ["9 ROOMS", "To Unlock", "#CE93D8"]] as [string,string,string][]).map(([value, label, color]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 85 }}>
              <div style={{ color, fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>{value}</div>
              <div style={{ color: "#555", fontSize: 9, marginTop: 2, letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{ color: "#999", fontSize: 13, lineHeight: 1.8, marginBottom: 12, maxWidth: 360, margin: "0 auto 12px", animation: "fade-up 0.8s ease-out 0.5s both" }}>
          It&apos;s <span style={{ color: "#fff", fontWeight: 600 }}>December 2015</span>. Rec cannabis has been legal for two years and the gold rush is on.
          You&apos;re the new operator of <span style={{ color: "#8BC34A", fontWeight: 600 }}>Bonsai Cultivation</span> — a scrappy Denver wholesale grow with $1M and one room.
          <br /><br /><span style={{ color: "#888" }}>Survive to <span style={{ color: "#FFB74D", fontWeight: 700 }}>4/20/2026</span> and win a free t-shirt!</span>
        </p>

        {/* Prestige capacity badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,183,77,0.08)",
          border: "1px solid rgba(255,183,77,0.25)",
          borderRadius: 20, padding: "5px 14px",
          marginBottom: 28, animation: "fade-up 0.8s ease-out 0.55s both",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#FFB74D",
            display: "inline-block", flexShrink: 0,
          }} />
          <span style={{
            fontSize: 8, letterSpacing: 2, color: "#FFB74D",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase", fontWeight: 700,
          }}>
            {claimCount === null
              ? "\u00A0"
              : claimCount < capacity
                ? `Limited to 2,000 · ${(capacity - claimCount).toLocaleString()} spots remaining`
                : "2,000 of 2,000 · Sold Out"}
          </span>
        </div>
        <div style={{ animation: "fade-up 0.8s ease-out 0.6s both" }}>
          <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && startGame()} placeholder="Enter your name, grower" maxLength={24} style={{ width: "100%", padding: "14px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,195,74,0.2)", borderRadius: 12, color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 12, textAlign: "center", letterSpacing: 1, transition: "border-color 0.3s, box-shadow 0.3s" }} onFocus={e => { e.currentTarget.style.borderColor = "rgba(139,195,74,0.5)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(139,195,74,0.1)"; }} onBlur={e => { e.currentTarget.style.borderColor = "rgba(139,195,74,0.2)"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
        <div style={{ animation: "fade-up 0.8s ease-out 0.7s both" }}>
          <button onClick={startGame} disabled={!nameInput.trim()} style={{ width: "100%", padding: "16px 24px", background: nameInput.trim() ? "linear-gradient(135deg, #7CB342 0%, #8BC34A 50%, #9CCC65 100%)" : "rgba(255,255,255,0.05)", color: nameInput.trim() ? "#1a1a1a" : "#555", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: nameInput.trim() ? "pointer" : "default", letterSpacing: 2, boxShadow: nameInput.trim() ? "0 4px 20px rgba(139,195,74,0.3), 0 0 40px rgba(139,195,74,0.1)" : "none", transition: "all 0.3s" }}>START GROWING</button>
        </div>

        {/* ── Recovery code section ── */}
        <div style={{ marginTop: 20, animation: "fade-up 0.8s ease-out 0.8s both" }}>
          {!showRecover ? (
            <button
              onClick={() => setShowRecover(true)}
              style={{
                background: "none", border: "none", color: "#555",
                fontSize: 11, cursor: "pointer", letterSpacing: 1,
                fontWeight: 600, padding: "6px 12px",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8BC34A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#555"; }}
            >
              Have a recovery code? Restore your game
            </button>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,195,74,0.15)",
              borderRadius: 12, padding: "16px 16px 12px",
            }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 10, letterSpacing: 0.5 }}>
                Enter the code from your previous game to recover your save.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={e => { setRecoveryInput(e.target.value); setRecoverError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleRecover()}
                  placeholder="BG-XXXXXXXX"
                  maxLength={16}
                  style={{
                    flex: 1, padding: "10px 12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(139,195,74,0.2)",
                    borderRadius: 8, color: "#fff", fontSize: 14,
                    outline: "none", fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 2, textAlign: "center",
                  }}
                />
                <button
                  onClick={handleRecover}
                  disabled={recoverLoading || !recoveryInput.trim()}
                  style={{
                    padding: "10px 16px",
                    background: recoveryInput.trim() ? "rgba(139,195,74,0.2)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(139,195,74,0.3)",
                    borderRadius: 8, color: recoveryInput.trim() ? "#8BC34A" : "#555",
                    fontSize: 12, fontWeight: 700, cursor: recoveryInput.trim() ? "pointer" : "default",
                    letterSpacing: 1,
                  }}
                >
                  {recoverLoading ? "..." : "LOAD"}
                </button>
              </div>
              {recoverError && (
                <div style={{ fontSize: 11, color: "#ef5350", marginTop: 8 }}>{recoverError}</div>
              )}
              <button
                onClick={() => { setShowRecover(false); setRecoverError(null); setRecoveryInput(""); }}
                style={{
                  background: "none", border: "none", color: "#555",
                  fontSize: 10, cursor: "pointer", marginTop: 8,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, animation: "fade-up 0.8s ease-out 0.9s both" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 10 }}>
            {["Real P&L", "Real AMR Data", "Real Wage Inflation"].map(tag => (
              <span key={tag} style={{ fontSize: 9, color: "#555", letterSpacing: 1, fontWeight: 600, padding: "3px 8px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>{tag}</span>
            ))}
          </div>
          <p style={{ color: "#3a3a3a", fontSize: 10, margin: "0 0 12px" }}>Built by the people who actually did it.</p>
          <p style={{
            color: "#ff2222", fontSize: 9, margin: 0, letterSpacing: 0.5, lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ⚠ Must be 21+ to claim prizes.
          </p>
        </div>
      </div>
    </div>
  );
}
