"use client";

import { useGameStore } from "@/store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { getCurrentGameDate, getQuarter, getAMR, getAverageOverheadPerRoom, formatCash } from "@/lib/helpers";
import type { Room, Upgrades } from "@/lib/types";

export default function StatsTicker() {
  const { cash, gameStartRealMs, bonusGameDays, rooms, upgrades, vcRevenuePenalty, vcTaken } = useGameStore(
    useShallow((s) => ({
      cash: s.state?.cash ?? 0,
      gameStartRealMs: s.state?.gameStartRealMs ?? 0,
      bonusGameDays: s.state?.bonusGameDays ?? 0,
      rooms: s.state?.rooms ?? [],
      upgrades: s.state?.upgrades ?? ({} as Upgrades),
      vcRevenuePenalty: s.state?.vcRevenuePenalty ?? 0,
      vcTaken: s.state?.vcTaken ?? false,
    }))
  );
  const setShowAMRInfo = useGameStore((s) => s.setShowAMRInfo);

  if (!rooms.length) return null;

  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);
  const quarter = getQuarter(gd.month);
  const currentAMR = getAMR(gd.year, quarter);
  const overhead = getAverageOverheadPerRoom(gd.year, upgrades, rooms);
  const activeRoomCount = rooms.filter((r: Room) => r.unlocked).length;
  const flowerRoomCount = rooms.filter((r: Room) => r.unlocked && r.type === "flower").length;
  const vegRoomCount = rooms.filter((r: Room) => r.unlocked && r.type === "veg").length;
  const grossBurn = overhead ? overhead.total * activeRoomCount : 0;
  const prerollIncome = 0; // TODO: implement getTotalPrerollRevenue
  const netBurn = grossBurn - prerollIncome;
  const monthsRunway = netBurn > 0 && cash > 0 ? Math.floor(cash / netBurn) : null;

  const items: { label: string; value: string; color: string; clickable?: boolean; sub?: string }[] = [
    { label: "AMR", value: `$${currentAMR}`, color: "#FFB74D", clickable: true },
    { label: "Burn", value: `${formatCash(netBurn)}/mo`, color: netBurn > 0 ? "#ef5350" : "#8BC34A" },
    { label: "Rooms", value: `${activeRoomCount}`, sub: `${vegRoomCount}V/${flowerRoomCount}F`, color: "#888" },
    ...(monthsRunway !== null ? [{ label: "Runway", value: `${monthsRunway}mo`, color: monthsRunway < 6 ? "#ef5350" : monthsRunway < 12 ? "#FFB74D" : "#8BC34A" }] : []),
    ...(vcTaken ? [{ label: "VC", value: "-15%", color: "#ef5350" }] : []),
  ];

  return (
    <div className="flex gap-3 mt-2 overflow-hidden py-1">
      {items.map((item, idx) => (
        <div
          key={idx}
          onClick={item.clickable ? () => setShowAMRInfo(true) : undefined}
          className={`flex items-center gap-1 whitespace-nowrap ${item.clickable ? "cursor-pointer" : ""}`}
        >
          <span className="text-[9px] text-[#555] font-semibold tracking-wide">{item.label}</span>
          <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.value}</span>
          {item.clickable && <span className="text-[9px] text-[#666] ml-px">ⓘ</span>}
          {item.sub && <span className="text-[9px] text-[#444]">{item.sub}</span>}
        </div>
      ))}
    </div>
  );
}
