"use client";

import { useGameStore } from "@/store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { getCurrentGameDate, getQuarter, getAMR, getAverageOverheadPerRoom, formatCash, formatDate } from "@/lib/helpers";
import type { Room, Upgrades } from "@/lib/types";

// ── Speed Controls (right 1/3) ──────────────────────────────────────────────

function SpeedControls() {
  const gameSpeed = useGameStore((s) => s.ui.gameSpeed);
  const paused = useGameStore((s) => s.ui.paused);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const setPaused = useGameStore((s) => s.setPaused);
  const hasState = useGameStore((s) => !!s.state);
  const inTutorial = useGameStore((s) => (s.state?.tutorialStep ?? 0) < 5);

  const resetTickTime = () => {
    useGameStore.setState((store) => ({
      state: store.state ? { ...store.state, lastTickRealMs: Date.now() } : store.state,
    }));
  };

  const btn = (active: boolean) => ({
    background: active ? "rgba(139,195,74,0.18)" : "rgba(255,255,255,0.05)",
    border: active ? "1.5px solid rgba(139,195,74,0.45)" : "1.5px solid rgba(255,255,255,0.08)",
    color: active ? "#8BC34A" : "#777",
  });

  return (
    <div className="flex flex-col gap-1 items-stretch h-full justify-center" data-tutorial="speed-controls">
      <div className="flex gap-1">
        {[1, 32, 64].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (inTutorial) return;
              setGameSpeed(s);
              if (paused && hasState) resetTickTime();
              setPaused(false);
            }}
            disabled={inTutorial}
            className={`flex-1 h-[32px] flex items-center justify-center text-[14px] font-extrabold rounded-md transition-all ${inTutorial ? "cursor-not-allowed" : "cursor-pointer"}`}
            style={{ ...btn(!paused && gameSpeed === s), ...(inTutorial ? { opacity: 0.3 } : {}) }}
          >
            {s}×
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if (inTutorial) return;
          if (paused && hasState) resetTickTime();
          setPaused(!paused);
        }}
        disabled={inTutorial}
        className={`w-full h-[32px] flex items-center justify-center text-[12px] font-bold tracking-wider rounded-md transition-all ${inTutorial ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{ ...btn(paused), ...(inTutorial ? { opacity: 0.3 } : {}) }}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? "▶  PLAY" : "⏸  PAUSE"}
      </button>
    </div>
  );
}

// ── Game Header (unified) ───────────────────────────────────────────────────

export default function GameHeader() {
  const { playerName, cash, gameStartRealMs, bonusGameDays, rooms, upgrades, vcTaken } = useGameStore(
    useShallow((s) => ({
      playerName: s.state?.playerName ?? "",
      cash: s.state?.cash ?? 0,
      gameStartRealMs: s.state?.gameStartRealMs ?? 0,
      bonusGameDays: s.state?.bonusGameDays ?? 0,
      rooms: s.state?.rooms ?? [],
      upgrades: s.state?.upgrades ?? ({} as Upgrades),
      vcTaken: s.state?.vcTaken ?? false,
    }))
  );
  const setShowAMRInfo = useGameStore((s) => s.setShowAMRInfo);
  const setShowRunwayInfo = useGameStore((s) => s.setShowRunwayInfo);
  const setShowBurnInfo = useGameStore((s) => s.setShowBurnInfo);
  const inTutorial = useGameStore((s) => (s.state?.tutorialStep ?? 0) < 5);

  if (!playerName || !rooms.length) return null;

  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);
  const quarter = getQuarter(gd.month);
  const currentAMR = getAMR(gd.year, quarter);
  const overhead = getAverageOverheadPerRoom(gd.year, upgrades, rooms);
  const activeRoomCount = rooms.filter((r: Room) => r.unlocked).length;
  const grossBurn = overhead ? overhead.total * activeRoomCount : 0;
  const monthsRunway = grossBurn > 0 && cash > 0 ? Math.floor(cash / grossBurn) : null;
  const cashStr = formatCash(cash);
  const cashFontSize = cashStr.length >= 7 ? 30 : cashStr.length >= 6 ? 36 : 44;
  const cashColor = cash > 0 ? "#8BC34A" : "#ef5350";
  const runwayColor = monthsRunway === null ? "#888" : monthsRunway < 6 ? "#ef5350" : monthsRunway < 12 ? "#FFB74D" : "#8BC34A";

  return (
    <div className="px-2.5 pt-2 pb-2" style={{ borderBottom: "1px solid rgba(139,195,74,0.08)" }}>
      <div className="flex items-stretch gap-5">

        {/* ── SECTION 1 (1/3): Hero Cash + Name/Date ── */}
        <div
          className="flex-1 min-w-0 pr-2 relative flex flex-col justify-center rounded-lg"
          style={{
            background: vcTaken ? "rgba(239,83,80,0.06)" : "transparent",
          }}
        >
          {/* Cash number */}
          <div
            className="relative z-10"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: cashFontSize,
              lineHeight: 1,
              letterSpacing: -2,
              color: cashColor,
              textShadow: `0 0 40px ${cash > 0 ? "rgba(139,195,74,0.2)" : "rgba(239,83,80,0.3)"}`,
            }}
          >
            {cashStr}
          </div>

          {/* Name · Date — tight footer row */}
          <div className="relative z-10 flex justify-between items-center mt-1 gap-2">
            <span className="text-[#aaa] text-[10px] font-bold truncate min-w-0">{playerName}</span>
            <span className="text-[#ccc] text-[10px] font-medium shrink-0" style={{ fontFamily: "var(--font-mono)" }}>{formatDate(gd)}</span>
          </div>
        </div>

        {/* ── SECTION 2 (1/3): RUNWAY / AMR / BURN — data table ── */}
        <div
          className="flex-1 flex flex-col justify-between px-5 py-1.5 rounded-lg self-stretch"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex justify-between items-center">
            <button
              onClick={() => { if (!inTutorial) setShowRunwayInfo(true); }}
              disabled={inTutorial}
              className={`flex items-center gap-0.5 bg-transparent border-none p-0 ${inTutorial ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">RUNWAY</span>
              {!inTutorial && <span className="text-[8px] text-[#666]">ⓘ</span>}
            </button>
            <span
              className="text-[17px] font-extrabold"
              style={{ color: runwayColor, fontFamily: "var(--font-mono)" }}
            >
              {monthsRunway !== null ? `${monthsRunway}mo` : "∞"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => { if (!inTutorial) setShowAMRInfo(true); }}
              disabled={inTutorial}
              className={`flex items-center gap-0.5 bg-transparent border-none p-0 ${inTutorial ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">AMR</span>
              {!inTutorial && <span className="text-[8px] text-[#666]">ⓘ</span>}
            </button>
            <span className="text-[17px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "#8BC34A" }}>
              ${currentAMR}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => { if (!inTutorial) setShowBurnInfo(true); }}
              disabled={inTutorial}
              className={`flex items-center gap-0.5 bg-transparent border-none p-0 ${inTutorial ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">BURN</span>
              {!inTutorial && <span className="text-[8px] text-[#666]">ⓘ</span>}
            </button>
            <span className="text-[17px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "#ef5350" }}>
              {formatCash(grossBurn)}<span className="text-[10px] text-[#666] font-normal">/mo</span>
            </span>
          </div>
        </div>

        {/* ── SECTION 3 (1/3): Timer ── */}
        <div className="flex-1 pl-2">
          <SpeedControls />
        </div>

      </div>
    </div>
  );
}
