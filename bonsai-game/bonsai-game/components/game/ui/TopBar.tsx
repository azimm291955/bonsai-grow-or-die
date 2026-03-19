"use client";

import Image from "next/image";
import { useGameStore } from "@/store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { getCurrentGameDate, formatCash, formatDate } from "@/lib/helpers";

export default function TopBar() {
  const { playerName, cash, gameStartRealMs, bonusGameDays } = useGameStore(
    useShallow((s) => ({
      playerName: s.state?.playerName ?? "",
      cash: s.state?.cash ?? 0,
      gameStartRealMs: s.state?.gameStartRealMs ?? 0,
      bonusGameDays: s.state?.bonusGameDays ?? 0,
    }))
  );
  const setShowResetConfirm = useGameStore((s) => s.setShowResetConfirm);

  if (!playerName) return null;
  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Image src="/bonsai-logo.png" alt="Bonsai" width={24} height={24} className="object-contain" />
        <span className="text-[#555] text-[10px]">·</span>
        <span className="text-[#777] text-[11px] font-medium">{playerName}</span>
        <span className="text-[#444] text-[9px] font-medium bg-white/[0.04] px-1.5 py-0.5 rounded">
          {formatDate(gd)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="font-extrabold text-[22px] tracking-tight"
          style={{
            color: cash > 0 ? "#8BC34A" : "#ef5350",
            textShadow: cash > 0 ? "0 0 20px rgba(139,195,74,0.2)" : "0 0 20px rgba(239,83,80,0.3)",
          }}
        >
          {formatCash(cash)}
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="bg-white/[0.04] border border-white/[0.06] text-[#444] text-sm rounded-md px-2 py-0.5 cursor-pointer"
          title="Reset game"
          aria-label="Reset game"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
