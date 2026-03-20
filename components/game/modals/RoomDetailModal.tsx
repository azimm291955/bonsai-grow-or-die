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
      <div
        className="bg-[#1a1a1a] rounded-t-2xl w-full max-w-[480px] flex flex-col relative"
        style={{
          borderTop: `2px solid ${isVeg ? "rgba(139,195,74,0.3)" : "rgba(206,147,216,0.3)"}`,
          minHeight: "62vh",
          maxHeight: "88vh",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-start flex-shrink-0">
          <div className="flex-1 text-center">
            <h2 className="m-0 text-2xl font-extrabold tracking-tight">
              Room {selectedRoom + 1}
            </h2>
            <span
              className={`text-xs font-bold tracking-widest ${isVeg ? "text-bonsai-green" : "text-bonsai-purple"}`}
              style={{
                textShadow: isVeg
                  ? "0 0 8px rgba(139,195,74,0.8), 0 0 20px rgba(139,195,74,0.4)"
                  : "0 0 8px rgba(206,147,216,0.8), 0 0 20px rgba(206,147,216,0.4)",
              }}
            >
              {isVeg ? "VEGETATIVE" : "FLOWER"}
            </span>
          </div>
          <button onClick={handleClose} className="absolute right-5 top-5 bg-white/[0.05] border border-white/[0.08] text-[#888] text-lg w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center hover:bg-white/[0.08] transition-colors">×</button>
        </div>

        {/* Status section — fixed size, never grows */}
        <div className="px-5 pb-2 flex-shrink-0">

          {/* EMPTY */}
          {room.status === "empty" && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3 opacity-30">~</div>
              <div className="text-[#555] text-sm">No active crop</div>
            </div>
          )}

          {/* GROWING */}
          {room.status === "growing" && (
            <div>
              <div className="text-center py-4">
                <div className="text-[9px] text-[#666] font-bold tracking-widest mb-2">
                  {isVeg ? "VEG CYCLE" : "FLOWER CYCLE"} · {Math.floor(room.daysGrown)}/{targetDays} DAYS
                </div>
                <div className="font-extrabold text-[36px] leading-none tracking-tight"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: isVeg ? "#8BC34A" : "#CE93D8",
                    textShadow: isVeg
                      ? "0 0 12px rgba(139,195,74,0.7), 0 0 30px rgba(139,195,74,0.3)"
                      : "0 0 12px rgba(206,147,216,0.7), 0 0 30px rgba(206,147,216,0.3)",
                  }}>
                  {paused ? "PAUSED" : effectiveSpeed > 0 ? formatCountdown(realMsRemaining) : "—"}
                </div>
                <div className="text-[10px] text-[#555] mt-1">at {gameSpeed}× speed</div>
              </div>
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

          {/* READY TO FLIP / HARVEST */}
          {(room.status === "ready_to_flip" || room.status === "ready_to_harvest") && (
            <div>
              <div className="text-center py-4">
                <div className="text-[9px] text-[#666] font-bold tracking-widest mb-2">
                  {room.status === "ready_to_harvest" ? "HARVEST READY" : "READY TO FLIP"}
                </div>
                {/* Victory number — emissive neon glow */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: qualityColor,
                    fontSize: 56,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    textShadow: rotQuality > 0.7
                      ? "0 0 16px rgba(139,195,74,0.9), 0 0 40px rgba(139,195,74,0.5), 0 0 80px rgba(139,195,74,0.2)"
                      : rotQuality > 0.4
                        ? "0 0 16px rgba(255,183,77,0.9), 0 0 40px rgba(255,183,77,0.5), 0 0 80px rgba(255,183,77,0.2)"
                        : "0 0 16px rgba(239,83,80,0.9), 0 0 40px rgba(239,83,80,0.5), 0 0 80px rgba(239,83,80,0.2)",
                  }}
                >
                  {Math.round(rotQuality * 100)}%
                </div>
                <div className="text-[10px] text-[#555] mt-2">crop quality</div>
              </div>
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

        {/* Button group — flex-grow fills everything below the status section */}
        <div
          className="px-4 flex flex-col"
          style={{ flex: 1, marginTop: 14, paddingBottom: 22, gap: 8 }}
        >
          <style>{`
            @keyframes modal-pulse-amber {
              0%, 100% { box-shadow: 0 0 0 0 rgba(255,183,77,0), inset 0 1px 0 rgba(255,220,100,0.25); }
              50%       { box-shadow: 0 0 0 6px rgba(255,183,77,0.18), inset 0 1px 0 rgba(255,220,100,0.25); }
            }
            @keyframes modal-pulse-green {
              0%, 100% { box-shadow: 0 0 0 0 rgba(139,195,74,0), inset 0 1px 0 rgba(180,240,100,0.25); }
              50%       { box-shadow: 0 0 0 6px rgba(139,195,74,0.18), inset 0 1px 0 rgba(180,240,100,0.25); }
            }
          `}</style>

          {/* Primary action */}
          {room.status === "empty" && isVeg && (
            <button
              onClick={() => { startGrowing(selectedRoom); handleClose(); }}
              style={{
                flex: 2,
                width: "100%", border: "none", borderRadius: "0.75rem",
                background: "linear-gradient(180deg, rgba(160,220,80,0.22) 0%, rgba(100,160,40,0.18) 100%)",
                borderTop: "1px solid rgba(180,240,100,0.3)",
                boxShadow: "inset 0 1px 0 rgba(180,240,100,0.2)",
                color: "#8BC34A", fontWeight: 700, fontSize: 15, cursor: "pointer",
                animation: "modal-pulse-green 2.2s ease-in-out infinite",
                transition: "filter 0.15s",
              }}
            >
              🌱 Start Growing
            </button>
          )}
          {room.status === "ready_to_flip" && (
            targetFlower ? (
              <button
                onClick={() => { flipToFlower(selectedRoom, targetFlower.index); handleClose(); }}
                style={{
                  flex: 2,
                  width: "100%", border: "none", borderRadius: "0.75rem",
                  background: "linear-gradient(180deg, rgba(255,200,80,0.25) 0%, rgba(180,120,20,0.22) 100%)",
                  borderTop: "1px solid rgba(255,220,100,0.35)",
                  boxShadow: "inset 0 1px 0 rgba(255,220,100,0.25)",
                  color: "#FFB74D", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  animation: "modal-pulse-amber 2.2s ease-in-out infinite",
                  transition: "filter 0.15s",
                }}
              >
                ⚡ Flip to Room {targetFlower.index + 1}
              </button>
            ) : (
              <div
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#555] text-sm flex items-center justify-center"
                style={{ flex: 2 }}
              >
                No empty flower room available
              </div>
            )
          )}
          {room.status === "ready_to_harvest" && (
            <button
              onClick={() => { harvest(selectedRoom); handleClose(); }}
              style={{
                flex: 2,
                width: "100%", border: "none", borderRadius: "0.75rem",
                background: "linear-gradient(180deg, rgba(160,220,80,0.22) 0%, rgba(100,160,40,0.18) 100%)",
                borderTop: "1px solid rgba(180,240,100,0.3)",
                boxShadow: "inset 0 1px 0 rgba(180,240,100,0.2)",
                color: "#8BC34A", fontWeight: 700, fontSize: 15, cursor: "pointer",
                animation: "modal-pulse-green 2.2s ease-in-out infinite",
                transition: "filter 0.15s",
              }}
            >
              🌿 Harvest Room
            </button>
          )}

          {/* Destroy — 66% the height of primary, subtle red trash icon */}
          {canDestroy && !confirmDestroy && (
            <button
              onClick={() => setConfirmDestroy(true)}
              style={{
                flex: 1.32,
                width: "100%", borderRadius: "0.75rem",
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                color: "#777",
                fontSize: 12, cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              <span style={{ color: "rgba(239,83,80,0.6)", marginRight: 6 }}>🗑️</span>Destroy Crop
            </button>
          )}
          {canDestroy && confirmDestroy && (
            <div
              className="bg-bonsai-red/[0.06] border border-bonsai-red/20 rounded-xl p-4 flex flex-col justify-center"
              style={{ flex: 1.32 }}
            >
              <p className="text-[11px] text-bonsai-red/80 mb-3 text-center">
                This will destroy the current crop. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDestroy(false)}
                  className="flex-1 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[#888] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { destroyCrop(selectedRoom); setConfirmDestroy(false); }}
                  className="flex-1 py-2.5 bg-bonsai-red/15 border border-bonsai-red/30 rounded-lg text-bonsai-red font-bold text-xs cursor-pointer hover:bg-bonsai-red/25 transition-colors"
                >
                  Confirm Destroy
                </button>
              </div>
            </div>
          )}

          {/* Close — beveled, clearly readable */}
          <button
            onClick={handleClose}
            style={{
              flex: 2,
              width: "100%", borderRadius: "0.75rem",
              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderTop: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
              color: "#999",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
