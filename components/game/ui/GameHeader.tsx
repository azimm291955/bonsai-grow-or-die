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
    <div className="px-3 pt-2 pb-2" style={{ borderBottom: "1px solid rgba(139,195,74,0.08)" }}>
      <div className="flex gap-0">

        {/* ── LEFT 2/3: Metrics ── */}
        <div className="flex-[2] min-w-0 pr-3 flex flex-col justify-between" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Row 1: Cash (fixed width) | RWY + AMR + Burn stacked */}
          <div className="flex items-start gap-0">
            {/* Cash: fixed-width zone */}
            <div className="w-[105px] shrink-0 pt-0.5">
              <div
                className="font-extrabold text-[28px] tracking-tight leading-none"
                style={{
                  color: cashColor,
                  textShadow: `0 0 30px ${cash > 0 ? "rgba(139,195,74,0.15)" : "rgba(239,83,80,0.25)"}`,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {formatCash(cash)}
              </div>
            </div>

            {/* RWY + AMR + Burn stacked — all aligned */}
            <div className="flex-1 flex flex-col gap-px pl-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-[#999] font-bold tracking-widest w-[32px]">RWY</span>
                <span
                  className="text-[14px] font-extrabold"
                  style={{ color: runwayColor, fontFamily: "var(--font-mono)" }}
                >
                  {monthsRunway !== null ? `${monthsRunway}mo` : "∞"}
                </span>
              </div>
              <button
                onClick={() => setShowAMRInfo(true)}
                className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
              >
                <span className="text-[8px] text-[#999] font-bold tracking-widest w-[32px]">AMR</span>
                <span className="text-[14px] font-bold text-[#FFB74D]" style={{ fontFamily: "var(--font-mono)" }}>
                  ${currentAMR}
                </span>
                <span className="text-[9px] text-[#777]">ⓘ</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-[#999] font-bold tracking-widest w-[32px]">BURN</span>
                <span className="text-[14px] font-bold text-[#ef5350]" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatCash(grossBurn)}<span className="text-[9px] text-[#777] font-normal">/mo</span>
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Name · Date | Runway (big) + VC */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#aaa] text-[11px] font-bold">{playerName}</span>
              <span className="text-[#555] text-[9px]">·</span>
              <span className="text-[#888] text-[11px] font-medium">{formatDate(gd)}</span>
            </div>
            <div className="flex items-center gap-2">
              {vcTaken && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.15)" }}
                >
                  <span className="text-[8px] text-[#ef5350] font-bold tracking-wide">VC</span>
                  <span className="text-[11px] font-bold text-[#ef5350]" style={{ fontFamily: "var(--font-mono)" }}>-15%</span>
                </div>
              )}
              <div
                className="text-[24px] font-extrabold leading-none"
                style={{ color: runwayColor, fontFamily: "var(--font-mono)" }}
              >
                {monthsRunway !== null ? `${monthsRunway}mo` : "∞"}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT 1/3: Timer ── */}
        <div className="flex-[1] pl-3">
          <SpeedControls />
        </div>

      </div>
    </div>
  );
}
