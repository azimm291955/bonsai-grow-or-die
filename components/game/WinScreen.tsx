"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { submitScoreAction, getSubmitTokenAction } from "@/app/actions/leaderboard";
import { formatCash } from "@/lib/helpers";
import { UPGRADE_TRACKS, ACHIEVEMENTS, MS_PER_GAME_DAY } from "@/lib/constants";
import { msToGameDate } from "@/lib/helpers";
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

  // On mount: if pure win, handle 5-joint prize
  useEffect(() => {
    if (!state || state.winType !== "pure") return;
    if (typeof window === "undefined") return;

    const alreadyWinSubmitted = localStorage.getItem(LS_WIN_SUBMITTED);
    if (alreadyWinSubmitted) {
      // Already claimed — just show confirmation
      setWinPrizeState("done");
      return;
    }

    const raw = localStorage.getItem(LS_FORM_DATA);
    if (raw) {
      // They registered at Mar 1 — auto-submit a win entry with their stored data
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
        .then(() => {
          localStorage.setItem(LS_WIN_SUBMITTED, "true");
          setWinPrizeState("done");
        })
        .catch(() => {
          // Submission failed silently — show the form as fallback
          setWinPrizeState("idle");
          setShowJointForm(true);
        });
    } else {
      // Played anonymous — show form for 5 joints
      setShowJointForm(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  if (!state) return null;

  const totalHarvests = state.rooms.reduce((s, r) => s + r.harvestCount, 0);
  const unlockedCount = state.rooms.filter(r => r.unlocked).length;
  const netIncome = state.totalRevenue - state.totalCosts;
  const totalSpent = (state.totalSpentOnUpgrades || 0) + (state.totalSpentOnRooms || 0);
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

      // Get server-generated token (nonce + timestamp + salt)
      // Server timestamp eliminates clock skew. Nonce is single-use in Redis.
      const { nonce, timestamp, salt } = await getSubmitTokenAction();

      const signature = await generateSignature(
        state.playerName, finalCash, unlockedCount, totalHarvests, timestamp, nonce, salt
      );

      const result = await submitScoreAction(
        state.playerName, finalCash, unlockedCount, totalHarvests, signature, timestamp, nonce
      );
      if (result.success) {
        setSubmitted(true);
        setRank(result.rank ?? null);
      } else {
        alert("Failed to submit: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      console.error("Submit error:", e);
      alert("Network error — check your connection and try again.");
    }
    setSubmitting(false);
  };

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 8, color: "#555", fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#fff" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <>
    <div style={{
      minHeight: "100vh",
      background: state.winType === "pure"
        ? "linear-gradient(135deg, #1a1a1a 0%, #2d4a1a 50%, #1a1a1a 100%)"
        : "linear-gradient(135deg, #1a1a1a 0%, #3a2a1a 50%, #1a1a1a 100%)",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 16px", overflowY: "auto",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {state.winType === "pure"
            ? <img src="/Bonsai_Rainbow.png" alt="Bonsai Cultivation" style={{ width: 160, height: "auto", objectFit: "contain", marginBottom: 12 }} />
            : <div style={{ fontSize: 64, marginBottom: 12 }}>🏅</div>}
          <h1 style={{ color: state.winType === "pure" ? "#8BC34A" : "#FFB74D", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: 2 }}>
            {state.winType === "pure" ? "YOU MADE IT" : "SURVIVOR"}
          </h1>
          <p style={{ color: "#888", fontSize: 11, letterSpacing: 4, marginTop: 6 }}>
            {state.winType === "pure" ? "PURE RUN — NO VULTURE CAPITAL" : "VULTURE CAPITAL SURVIVOR"}
          </p>
          <p style={{ color: "#999", fontSize: 13, lineHeight: 1.8, margin: "16px 0 0" }}>
            12 years. Four crashes. A pandemic. You&apos;re still standing.{" "}
            {state.winType === "pure"
              ? "Bonsai Cultivation made it too — through market crashes, COVID, and a compression that wiped out half the industry. We're still here, still growing, and grateful for every one of you who came along for the ride."
              : "So did Bonsai Cultivation — through market crashes, COVID, and a price compression that broke countless operators. We took the hard road and kept going. Thank you for playing."}
          </p>
        </div>

        {state.winType === "pure" && (
          <>
            {winPrizeState === "done" ? (
              <div style={{ background: "#1f2e1a", border: "2px solid #8BC34A", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
                <img src="/Space_Jam_Logo.png" alt="Space Jam Dispensary" style={{ width: 90, height: "auto", objectFit: "contain", marginBottom: 10 }} />
                <p style={{ color: "#8BC34A", fontSize: 16, fontWeight: 700, margin: 0 }}>🎉 5 Joints Claimed!</p>
                <img src="/Space_Jam_Logo.png" alt="Space Jam Dispensary" style={{ width: 70, height: "auto", objectFit: "contain", marginTop: 10, marginBottom: 4 }} />
                <p style={{ color: "#666", fontSize: 11, marginTop: 2 }}>1810 S Broadway, Denver, CO 80210</p>
                <p style={{ color: "#666", fontSize: 11, marginTop: 2 }}>(720) 986-0882</p>
                <p style={{ color: "#555", fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>We&apos;ll be in touch with redemption details.</p>
              </div>
            ) : winPrizeState === "submitting" ? (
              <div style={{ background: "#2a2a2a", border: "2px solid #555", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
                <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Registering your 5-joint prize…</p>
              </div>
            ) : !showJointForm ? (
              <div style={{ background: "#1a1a2e", border: "2px solid rgba(100,200,255,0.4)", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
                <img src="/Space_Jam_Logo.png" alt="Space Jam Dispensary" style={{ width: 100, height: "auto", objectFit: "contain", marginBottom: 10 }} />
                <p style={{ color: "#FFB74D", fontSize: 16, fontWeight: 700, margin: 0 }}>🏆 You won 5 free joints!</p>
                <img src="/Space_Jam_Logo.png" alt="Space Jam Dispensary" style={{ width: 70, height: "auto", objectFit: "contain", marginTop: 10, marginBottom: 4 }} />
                <a href="https://maps.google.com/?q=1810+S+Broadway+Denver+CO+80210" target="_blank" rel="noopener noreferrer" style={{ color: "#64B5F6", fontSize: 11, marginTop: 4, display: "block", textDecoration: "none" }}>📍 1810 S Broadway, Denver, CO 80210</a>
                <a href="tel:7209860882" style={{ color: "#64B5F6", fontSize: 11, marginTop: 2, display: "block", textDecoration: "none" }}>📞 (720) 986-0882</a>
                <p style={{ color: "#777", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>Pure run reward — register to claim at Space Jam.</p>
                <button
                  onClick={() => setShowJointForm(true)}
                  style={{ marginTop: 12, padding: "10px 26px", background: "linear-gradient(135deg, #1565C0, #42A5F5)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}
                >
                  Claim Now →
                </button>
              </div>
            ) : null}
          </>
        )}

        <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>FINANCIAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          <StatCard label="FINAL CASH" value={formatCash(state.cash)} color="#8BC34A" />
          <StatCard label="NET INCOME" value={formatCash(netIncome)} color={netIncome >= 0 ? "#8BC34A" : "#ef5350"} sub="revenue − expenses" />
          <StatCard label="WHOLESALE FLOWER" value={formatCash(state.totalWholesaleRevenue || 0)} color="#8BC34A" sub="harvest sales" />
          <StatCard label="PRE-ROLL SALES" value={formatCash(state.totalPrerollRevenue || 0)} color="#8BC34A" sub="monthly revenue" />
          <StatCard label="PEAK CASH" value={formatCash(state.peakCash || state.cash)} color="#FFB74D" sub="highest balance" />
          <StatCard label="LOWEST CASH" value={formatCash(state.lowestCash ?? state.cash)} color={(state.lowestCash ?? 0) < 0 ? "#ef5350" : "#FFB74D"} sub="closest to death" />
        </div>

        <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>OPERATIONS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          <StatCard label="HARVESTS" value={totalHarvests} color="#fff" />
          <StatCard label="LBS PRODUCED" value={(state.totalLbsProduced || 0).toLocaleString()} color="#fff" />
          <StatCard label="ROOMS" value={unlockedCount} color="#fff" sub="of 9" />
        </div>

        <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>INVESTMENT</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          <StatCard label="UPGRADES" value={formatCash(state.totalSpentOnUpgrades || 0)} color="#ef5350" />
          <StatCard label="ROOMS" value={formatCash(state.totalSpentOnRooms || 0)} color="#ef5350" />
          <StatCard label="TOTAL SPENT" value={formatCash(totalSpent)} color="#ef5350" />
        </div>

        <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>UPGRADE TIERS (HIGHEST PER TRACK)</div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px", marginBottom: 20 }}>
          {highestTiers.map(t => (
            <div key={t.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontSize: 12, color: "#aaa" }}>{t.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {Array.from({ length: t.totalTiers }).map((_, i) => (
                  <div key={i} style={{ width: 16, height: 4, borderRadius: 2, background: i < t.maxTier ? "#8BC34A" : "rgba(255,255,255,0.08)" }} />
                ))}
                <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 6, color: t.maxTier === t.totalTiers ? "#8BC34A" : t.maxTier > 0 ? "#FFB74D" : "#555" }}>
                  {t.maxTier === t.totalTiers ? "MAX" : t.maxTier > 0 ? `T${t.maxTier}` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#666", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>ACHIEVEMENTS</div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "14px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#FFB74D" }}>{achievementCount} / {ACHIEVEMENTS.length}</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
            {achievementCount === ACHIEVEMENTS.length ? "🏆 100% — Perfect run!" : `${Math.round((achievementCount / ACHIEVEMENTS.length) * 100)}% complete`}
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {!submitted ? (
            <button onClick={handleSubmit} disabled={submitting} style={{
              padding: "14px 36px",
              background: submitting ? "rgba(255,183,77,0.3)" : "linear-gradient(135deg, #F57C00, #FFB74D)",
              color: submitting ? "#999" : "#1a1a1a", border: "none", borderRadius: 8,
              cursor: submitting ? "wait" : "pointer", fontSize: 14, fontWeight: 700,
              boxShadow: submitting ? "none" : "0 2px 16px rgba(255,183,77,0.3)", letterSpacing: 1, transition: "all 0.3s",
            }}>
              {submitting ? "Submitting..." : "👑 Submit to Top 420 Leaderboard"}
            </button>
          ) : (
            <div style={{ padding: "10px 20px", background: "rgba(139,195,74,0.08)", border: "1px solid rgba(139,195,74,0.2)", borderRadius: 8, display: "inline-block" }}>
              <span style={{ color: "#8BC34A", fontSize: 13, fontWeight: 700 }}>✓ Submitted! {rank ? `Rank #${rank}` : ""}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", paddingBottom: 40 }}>
          <button onClick={resetGame} style={{ padding: "12px 32px", background: "#333", color: "#aaa", border: "1px solid #555", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Play Again</button>
        </div>
      </div>
    </div>

    {/* 5-joint claim form for anonymous players who won a pure run */}
    {showJointForm && state.winType === "pure" && (
      <DataCollectionModal
        jointCount={5}
        onSkip={() => setShowJointForm(false)}
        onSuccess={() => {
          setShowJointForm(false);
          setWinPrizeState("done");
        }}
      />
    )}
    </>
  );
}
