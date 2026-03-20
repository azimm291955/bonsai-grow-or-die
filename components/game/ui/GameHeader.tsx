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
              setGameSpeed(s);
              if (paused && hasState) resetTickTime();
              setPaused(false);
            }}
            className="flex-1 h-[32px] flex items-center justify-center text-[14px] font-extrabold rounded-md cursor-pointer transition-all"
            style={btn(!paused && gameSpeed === s)}
          >
            {s}×
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if (paused && hasState) resetTickTime();
          setPaused(!paused);
        }}
        className="w-full h-[32px] flex items-center justify-center text-[12px] font-bold tracking-wider rounded-md cursor-pointer transition-all"
        style={btn(paused)}
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

  if (!playerName || !rooms.length) return null;

  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);
  const quarter = getQuarter(gd.month);
  const currentAMR = getAMR(gd.year, quarter);
  const overhead = getAverageOverheadPerRoom(gd.year, upgrades, rooms);
  const activeRoomCount = rooms.filter((r: Room) => r.unlocked).length;
  const grossBurn = overhead ? overhead.total * activeRoomCount : 0;
  const monthsRunway = grossBurn > 0 && cash > 0 ? Math.floor(cash / grossBurn) : null;
  const cashColor = cash > 0 ? "#8BC34A" : "#ef5350";
  const runwayColor = monthsRunway === null ? "#888" : monthsRunway < 6 ? "#ef5350" : monthsRunway < 12 ? "#FFB74D" : "#8BC34A";

  return (
    <div className="px-2.5 pt-2 pb-2" style={{ borderBottom: "1px solid rgba(139,195,74,0.08)" }}>
      <div className="flex justify-between items-stretch">

        {/* ── SECTION 1 (1/3): Hero Cash + Name/Date ── */}
        <div
          className="flex-1 min-w-0 pr-2 relative overflow-hidden flex flex-col justify-center rounded-lg"
          style={{
            background: vcTaken ? "rgba(239,83,80,0.06)" : "transparent",
          }}
        >
          {/* Watermark: BONSAI default, VULTURE CAPITAL if VC taken */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: vcTaken ? 16 : 28,
              fontWeight: 900,
              letterSpacing: vcTaken ? 4 : 3,
              color: vcTaken ? "#ef5350" : cashColor,
              opacity: vcTaken ? 0.10 : 0.06,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {vcTaken ? "VULTURE CAPITAL" : "BONSAI"}
          </div>

          {/* Cash number */}
          <div
            className="relative z-10"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: -2,
              color: cashColor,
              textShadow: `0 0 40px ${cash > 0 ? "rgba(139,195,74,0.2)" : "rgba(239,83,80,0.3)"}`,
            }}
          >
            {formatCash(cash)}
          </div>

          {/* Name · Date — tight footer row */}
          <div className="relative z-10 flex justify-between items-center mt-1 gap-2">
            <span className="text-[#aaa] text-[10px] font-bold truncate min-w-0">{playerName}</span>
            <span className="text-[#ccc] text-[10px] font-medium shrink-0" style={{ fontFamily: "var(--font-mono)" }}>{formatDate(gd)}</span>
          </div>
        </div>

        {/* ── SECTION 2 (1/3): RUNWAY / AMR / BURN — data table ── */}
        <div
          className="flex-1 flex flex-col justify-between px-3 py-1.5 mx-3 rounded-lg self-stretch"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowRunwayInfo(true)}
              className="flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">RUNWAY</span>
              <span className="text-[8px] text-[#666]">ⓘ</span>
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
              onClick={() => setShowAMRInfo(true)}
              className="flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">AMR</span>
              <span className="text-[8px] text-[#666]">ⓘ</span>
            </button>
            <span className="text-[17px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "#8BC34A" }}>
              ${currentAMR}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowBurnInfo(true)}
              className="flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span className="text-[9px] text-[#888] font-bold tracking-widest">BURN</span>
              <span className="text-[8px] text-[#666]">ⓘ</span>
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
