"use client";

import { useGameStore } from "@/store/useGameStore";
import { formatCash, getMonthlyOverheadForRoom, getYieldMultiplierForRoom, getPriceMultiplierForRoom, msToGameDate, getAMR, getQuarter } from "@/lib/helpers";
import { ROOM_COSTS, BASE_YIELD_PER_HARVEST, EXCISE_TAX_RATE, BROKER_FEE_RATE, MS_PER_GAME_DAY } from "@/lib/constants";

export default function RoomBuyModal() {
  const state = useGameStore((s) => s.state);
  const showRoomBuy = useGameStore((s) => s.ui.showRoomBuy);
  const roomTypeChoice = useGameStore((s) => s.ui.roomTypeChoice);
  const setShowRoomBuy = useGameStore((s) => s.setShowRoomBuy);
  const setRoomTypeChoice = useGameStore((s) => s.setRoomTypeChoice);
  const unlockRoom = useGameStore((s) => s.unlockRoom);

  if (showRoomBuy === null || !state || state.rooms[showRoomBuy]?.unlocked) return null;

  const totalRealMs = Date.now() - state.gameStartRealMs;
  const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (state.bonusGameDays || 0);
  const gd = msToGameDate(totalGameDays * MS_PER_GAME_DAY);
  const currentAMR = getAMR(gd.year, getQuarter(gd.month));
  const activeRoomCount = state.rooms.filter(r => r.unlocked).length;
  const monthlyCost = getMonthlyOverheadForRoom(gd.year, state.upgrades, showRoomBuy).total;
  const roomCost = ROOM_COSTS[showRoomBuy];
  const yieldLbs = Math.round(BASE_YIELD_PER_HARVEST * getYieldMultiplierForRoom(state.upgrades, showRoomBuy));
  const harvestRevenue = yieldLbs * currentAMR * getPriceMultiplierForRoom(state.upgrades, showRoomBuy) * (1 - EXCISE_TAX_RATE - BROKER_FEE_RATE) * (1 - state.vcRevenuePenalty);
  const netPerHarvest = harvestRevenue - (monthlyCost * 3);
  const harvestsToPayback = netPerHarvest > 0 ? Math.ceil(roomCost / netPerHarvest) : null;
  const handleClose = () => { setShowRoomBuy(null); setRoomTypeChoice(null); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{ background: "#222", borderRadius: 16, width: "90%", maxWidth: 400, padding: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Unlock Room {showRoomBuy + 1}</h2>
        <p style={{ color: "#FFB74D", fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>{formatCash(roomCost)}</p>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", marginBottom: 14 }}>
          {[["Monthly overhead added", formatCash(monthlyCost) + "/mo", "#ef5350"],["New total burn", formatCash(monthlyCost * (activeRoomCount + 1)) + "/mo", "#ef5350"],["Cash after purchase", formatCash(state.cash - roomCost), state.cash - roomCost > 0 ? "#8BC34A" : "#ef5350"]].map(([label, value, color]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
              <span style={{ color: "#888" }}>{label}</span><span style={{ color: color as string, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          {harvestsToPayback && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#888" }}>Harvests to pay back</span>
              <span style={{ color: "#FFB74D", fontWeight: 700 }}>{harvestsToPayback} harvest{harvestsToPayback > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        {showRoomBuy === 1 ? (
          <div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>Room 2 is your first flower room. This is where harvested veg plants go to produce bud.</p>
            <button onClick={() => { setRoomTypeChoice("flower"); unlockRoom(showRoomBuy); }} disabled={state.cash < roomCost} style={{ width: "100%", padding: 14, background: state.cash >= roomCost ? "#CE93D8" : "#333", color: state.cash >= roomCost ? "#1a1a1a" : "#666", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🌸 Unlock as Flower Room</button>
          </div>
        ) : (
          <div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>Choose room type:</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {(["veg", "flower"] as const).map(type => (
                <button key={type} onClick={() => setRoomTypeChoice(type)} style={{ flex: 1, padding: 14, borderRadius: 8, border: `2px solid ${roomTypeChoice === type ? (type === "veg" ? "#8BC34A" : "#CE93D8") : "#333"}`, background: roomTypeChoice === type ? (type === "veg" ? "#1a2a1a" : "#2a1a2a") : "#2a2a2a", color: type === "veg" ? "#8BC34A" : "#CE93D8", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{type === "veg" ? "🌱 VEG" : "🌸 FLOWER"}</button>
              ))}
            </div>
            <button onClick={() => unlockRoom(showRoomBuy)} disabled={!roomTypeChoice || state.cash < roomCost} style={{ width: "100%", padding: 14, background: roomTypeChoice && state.cash >= roomCost ? "#8BC34A" : "#333", color: roomTypeChoice && state.cash >= roomCost ? "#1a1a1a" : "#666", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Unlock — {formatCash(roomCost)}</button>
          </div>
        )}
        <button onClick={handleClose} style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "1px solid #444", borderRadius: 8, color: "#888", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}
