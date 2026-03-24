"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchLeaderboardAction } from "@/app/actions/leaderboard";
import { formatCash } from "@/lib/helpers";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboardAction();
    setLeaderboard(data.entries || []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "#888", fontSize: 12, letterSpacing: 2, margin: 0 }}>TOP 420 LEADERBOARD</h3>
        <button onClick={refresh} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#555", fontSize: 10, padding: "4px 10px", cursor: "pointer" }}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {loading && leaderboard.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#444" }}>Loading leaderboard...</div>
      )}
      {!loading && leaderboard.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#444" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👑</div>
          <div style={{ fontSize: 13, color: "#555" }}>No entries yet. Be the first to survive.</div>
        </div>
      )}
      {leaderboard.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1 }}>#</th>
                <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1 }}>PLAYER</th>
                <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1 }}>CASH</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 50).map((entry, i) => {
                const isTop3 = i < 3;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 4px", fontSize: 12, color: isTop3 ? "#FFB74D" : "#666", fontWeight: isTop3 ? 800 : 400 }}>{isTop3 ? medals[i] : entry.rank}</td>
                    <td style={{ padding: "8px 4px", fontSize: 13, color: isTop3 ? "#fff" : "#aaa", fontWeight: isTop3 ? 700 : 400 }}>{entry.name}</td>
                    <td style={{ padding: "8px 4px", fontSize: 13, color: "#8BC34A", fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCash(entry.cash)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {leaderboard.length > 50 && (
            <div style={{ textAlign: "center", padding: "12px 0", fontSize: 10, color: "#444" }}>Showing top 50 of {leaderboard.length}</div>
          )}
        </div>
      )}
    </div>
  );
}
