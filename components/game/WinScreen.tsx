"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { submitScoreAction, getSubmitTokenAction } from "@/app/actions/leaderboard";
import { formatCash } from "@/lib/helpers";
import { UPGRADE_TRACKS, ACHIEVEMENTS } from "@/lib/constants";
import DataCollectionModal, {
  LS_FORM_DATA, LS_WIN_SUBMITTED, SavedFormData,
} from "./modals/DataCollectionModal";

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

  // ─── Prize state (pure-win only) ───
  const [showJointForm, setShowJointForm] = useState(false);
  const [winPrizeState, setWinPrizeState] = useState<"idle" | "submitting" | "done">("idle");

  useEffect(() => {
    if (!state || state.winType !== "pure") return;
    if (typeof window === "undefined") return;

    const alreadyWinSubmitted = localStorage.getItem(LS_WIN_SUBMITTED);
    if (alreadyWinSubmitted) { setWinPrizeState("done"); return; }

    const raw = localStorage.getItem(LS_FORM_DATA);
    if (raw) {
      const data: SavedFormData = JSON.parse(raw);
      setWinPrizeState("submitting");
      const body = new FormData();
      body.append("name", data.name);
      body.append("email", data.email);
      body.append("phone", data.phone);
      body.append("joint_count", "5");
      body.append("game_event", "win_pure");
      fetch("https://formspree.io/f/xwvwqwqo", { method: "POST", body, headers: { Accept: "application/json" } })
        .then(r => r.ok ? r : Promise.reject(r))
        .then(() => { localStorage.setItem(LS_WIN_SUBMITTED, "true"); setWinPrizeState("done"); })
        .catch(() => { setWinPrizeState("idle"); setShowJointForm(true); });
    } else {
      setShowJointForm(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const isPure = state.winType === "pure";
  const accent      = isPure ? "#C9A96E" : "#D4871A";
  const accentGlow  = isPure ? "rgba(201,169,110,0.12)" : "rgba(212,135,26,0.12)";
  const headlineClr = isPure ? "#8BC34A" : "#FFB74D";

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
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #1e1e1e)" }} />
      <div style={{
        fontSize: 7.5, color: "#303030", fontWeight: 600, letterSpacing: 3,
        fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
      }}>
        {children}
      </div>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1e1e1e, transparent)" }} />
    </div>
  );

  const StatCard = ({
    label, value, sub, color, delay = 0,
  }: { label: string; value: string | number; sub?: string; color?: string; delay?: number }) => (
    <div
      className="stat-reveal"
      style={{
        background: "rgba(255,255,255,0.018)",
        borderRadius: 10,
        border: "1px solid #161616",
        padding: "14px 10px",
        textAlign: "center",
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        fontSize: 7.5, color: "#2e2e2e", fontWeight: 600, letterSpacing: 2,
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
        <div style={{ fontSize: 8, color: "#2a2a2a", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
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

            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: headlineClr,
              fontSize: 56, fontWeight: 700, margin: "0 0 8px",
              letterSpacing: 4, lineHeight: 1,
              textShadow: `0 0 80px ${headlineClr}30`,
            }}>
              {isPure ? "You Made It" : "Survivor"}
            </h1>

            <p style={{
              color: "#2a2a2a", fontSize: 7.5, letterSpacing: 4.5,
              margin: "10px 0 0", textTransform: "uppercase",
            }}>
              {isPure ? "Pure Run · No Vulture Capital" : "Vulture Capital Survivor"}
            </p>

            <p style={{ color: "#484848", fontSize: 12, lineHeight: 2, margin: "22px 0 0" }}>
              12 years. Four crashes. A pandemic. You&apos;re still standing.{" "}
              {isPure
                ? "Bonsai Cultivation made it too — through market crashes, COVID, and a compression that wiped out half the industry. We're still here, still growing, and grateful for every one of you who came along for the ride."
                : "So did Bonsai Cultivation — through market crashes, COVID, and a price compression that broke countless operators. We took the hard road and kept going. Thank you for playing."}
            </p>
          </div>

          {/* ── Prize section (pure win only) ── */}
          {isPure && (
            <div style={{ marginBottom: 40 }}>
              {winPrizeState === "done" ? (
                <div style={{
                  background: "rgba(139,195,74,0.04)",
                  border: "1px solid rgba(139,195,74,0.15)",
                  borderRadius: 14, padding: "26px 20px", textAlign: "center",
                }}>
                  <img
                    src="/Space_Jam_Logo.png"
                    alt="Space Jam Dispensary"
                    style={{ width: 76, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 14px" }}
                  />
                  <p style={{
                    color: "#8BC34A", fontSize: 20, fontWeight: 600, margin: "0 0 8px",
                    fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: 1,
                  }}>
                    Five Joints Claimed
                  </p>
                  <p style={{ color: "#303030", fontSize: 9, margin: "0 0 4px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                    1810 S Broadway, Denver, CO 80210
                  </p>
                  <p style={{ color: "#303030", fontSize: 9, margin: "0 0 8px", fontFamily: "'JetBrains Mono', monospace" }}>
                    (720) 986-0882
                  </p>
                  <p style={{ color: "#252525", fontSize: 9, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    We&apos;ll be in touch with redemption details.
                  </p>
                </div>
              ) : winPrizeState === "submitting" ? (
                <div style={{
                  background: "#0d0d0d", border: "1px solid #1a1a1a",
                  borderRadius: 14, padding: 22, textAlign: "center",
                }}>
                  <p style={{ color: "#363636", fontSize: 11, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    Registering your 5-joint prize…
                  </p>
                </div>
              ) : !showJointForm ? (
                <div style={{
                  background: `${accent}07`,
                  border: `1px solid ${accent}20`,
                  borderRadius: 14, padding: "26px 20px", textAlign: "center",
                }}>
                  <img
                    src="/Space_Jam_Logo.png"
                    alt="Space Jam Dispensary"
                    style={{ width: 76, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 14px" }}
                  />
                  <p style={{
                    color: accent, fontSize: 20, fontWeight: 600, margin: "0 0 8px",
                    fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: 1,
                  }}>
                    Five Free Joints
                  </p>
                  <a
                    href="https://maps.google.com/?q=1810+S+Broadway+Denver+CO+80210"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "#4d8ab5", fontSize: 9, display: "block", textDecoration: "none", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    📍 1810 S Broadway, Denver, CO 80210
                  </a>
                  <a
                    href="tel:7209860882"
                    style={{ color: "#4d8ab5", fontSize: 9, display: "block", textDecoration: "none", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    📞 (720) 986-0882
                  </a>
                  <p style={{ color: "#363636", fontSize: 10, margin: "0 0 18px", lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace" }}>
                    Pure run reward — register to claim at Space Jam.
                  </p>
                  <button
                    onClick={() => setShowJointForm(true)}
                    style={{
                      padding: "11px 30px",
                      background: `linear-gradient(135deg, #b86812, #F09830)`,
                      color: "#fff", border: "none", borderRadius: 8,
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
                      boxShadow: `0 4px 20px ${accentGlow}`,
                    }}
                  >
                    Claim Now →
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Financial ── */}
          <div style={{ marginBottom: 30 }}>
            <SectionLabel>Financial</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <StatCard label="Final Cash"       value={formatCash(state.cash)}                          color="#8BC34A" delay={0}   />
              <StatCard label="Net Income"        value={formatCash(netIncome)}                           color={netIncome >= 0 ? "#8BC34A" : "#ef5350"} sub="revenue − expenses" delay={60}  />
              <StatCard label="Wholesale Flower"  value={formatCash(state.totalWholesaleRevenue || 0)}   color="#8BC34A" sub="harvest sales"    delay={120} />
              <StatCard label="Pre-Roll Sales"    value={formatCash(state.totalPrerollRevenue || 0)}     color="#8BC34A" sub="monthly revenue"  delay={180} />
              <StatCard label="Peak Cash"         value={formatCash(state.peakCash || state.cash)}       color={accent}  sub="highest balance"  delay={240} />
              <StatCard label="Lowest Cash"       value={formatCash(state.lowestCash ?? state.cash)}     color={(state.lowestCash ?? 0) < 0 ? "#ef5350" : accent} sub="closest to death" delay={300} />
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
              background: "rgba(255,255,255,0.015)",
              borderRadius: 10, border: "1px solid #141414",
              padding: "2px 16px",
            }}>
              {highestTiers.map((t, i) => (
                <div key={t.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < highestTiers.length - 1 ? "1px solid rgba(255,255,255,0.022)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15 }}>{t.icon}</span>
                    <span style={{ fontSize: 11, color: "#484848", fontFamily: "'JetBrains Mono', monospace" }}>{t.name}</span>
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
                      color: t.maxTier === t.totalTiers ? "#8BC34A" : t.maxTier > 0 ? accent : "#222",
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
              background: "rgba(255,255,255,0.015)", borderRadius: 10,
              border: "1px solid #141414", padding: "22px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 44, fontWeight: 700, color: accent,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                lineHeight: 1, marginBottom: 8,
              }}>
                {achievementCount}
                <span style={{ color: "#1e1e1e", fontSize: 30, margin: "0 6px" }}>/</span>
                {ACHIEVEMENTS.length}
              </div>
              <div style={{ fontSize: 8, color: "#282828", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>
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
                  background: submitting ? "#0f0f0f" : "linear-gradient(135deg, #b8720e, #FFB74D)",
                  color: submitting ? "#282828" : "#0c0c0c",
                  border: submitting ? "1px solid #1e1e1e" : "none",
                  borderRadius: 10, cursor: submitting ? "wait" : "pointer",
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
                  boxShadow: submitting ? "none" : "0 4px 32px rgba(255,183,77,0.2)",
                  transition: "all 0.3s",
                }}
              >
                {submitting ? "Submitting…" : "Submit to Top 420 →"}
              </button>
            ) : (
              <div style={{
                padding: "14px 26px",
                background: "rgba(139,195,74,0.05)",
                border: "1px solid rgba(139,195,74,0.12)",
                borderRadius: 10, display: "inline-block",
              }}>
                <span style={{
                  color: "#8BC34A", fontSize: 11, fontWeight: 700,
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
                color: "#252525", border: "1px solid #161616",
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

      {/* 5-joint claim form for anonymous players who won a pure run */}
      {showJointForm && isPure && (
        <DataCollectionModal
          jointCount={5}
          onSkip={() => setShowJointForm(false)}
          onSuccess={() => { setShowJointForm(false); setWinPrizeState("done"); }}
        />
      )}
    </>
  );
}
