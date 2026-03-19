"use client";

import { useGameStore } from "@/store/useGameStore";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENTS } from "@/lib/constants";

export default function AchievementsTab() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const totalUnlocked = Object.keys(state.achievements || {}).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "#888", fontSize: 12, letterSpacing: 2, margin: 0 }}>ACHIEVEMENTS</h3>
        <span style={{ fontSize: 10, color: "#444" }}>
          {totalUnlocked} / {ACHIEVEMENTS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ width: `${(totalUnlocked / ACHIEVEMENTS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #8BC34A, #FFB74D)", borderRadius: 3, transition: "width 0.5s" }} />
      </div>

      {ACHIEVEMENT_CATEGORIES.map(cat => {
        const catAchs = ACHIEVEMENTS.filter(a => a.cat === cat.id);
        if (catAchs.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: 2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{cat.icon}</span> {cat.name.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catAchs.map(ach => {
                const unlocked = state.achievements?.[ach.id];
                const progress = state.achievementProgress?.[ach.id] ?? 0;
                const progressPct = ach.maxProgress > 1 ? Math.min(progress / ach.maxProgress, 1) : (unlocked ? 1 : 0);

                return (
                  <div key={ach.id} style={{
                    background: unlocked ? "rgba(139,195,74,0.06)" : "rgba(255,255,255,0.02)",
                    border: unlocked ? "1px solid rgba(139,195,74,0.15)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    opacity: unlocked ? 1 : 0.5,
                  }}>
                    <div style={{ fontSize: 22, minWidth: 30, textAlign: "center" }}>
                      {unlocked ? ach.badge : "🔒"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: unlocked ? "#ccc" : "#666", fontWeight: 700 }}>
                        {ach.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                        {ach.desc}
                      </div>
                      {/* Progress bar for multi-step achievements */}
                      {ach.maxProgress > 1 && !unlocked && (
                        <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ width: `${progressPct * 100}%`, height: "100%", background: "#8BC34A", borderRadius: 2, transition: "width 0.5s" }} />
                        </div>
                      )}
                    </div>
                    {unlocked && (
                      <div style={{ fontSize: 14, color: "#8BC34A" }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
