"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getVegDaysForRoom, getFlowerDaysForRoom, getRotQuality, getRotSpeedMultiplierForRoom } from "@/lib/helpers";
import { MS_PER_GAME_DAY } from "@/lib/constants";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function RoomDetailModal() {
  const state = useGameStore((s) => s.state);
  const selectedRoom = useGameStore((s) => s.ui.selectedRoom);
  const gameSpeed = useGameStore((s) => s.ui.gameSpeed);
  const paused = useGameStore((s) => s.ui.paused);
  const setSelectedRoom = useGameStore((s) => s.setSelectedRoom);
  const flipToFlower = useGameStore((s) => s.flipToFlower);
  const harvest = useGameStore((s) => s.harvest);
  const startGrowing = useGameStore((s) => s.startGrowing);
  const destroyCrop = useGameStore((s) => s.destroyCrop);

  const [confirmDestroy, setConfirmDestroy] = useState(false);
  const [, setTick] = useState(0);

  // Re-render every second for live countdown
  useEffect(() => {
    if (selectedRoom === null) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

  if (selectedRoom === null || !state || !state.rooms[selectedRoom]?.unlocked) return null;

  const room = state.rooms[selectedRoom];
  const isVeg = room.type === "veg";
  const targetDays = isVeg
    ? getVegDaysForRoom(state.upgrades, selectedRoom)
    : getFlowerDaysForRoom(state.upgrades, selectedRoom);
  const rotQuality = getRotQuality(room.rotDays || 0, getRotSpeedMultiplierForRoom(state.upgrades, selectedRoom));

  const targetFlower = state.rooms.find(r =>
    r.unlocked && r.type === "flower" && r.status === "empty"
  );

  const canDestroy = room.status !== "empty";

  // Real-time countdown calculation
  const daysRemaining = room.status === "growing" ? Math.max(0, targetDays - room.daysGrown) : 0;
  const effectiveSpeed = paused ? 0 : gameSpeed;
  const realMsRemaining = effectiveSpeed > 0 ? (daysRemaining * MS_PER_GAME_DAY) / effectiveSpeed : 0;
  const progress = room.status === "growing" ? Math.min(room.daysGrown / targetDays, 1) : 0;

  // Quality color
  const qualityColor = rotQuality > 0.7 ? "#8BC34A" : rotQuality > 0.4 ? "#FFB74D" : "#ef5350";

  const handleClose = () => {
    setConfirmDestroy(false);
    setSelectedRoom(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 z-[100] flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-[#1a1a1a] rounded-t-2xl w-full max-w-[480px] min-h-[50vh] max-h-[80vh] overflow-y-auto flex flex-col"
        style={{ borderTop: `2px solid ${isVeg ? "rgba(139,195,74,0.3)" : "rgba(206,147,216,0.3)"}` }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-start">
          <div>
            <h2 className="m-0 text-2xl font-extrabold tracking-tight">
              Room {selectedRoom + 1}
            </h2>
            <span className={`text-xs font-bold tracking-widest ${isVeg ? "text-bonsai-green" : "text-bonsai-purple"}`}>
              {isVeg ? "VEGETATIVE" : "FLOWER"}
            </span>
          </div>
          <button onClick={handleClose} className="bg-white/[0.05] border border-white/[0.08] text-[#888] text-lg w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center hover:bg-white/[0.08] transition-colors">×</button>
        </div>

        {/* Timer / Status Section */}
        <div className="px-5 pb-4 flex-1">

          {/* EMPTY */}
          {room.status === "empty" && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3 opacity-30">~</div>
              <div className="text-[#555] text-sm">No active crop</div>
            </div>
          )}

          {/* GROWING — countdown timer */}
          {room.status === "growing" && (
            <div>
              {/* Big countdown */}
              <div className="text-center py-4">
                <div className="text-[9px] text-[#666] font-bold tracking-widest mb-2">
                  {isVeg ? "VEG CYCLE" : "FLOWER CYCLE"} · {Math.floor(room.daysGrown)}/{targetDays} DAYS
                </div>
                <div className="font-extrabold text-[36px] leading-none tracking-tight"
                  style={{ fontFamily: "var(--font-mono)", color: isVeg ? "#8BC34A" : "#CE93D8" }}>
                  {paused ? "PAUSED" : effectiveSpeed > 0 ? formatCountdown(realMsRemaining) : "—"}
                </div>
                <div className="text-[10px] text-[#555] mt-1">at {gameSpeed}× speed</div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress * 100}%`,
                    background: isVeg
                      ? "linear-gradient(90deg, #558B2F, #8BC34A)"
                      : "linear-gradient(90deg, #7B1FA2, #CE93D8)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#555]" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(progress * 100)}%</span>
                <span className="text-[9px] text-[#555]" style={{ fontFamily: "var(--font-mono)" }}>{Math.ceil(daysRemaining)}d left</span>
              </div>
            </div>
          )}

          {/* READY TO FLIP / HARVEST — quality display */}
          {(room.status === "ready_to_flip" || room.status === "ready_to_harvest") && (
            <div>
              <div className="text-center py-4">
                <div className="text-[9px] text-[#666] font-bold tracking-widest mb-2">
                  {room.status === "ready_to_harvest" ? "HARVEST READY" : "READY TO FLIP"}
                </div>
                <div className="font-extrabold text-[42px] leading-none tracking-tight"
                  style={{ fontFamily: "var(--font-mono)", color: qualityColor }}>
                  {Math.round(rotQuality * 100)}%
                </div>
                <div className="text-[10px] text-[#666] mt-1">crop quality</div>
              </div>

              {/* Quality bar */}
              <div className="w-full h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(rotQuality * 100, 0)}%`,
                    background: rotQuality > 0.7
                      ? "linear-gradient(90deg, #558B2F, #8BC34A)"
                      : rotQuality > 0.4
                        ? "linear-gradient(90deg, #F57F17, #FFB74D)"
                        : "linear-gradient(90deg, #B71C1C, #ef5350)",
                  }}
                />
              </div>
              {rotQuality < 1 && (
                <div className="text-[10px] mt-2 text-center" style={{ color: qualityColor }}>
                  {rotQuality > 0.7 ? "Quality is good — act when ready" :
                   rotQuality > 0.4 ? "⚠ Quality degrading — don't wait too long" :
                   "🚨 CRITICAL — crop dying, act immediately!"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-2 mt-auto">
          {room.status === "empty" && isVeg && (
            <button
              onClick={() => { startGrowing(selectedRoom); handleClose(); }}
              className="w-full py-4 bg-bonsai-green/20 border border-bonsai-green/40 rounded-xl text-bonsai-green font-bold text-base cursor-pointer hover:bg-bonsai-green/30 transition-colors"
            >
              🌱 Start Growing
            </button>
          )}
          {room.status === "ready_to_flip" && (
            targetFlower ? (
              <button
                onClick={() => { flipToFlower(selectedRoom, targetFlower.index); handleClose(); }}
                className="w-full py-4 bg-bonsai-amber/20 border border-bonsai-amber/40 rounded-xl text-bonsai-amber font-bold text-base cursor-pointer hover:bg-bonsai-amber/30 transition-colors"
              >
                ⚡ Flip to Room {targetFlower.index + 1}
              </button>
            ) : (
              <div className="w-full py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#555] text-sm text-center">
                No empty flower room available
              </div>
            )
          )}
          {room.status === "ready_to_harvest" && (
            <button
              onClick={() => { harvest(selectedRoom); handleClose(); }}
              className="w-full py-4 bg-bonsai-green/20 border border-bonsai-green/40 rounded-xl text-bonsai-green font-bold text-base cursor-pointer hover:bg-bonsai-green/30 transition-colors"
            >
              🌿 Harvest Room
            </button>
          )}

          {/* Destroy Crop — smaller */}
          {canDestroy && !confirmDestroy && (
            <button
              onClick={() => setConfirmDestroy(true)}
              className="w-full py-2 bg-transparent border border-white/[0.06] rounded-xl text-[#555] text-[11px] cursor-pointer hover:border-bonsai-red/30 hover:text-bonsai-red/70 transition-colors"
            >
              🗑️ Destroy Crop
            </button>
          )}
          {canDestroy && confirmDestroy && (
            <div className="bg-bonsai-red/[0.06] border border-bonsai-red/20 rounded-xl p-3">
              <p className="text-[11px] text-bonsai-red/80 mb-2 text-center">
                This will destroy the current crop. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDestroy(false)}
                  className="flex-1 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[#888] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { destroyCrop(selectedRoom); setConfirmDestroy(false); }}
                  className="flex-1 py-2 bg-bonsai-red/15 border border-bonsai-red/30 rounded-lg text-bonsai-red font-bold text-xs cursor-pointer hover:bg-bonsai-red/25 transition-colors"
                >
                  Confirm Destroy
                </button>
              </div>
            </div>
          )}

          {/* Close — same size as action buttons */}
          <button
            onClick={handleClose}
            className="w-full py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#666] text-sm font-medium cursor-pointer hover:bg-white/[0.05] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
