"use client";

import { useGameStore } from "@/store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { getAverageOverheadPerRoom, getTotalPrerollRevenue, formatCash, getYieldMultiplierForRoom, getPriceMultiplierForRoom, getMonthlyOverheadForRoom, getCurrentGameDate, getQuarter, getAMR } from "@/lib/helpers";
import { BASE_YIELD_PER_HARVEST } from "@/lib/constants";
import type { Room, Upgrades } from "@/lib/types";
import RoomCard from "../RoomCard";

export default function FacilityTab() {
  const { rooms, upgrades, vcRevenuePenalty, lastTickRealMs, gameStartRealMs, bonusGameDays, notifications } = useGameStore(
    useShallow((s) => ({
      rooms: s.state?.rooms ?? [],
      upgrades: s.state?.upgrades ?? ({} as Upgrades),
      vcRevenuePenalty: s.state?.vcRevenuePenalty ?? 0,
      lastTickRealMs: s.state?.lastTickRealMs ?? 0,
      gameStartRealMs: s.state?.gameStartRealMs ?? 0,
      bonusGameDays: s.state?.bonusGameDays ?? 0,
      notifications: s.state?.notifications ?? [],
    }))
  );
  const setSelectedRoom = useGameStore((s) => s.setSelectedRoom);

  if (!rooms.length) return null;

  const gd = getCurrentGameDate(gameStartRealMs, bonusGameDays);
  const quarter = getQuarter(gd.month);
  const currentAMR = getAMR(gd.year, quarter);
  const overhead = getAverageOverheadPerRoom(gd.year, upgrades, rooms);
  const activeRoomCount = rooms.filter(r => r.unlocked).length;
  const flowerRoomCount = rooms.filter(r => r.unlocked && r.type === "flower").length;
  const actionRooms = rooms.filter(r => r.unlocked && (r.status === "ready_to_flip" || r.status === "ready_to_harvest"));
  const emptyVegRooms = rooms.filter(r => r.unlocked && r.type === "veg" && r.status === "empty");

  return (
    <div>
      {/* Action banner */}
      {actionRooms.length > 0 && (
        <div className="mb-3">
          {actionRooms.map(room => (
            <button
              key={room.index}
              onClick={() => setSelectedRoom(room.index)}
              className="w-full mb-1.5 px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center"
              style={{
                background: room.status === "ready_to_harvest"
                  ? "linear-gradient(135deg, rgba(255,183,77,0.15) 0%, rgba(255,152,0,0.08) 100%)"
                  : "linear-gradient(135deg, rgba(139,195,74,0.15) 0%, rgba(104,159,56,0.08) 100%)",
                border: `1px solid ${room.status === "ready_to_harvest" ? "rgba(255,183,77,0.3)" : "rgba(139,195,74,0.3)"}`,
                animation: "action-pulse 2s ease-in-out infinite",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{room.status === "ready_to_harvest" ? "🌿" : "⚡"}</span>
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: room.status === "ready_to_harvest" ? "#FFB74D" : "#8BC34A" }}>
                    {room.status === "ready_to_harvest" ? "HARVEST READY" : "FLIP DAY"}
                  </div>
                  <div className="text-[#666] text-[10px]">
                    Room {room.index + 1} · {room.type === "veg"
                      ? "Veg complete"
                      : `${Math.round(BASE_YIELD_PER_HARVEST * getYieldMultiplierForRoom(upgrades, room.index))} lbs ready`}
                  </div>
                </div>
              </div>
              <div
                className="text-[11px] font-bold tracking-widest bg-black/30 px-3 py-1 rounded-md"
                style={{ color: room.status === "ready_to_harvest" ? "#FFB74D" : "#8BC34A" }}
              >
                TAP →
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty veg reminder */}
      {emptyVegRooms.length > 0 && actionRooms.length === 0 && (
        <button
          onClick={() => setSelectedRoom(emptyVegRooms[0].index)}
          className="w-full mb-3 px-4 py-2.5 bg-bonsai-green/[0.06] border border-bonsai-green/[0.15] rounded-[10px] cursor-pointer flex items-center gap-2.5"
        >
          <span className="text-base">🌱</span>
          <span className="text-bonsai-green text-xs font-semibold">
            Room {emptyVegRooms[0].index + 1} is empty — tap to start growing
          </span>
        </button>
      )}

      {/* Room grid */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        {rooms.map((room, i) => (
          <RoomCard key={i} room={room} roomIndex={i} />
        ))}
      </div>

      {/* Notification toasts */}
      {notifications.filter(n => n.type === "harvest").slice(-2).map((n, i) => (
        <div key={i} className="bg-bonsai-green/10 border border-bonsai-green/20 rounded-[10px] px-3.5 py-2.5 mt-2 text-xs text-bonsai-green font-medium" style={{ animation: "toast-in 0.3s ease-out" }}>
          💰 {n.message}
        </div>
      ))}
      {notifications.filter(n => n.type === "rot_warning").slice(-2).map((n, i) => (
        <div key={`rot-${i}`} className="rounded-[10px] px-3.5 py-2.5 mt-2 text-xs text-bonsai-amber font-medium" style={{ background: "linear-gradient(135deg,rgba(255,183,77,0.12),rgba(239,83,80,0.06))", border: "1px solid rgba(255,183,77,0.25)", animation: "toast-in 0.3s ease-out" }}>
          {n.message}
        </div>
      ))}
      {notifications.filter(n => n.type === "rot_destroyed").slice(-2).map((n, i) => (
        <div key={`dead-${i}`} className="rounded-[10px] px-3.5 py-3 mt-2 text-xs text-bonsai-red font-semibold" style={{ background: "linear-gradient(135deg,rgba(239,83,80,0.15),rgba(183,28,28,0.08))", border: "1px solid rgba(239,83,80,0.3)", animation: "toast-in 0.3s ease-out" }}>
          {n.message}
        </div>
      ))}

      {/* Stats ticker */}
      <div className="flex justify-around mt-3.5 py-2.5 border-t border-b border-white/[0.04]">
        {[
          { label: "OVERHEAD", value: overhead ? formatCash(overhead.total * activeRoomCount) : "--", sub: overhead ? `${formatCash(overhead.total)}/room` : "", color: "#ef5350" },
          {
            label: "YIELD",
            value: (() => { const fr = rooms.find(r => r.unlocked && r.type === "flower"); return fr ? `${Math.round(BASE_YIELD_PER_HARVEST * getYieldMultiplierForRoom(upgrades, fr.index))} lbs` : "--"; })(),
            sub: (() => { const fr = rooms.find(r => r.unlocked && r.type === "flower"); return fr ? `@ ${formatCash(currentAMR * getPriceMultiplierForRoom(upgrades, fr.index))}/lb` : ""; })(),
            color: "#8BC34A",
          },
          {
            label: "COST/LB",
            value: (() => {
              if (!overhead || flowerRoomCount === 0) return "--";
              let totalOH = 0, totalYield = 0;
              for (const r of rooms) {
                if (r.unlocked) totalOH += getMonthlyOverheadForRoom(gd.year, upgrades, r.index).total;
                if (r.unlocked && r.type === "flower") totalYield += BASE_YIELD_PER_HARVEST * getYieldMultiplierForRoom(upgrades, r.index);
              }
              return totalYield > 0 ? formatCash((totalOH * 3) / totalYield) : "--";
            })(),
            sub: "target",
            color: "#FFB74D",
          },
        ].map((stat, idx) => (
          <div key={idx} className="text-center">
            <div className="text-[8px] text-[#444] font-semibold tracking-widest mb-0.5">{stat.label}</div>
            <div className="text-base font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[9px] text-[#333] mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
