"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { submitScoreAction, getSubmitTokenAction } from "@/app/actions/leaderboard";
import { formatCash } from "@/lib/helpers";
import { UPGRADE_TRACKS, ACHIEVEMENTS } from "@/lib/constants";
import DataCollectionModal, { LS_WIN_SUBMITTED } from "./modals/DataCollectionModal";

/** Generate HMAC-SHA256 using the browser-native Web Crypto API */
async function generateSignature(
  playerName: string, finalCash: number, rooms: number, totalHarvests: number,
  timestamp: number, nonce: string, salt: string
): Promise<string> {
  const payload = `${playerName}:${finalCash}:${rooms}:${totalHarvests}:${timestamp}:${nonce}:${salt}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function WinScreen() {
  const state = useGameStore((s) => s.state);
  const resetGame = useGameStore((s) => s.resetGame);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rank, setRank] = useState<number | null>(null);

  // ─── Prize state (all win types) ───
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [winPrizeState, setWinPrizeState] = useState<"idle" | "done" | "declined">("idle");

  useEffect(() => {
    if (!state || !state.winType) return;
    if (typeof window === "undefined") return;

    const alreadyDone = localStorage.getItem(LS_WIN_SUBMITTED);
    if (alreadyDone) {
      setWinPrizeState("done");
    } else {
      setShowPrizeForm(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const isPure = state.winType === "pure";
  const accent     = isPure ? "#8BC34A" : "#D4871A";
  const accentGlow = isPure ? "rgba(139,195,74,0.12)" : "rgba(212,135,26,0.12)";
  const accentDim  = isPure ? "rgba(139,195,74,0.06)" : "rgba(212,135,26,0.06)";
  const accentBorder = isPure ? "rgba(139,195,74,0.18)" : "rgba(212,135,26,0.18)";
  const shimmerClass = isPure ? "shimmer-text-green" : "shimmer-text";

  const totalHarvests  = state.rooms.reduce((s, r) => s + r.harvestCount, 0);
  const unlockedCount  = state.rooms.filter(r => r.unlocked).length;
  const netIncome      = state.totalRevenue - state.totalCosts;
  const totalSpent     = (state.totalSpentOnUpgrades || 0) + (state.totalSpentOnRooms || 0);
  const achievementCount = Object.keys(state.achievements || {}).length;

  const highestTiers = Object.entries(UPGRADE_TRACKS).map(([key, track]) => {
    let maxTier = 0;
    for (const tier of Object.values(state.upgrades[key] || {}) as number[]) {
      if (tier > maxTier) maxTier = tier;
    }
    return { key, name: track.name, icon: track.icon, maxTier, totalTiers: track.tiers.length };
  });

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      const finalCash = Math.round(state.cash);
      const { nonce, timestamp, salt } = await getSubmitTokenAction();
      const signature = await generateSignature(
        state.playerName, finalCash, unlockedCount, totalHarvests, timestamp, nonce, salt
      );
      const result = await submitScoreAction(
        state.playerName, finalCash, unlockedCount, totalHarvests, signature, timestamp, nonce
      );
      if (result.success) { setSubmitted(true); setRank(result.rank ?? null); }
      else alert("Failed to submit: " + (result.error || "Unknown error"));
    } catch (e) {
      console.error("Submit error:", e);
      alert("Network error — check your connection and try again.");
    }
    setSubmitting(false);
  };

  // ─── Sub-components ───────────────────────────────────

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${accent}30)` }} />
      <div style={{
        fontSize: 7.5, color: "#666", fontWeight: 600, letterSpacing: 3,
        fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
      }}>
        {children}
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}30, transparent)` }} />
    </div>
  );

  const StatCard = ({
    label, value, sub, color, delay = 0,
  }: { label: string; value: string | number; sub?: string; color?: string; delay?: number }) => (
    <div
      className="stat-reveal"
      style={{
        background: accentDim,
        borderRadius: 10,
        border: `1px solid ${accentBorder}`,
        padding: "14px 10px",
        textAlign: "center",
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        fontSize: 7.5, color: "#555", fontWeight: 600, letterSpacing: 2,
        marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: color || "#c8c8c8",
        fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: 0.5,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 8, color: "#484848", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={{
        minHeight: "100vh",
        background: isPure
          ? "linear-gradient(135deg, #060e06 0%, #0b170b 25%, #060c06 50%, #0d1606 75%, #060e06 100%)"
          : "linear-gradient(135deg, #0e0806 0%, #190d06 25%, #0e0b06 70%, #190e06 100%)",
        backgroundSize: "300% 300%",
        animation: "slow-bg 18s ease infinite",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "52px 16px 72px",
        overflowY: "auto",
      }}>
        {/* Top accent bar — matches modal style */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
          zIndex: 10,
        }} />

        <div style={{ maxWidth: 500, margin: "0 auto" }}>

          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            {isPure ? (
              <img
                src="/Bonsai_Rainbow.png"
                alt="Bonsai Cultivation"
                style={{ width: 172, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 20px" }}
              />
            ) : (
              <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>🏅</div>
            )}

            <div style={{
              width: 32, height: 1, margin: "0 auto 18px",
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }} />

            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 12, textTransform: "uppercase",
            }}>
              {isPure ? "Pure Run · No Vulture Capital" : "Vulture Capital Survivor"}
            </div>

            <h1 className={shimmerClass} style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 56, fontWeight: 700, margin: "0 0 8px",
              letterSpacing: 4, lineHeight: 1,
            }}>
              {isPure ? "You Made It" : "Survivor"}
            </h1>

            <p style={{ color: "#888", fontSize: 12, lineHeight: 2, margin: "22px 0 0" }}>
              10 years. Four crashes. A pandemic. You&apos;re still standing.{" "}
              {isPure
                ? "Bonsai Cultivation made it too — through market crashes, COVID, and a price compression that wiped out half the industry. We're still here, still growing, and grateful for every one of you who came along for the ride."
                : "So did Bonsai Cultivation — through market crashes, COVID, and a price compression that broke countless operators. We took the hard road and kept going. Thank you for playing."}
            </p>
          </div>

          {/* ── Prize confirmation banner ── */}
          <div style={{ marginBottom: 36 }}>
            {winPrizeState === "done" && (
              <div style={{
                background: "rgba(139,195,74,0.05)",
                border: "1px solid rgba(139,195,74,0.18)",
                borderRadius: 12, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#8BC34A", fontSize: 13, flexShrink: 0 }}>✓</span>
                  <span style={{
                    color: "#8BC34A", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 1, fontWeight: 700,
                  }}>
                    T-Shirt Claimed
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>👕</div>
                  <div style={{
                    color: "#6a8a6a", fontSize: 10, lineHeight: 1.7,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Your free Bonsai t-shirt is on its way. Check your email for your claim code and shipping confirmation.
                  </div>
                </div>
              </div>
            )}
            {winPrizeState === "declined" && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #222",
                borderRadius: 10, padding: "13px 20px",
              }}>
                <span style={{
                  color: "#444", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1,
                }}>
                  Spoils declined · Your t-shirt awaits if you change your mind
                </span>
                <button
                  onClick={() => setShowPrizeForm(true)}
                  style={{
                    background: "transparent", border: "1px solid #333",
                    borderRadius: 6, color: "#666", fontSize: 9,
                    padding: "5px 10px", cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
                    flexShrink: 0,
                  }}
                >
                  Reclaim →
                </button>
              </div>
            )}
          </div>

          {/* ── Financial ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionLabel>Financial</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <StatCard label="Final Cash"       value={formatCash(state.cash)}                          color={accent}  delay={0}   />
              <StatCard label="Net Income"        value={formatCash(netIncome)}                           color={netIncome >= 0 ? accent : "#ef5350"} sub="revenue − expenses" delay={60}  />
              <StatCard label="Wholesale Flower"  value={formatCash(state.totalWholesaleRevenue || 0)}   color={accent}  sub="harvest sales"   delay={120} />
              <StatCard label="Pre-Roll Sales"    value={formatCash(state.totalPrerollRevenue || 0)}     color={accent}  sub="monthly revenue" delay={180} />
              <StatCard label="Peak Cash"         value={formatCash(state.peakCash || state.cash)}       color="#c8c8c8" sub="highest balance"  delay={240} />
              <StatCard label="Lowest Cash"       value={formatCash(state.lowestCash ?? state.cash)}     color={(state.lowestCash ?? 0) < 0 ? "#ef5350" : "#c8c8c8"} sub="closest to death" delay={300} />
            </div>
          </div>

          {/* ── Operations ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionLabel>Operations</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <StatCard label="Harvests"     value={totalHarvests}                                  delay={0}   />
              <StatCard label="Lbs Produced" value={(state.totalLbsProduced || 0).toLocaleString()} delay={60}  />
              <StatCard label="Rooms"        value={`${unlockedCount}/9`}                           delay={120} />
            </div>
          </div>

          {/* ── Investment ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionLabel>Investment</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <StatCard label="Upgrades"    value={formatCash(state.totalSpentOnUpgrades || 0)} color="#ef5350" delay={0}   />
              <StatCard label="Rooms"       value={formatCash(state.totalSpentOnRooms || 0)}    color="#ef5350" delay={60}  />
              <StatCard label="Total Spent" value={formatCash(totalSpent)}                       color="#ef5350" delay={120} />
            </div>
          </div>

          {/* ── Upgrade Tiers ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionLabel>Upgrade Tiers</SectionLabel>
            <div style={{
              background: accentDim,
              borderRadius: 10, border: `1px solid ${accentBorder}`,
              padding: "2px 16px",
            }}>
              {highestTiers.map((t, i) => (
                <div key={t.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < highestTiers.length - 1 ? `1px solid ${accentBorder}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15 }}>{t.icon}</span>
                    <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>{t.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {Array.from({ length: t.totalTiers }).map((_, j) => (
                      <div key={j} style={{
                        width: 14, height: 3, borderRadius: 2,
                        background: j < t.maxTier ? accent : "rgba(255,255,255,0.05)",
                      }} />
                    ))}
                    <span style={{
                      fontSize: 8, fontWeight: 700, marginLeft: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: t.maxTier === t.totalTiers ? accent : t.maxTier > 0 ? "#666" : "#333",
                    }}>
                      {t.maxTier === t.totalTiers ? "MAX" : t.maxTier > 0 ? `T${t.maxTier}` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Achievements ── */}
          <div style={{ marginBottom: 36 }}>
            <SectionLabel>Achievements</SectionLabel>
            <div style={{
              background: accentDim, borderRadius: 10,
              border: `1px solid ${accentBorder}`, padding: "22px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 44, fontWeight: 700, color: accent,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                lineHeight: 1, marginBottom: 8,
              }}>
                {achievementCount}
                <span style={{ color: "#333", fontSize: 30, margin: "0 6px" }}>/</span>
                {ACHIEVEMENTS.length}
              </div>
              <div style={{ fontSize: 8, color: "#555", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>
                {achievementCount === ACHIEVEMENTS.length
                  ? "🏆 Perfect · 100% Complete"
                  : `${Math.round((achievementCount / ACHIEVEMENTS.length) * 100)}% complete`}
              </div>
            </div>
          </div>

          {/* ── Leaderboard ── */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "15px 42px",
                  background: submitting ? "#0f0f0f" : `linear-gradient(135deg, ${isPure ? "#3d6b10" : "#b8720e"}, ${isPure ? "#8BC34A" : "#FFB74D"})`,
                  color: submitting ? "#333" : isPure ? "#0a1a04" : "#0c0c0c",
                  border: submitting ? `1px solid #222` : "none",
                  borderRadius: 10, cursor: submitting ? "wait" : "pointer",
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
                  boxShadow: submitting ? "none" : `0 4px 32px ${accentGlow}`,
                  transition: "all 0.3s",
                }}
              >
                {submitting ? "Submitting…" : "Submit to Top 420 →"}
              </button>
            ) : (
              <div style={{
                padding: "14px 26px",
                background: accentDim,
                border: `1px solid ${accentBorder}`,
                borderRadius: 10, display: "inline-block",
              }}>
                <span style={{
                  color: accent, fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ✓ Submitted{rank ? ` · Rank #${rank}` : ""}
                </span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", paddingBottom: 8 }}>
            <button
              onClick={resetGame}
              style={{
                padding: "11px 30px", background: "transparent",
                color: "#666", border: "1px solid #333",
                borderRadius: 8, cursor: "pointer", fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
                textTransform: "uppercase", transition: "color 0.2s",
              }}
            >
              Play Again
            </button>
          </div>

        </div>
      </div>

      {/* T-shirt claim form — shown for all win types */}
      {showPrizeForm && (
        <DataCollectionModal
          mode="claim"
          gameEvent={isPure ? "win_pure" : "win_vc"}
          onSkip={() => { setShowPrizeForm(false); setWinPrizeState("declined"); }}
          onSuccess={() => { setShowPrizeForm(false); setWinPrizeState("done"); }}
        />
      )}
    </>
  );
}
