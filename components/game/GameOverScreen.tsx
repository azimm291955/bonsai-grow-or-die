"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { formatCash, getCurrentGameDate } from "@/lib/helpers";
import { GAME_START_DATE } from "@/lib/constants";
import { getClaimStatusAction } from "@/app/actions/claims";

/** Calculate survival time from game start to current game date */
function getSurvivalLabel(gameStartRealMs: number, bonusGameDays: number): string {
  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);
  const totalMonths =
    (gd.year - GAME_START_DATE.year) * 12 +
    (gd.month - GAME_START_DATE.month);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years <= 0 && months <= 0) return "< 1 month";
  if (years <= 0) return `${months} month${months !== 1 ? "s" : ""}`;
  if (months === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}`;
}

export default function GameOverScreen() {
  const state = useGameStore((s) => s.state);
  const resetGame = useGameStore((s) => s.resetGame);

  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const capacity = 2000;

  useEffect(() => {
    getClaimStatusAction().then(({ count }) => setSpotsLeft(capacity - count));
  }, []);

  if (!state) return null;

  const survival = getSurvivalLabel(state.gameStartRealMs, state.bonusGameDays);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1a1a1a 0%, #2a1010 50%, #1a1a1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "32px 16px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💀</div>
        <h1
          style={{
            color: "#ef5350",
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            letterSpacing: 2,
          }}
        >
          GAME OVER
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>
          {state.deathCause || "The lights went off."}
        </p>
        <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
          Final cash:{" "}
          <span style={{ color: "#ef5350", fontWeight: 700 }}>
            {formatCash(state.cash)}
          </span>
        </p>

        {/* Survival time */}
        <div
          style={{
            marginTop: 20,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "14px 20px",
            display: "inline-block",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#555",
              letterSpacing: 2.5,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 4,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Survived
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#c8c8c8",
              fontWeight: 700,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              letterSpacing: 0.5,
            }}
          >
            {survival}
          </div>
        </div>

        {/* Re-motivation with live tee count */}
        <p
          style={{
            color: "#666",
            fontSize: 12,
            marginTop: 24,
            lineHeight: 1.8,
            fontFamily: "'JetBrains Mono', monospace",
            maxWidth: 340,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          The grow goes dark
          {spotsLeft !== null && spotsLeft > 0 ? (
            <>
              ... but{" "}
              <span style={{ color: "#8BC34A", fontWeight: 700 }}>
                {spotsLeft.toLocaleString()} tees
              </span>{" "}
              are still under the lights.
              <br />
              <span style={{ color: "#888" }}>Don&apos;t give up now.</span>
            </>
          ) : spotsLeft !== null ? (
            <>
              ... all tees have been claimed.
              <br />
              <span style={{ color: "#888" }}>
                But the leaderboard is still open.
              </span>
            </>
          ) : (
            "."
          )}
        </p>

        <button
          onClick={resetGame}
          style={{
            marginTop: 28,
            padding: "14px 36px",
            background: "rgba(139,195,74,0.08)",
            color: "#8BC34A",
            border: "1px solid rgba(139,195,74,0.25)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
