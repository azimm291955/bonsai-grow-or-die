"use client";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getVegDaysForRoom, getFlowerDaysForRoom, getRotQuality, getRotSpeedMultiplierForRoom } from "@/lib/helpers";

export default function RoomDetailModal() {
  const state = useGameStore((s) => s.state);
  const selectedRoom = useGameStore((s) => s.ui.selectedRoom);
  const setSelectedRoom = useGameStore((s) => s.setSelectedRoom);
  const flipToFlower = useGameStore((s) => s.flipToFlower);
  const harvest = useGameStore((s) => s.harvest);
  const startGrowing = useGameStore((s) => s.startGrowing);
  const destroyCrop = useGameStore((s) => s.destroyCrop);

  const [confirmDestroy, setConfirmDestroy] = useState(false);

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

  const handleClose = () => {
    setConfirmDestroy(false);
    setSelectedRoom(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 z-[100] flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-[#222] rounded-t-2xl w-full max-w-[480px] p-6 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0 text-xl font-bold">
            Room {selectedRoom + 1}
            <span className={`text-xs ml-2 font-semibold ${isVeg ? "text-bonsai-green" : "text-bonsai-purple"}`}>
              {isVeg ? "VEG" : "FLOWER"}
            </span>
          </h2>
          <button onClick={handleClose} className="bg-transparent border-none text-[#666] text-2xl cursor-pointer">×</button>
        </div>

        <p className="text-sm text-[#888] mb-3">
          Status: <strong className="text-white">
            {room.status === "empty" ? "Empty" :
             room.status === "growing" ? `Growing — ${Math.floor(room.daysGrown)}/${targetDays} days` :
             room.status === "ready_to_flip" ? "⚡ Ready to Flip!" :
             room.status === "ready_to_harvest" ? "🌿 Ready to Harvest!" : room.status}
          </strong>
        </p>

        {room.status === "growing" && (
          <div className="w-full h-2 bg-[#333] rounded mb-2">
            <div
              className="h-full rounded transition-all duration-1000"
              style={{
                width: `${Math.min(room.daysGrown / targetDays, 1) * 100}%`,
                background: isVeg ? "#8BC34A" : "#CE93D8",
              }}
            />
          </div>
        )}

        {rotQuality < 1 && (room.status === "ready_to_flip" || room.status === "ready_to_harvest") && (
          <div className="text-[11px] font-bold mb-3" style={{ color: rotQuality < 0.3 ? "#ef5350" : "#FFB74D" }}>
            ⚠️ Quality: {Math.round(rotQuality * 100)}% — {room.status === "ready_to_harvest" ? "Harvest" : "Flip"} soon!
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {room.status === "empty" && isVeg && (
            <button
              onClick={() => { startGrowing(selectedRoom); handleClose(); }}
              className="w-full py-3 bg-bonsai-green/20 border border-bonsai-green/40 rounded-xl text-bonsai-green font-bold text-sm cursor-pointer hover:bg-bonsai-green/30 transition-colors"
            >
              🌱 Start Growing
            </button>
          )}
          {room.status === "ready_to_flip" && (
            targetFlower ? (
              <button
                onClick={() => { flipToFlower(selectedRoom, targetFlower.index); handleClose(); }}
                className="w-full py-3 bg-bonsai-amber/20 border border-bonsai-amber/40 rounded-xl text-bonsai-amber font-bold text-sm cursor-pointer hover:bg-bonsai-amber/30 transition-colors"
              >
                ⚡ Flip to Room {targetFlower.index + 1}
              </button>
            ) : (
              <div className="w-full py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#555] text-sm text-center">
                No empty flower room available
              </div>
            )
          )}
          {room.status === "ready_to_harvest" && (
            <button
              onClick={() => { harvest(selectedRoom); handleClose(); }}
              className="w-full py-3 bg-bonsai-green/20 border border-bonsai-green/40 rounded-xl text-bonsai-green font-bold text-sm cursor-pointer hover:bg-bonsai-green/30 transition-colors"
            >
              🌿 Harvest Room
            </button>
          )}

          {/* Destroy Crop */}
          {canDestroy && !confirmDestroy && (
            <button
              onClick={() => setConfirmDestroy(true)}
              className="w-full py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[#555] text-[11px] cursor-pointer hover:border-bonsai-red/30 hover:text-bonsai-red/70 transition-colors"
            >
              🗑️ Destroy Crop
            </button>
          )}
          {canDestroy && confirmDestroy && (
            <div className="bg-bonsai-red/[0.06] border border-bonsai-red/20 rounded-xl p-3">
              <p className="text-[11px] text-bonsai-red/80 mb-2 text-center">
                This will destroy the current crop. The room will be emptied. This cannot be undone.
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

          <button
            onClick={handleClose}
            className="w-full py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#666] text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
