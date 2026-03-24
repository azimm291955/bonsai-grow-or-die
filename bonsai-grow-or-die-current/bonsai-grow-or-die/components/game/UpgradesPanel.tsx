"use client";

import { useGameStore } from "@/store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import {
  formatCash, getRoomUpgradeTier, getUpgradeCostForRoom,
  getTotalUpgradesPurchased, getTotalUpgradesPossible,
  getLaborCost, msToGameDate,
} from "@/lib/helpers";
import {
  UPGRADE_TRACKS, BASE_OVERHEAD, BASE_YIELD_PER_HARVEST,
  VEG_DAYS, FLOWER_DAYS, MS_PER_GAME_DAY,
} from "@/lib/constants";
import type { UpgradeTierDef } from "@/lib/constants";
import type { Room, Upgrades } from "@/lib/types";

function JointIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <g transform="rotate(-30, 16, 16)">
        <path d="M13,27 L14,10 Q16,7 18,10 L19,27 Q16,29 13,27Z" fill="#F5F0E0" stroke="#D4C9A8" strokeWidth="0.6"/>
        <line x1="14.2" y1="14" x2="17.8" y2="14" stroke="#D4C9A8" strokeWidth="0.3" opacity="0.5"/>
        <line x1="14" y1="18" x2="18" y2="18" stroke="#D4C9A8" strokeWidth="0.3" opacity="0.5"/>
        <line x1="13.8" y1="22" x2="18.2" y2="22" stroke="#D4C9A8" strokeWidth="0.3" opacity="0.5"/>
        <rect x="13.2" y="25" width="5.6" height="3.5" rx="0.8" fill="#C4B896" stroke="#A89E78" strokeWidth="0.4"/>
        <ellipse cx="16" cy="8.5" rx="3" ry="1.8" fill="#E85D24" opacity="0.9"/>
        <ellipse cx="16" cy="8.5" rx="2" ry="1" fill="#FCDE5A" opacity="0.7"/>
      </g>
      <path d="M10,8 Q7,4 10,0" fill="none" stroke="#999" strokeWidth="0.4" opacity="0.25"/>
      <path d="M8,10 Q4,5 8,1" fill="none" stroke="#999" strokeWidth="0.3" opacity="0.15"/>
    </svg>
  );
}

function getEffectDescription(tier: UpgradeTierDef, trackKey: string, year: number) {
  const effects: { text: string; detail: string }[] = [];
  if (tier.electricityMod) {
    const saved = Math.round(BASE_OVERHEAD.electricity * Math.abs(tier.electricityMod));
    effects.push({ text: `Electricity ${Math.round(tier.electricityMod * 100)}%`, detail: `Saves ${formatCash(saved)}/room/mo` });
  }
  if (tier.yieldMod) {
    const baseLbs = BASE_YIELD_PER_HARVEST;
    if (trackKey === "lighting") {
      const tierNum = UPGRADE_TRACKS.lighting.tiers.indexOf(tier) + 1;
      effects.push({ text: `Flower: Yield +${Math.round(tier.yieldMod * 100)}%`, detail: `${baseLbs} base → ${Math.round(baseLbs * (1 + tier.yieldMod))} lbs (stacks with Genetics)` });
      effects.push({ text: `Veg: +${tierNum * 5}% quality bonus + ${tierNum} day faster`, detail: `${VEG_DAYS}→${VEG_DAYS - tierNum} days` });
    } else if (trackKey === "genetics") {
      const tierNum = UPGRADE_TRACKS.genetics.tiers.indexOf(tier) + 1;
      effects.push({ text: `Flower: Yield +${Math.round(tier.yieldMod * 100)}%`, detail: `${baseLbs} base → ${Math.round(baseLbs * (1 + tier.yieldMod))} lbs (stacks with Lighting)` });
      effects.push({ text: `Veg: +${tierNum * 5}% quality bonus`, detail: `Better genetics = higher quality plants` });
    } else {
      effects.push({ text: `Yield +${Math.round(tier.yieldMod * 100)}%`, detail: `${baseLbs} → ${Math.round(baseLbs * (1 + tier.yieldMod))} lbs` });
    }
  }
  if (tier.priceMod) effects.push({ text: `Sale price +${Math.round(tier.priceMod * 100)}% above AMR`, detail: `Sell above market rate` });
  if (tier.laborMod) {
    const saved = Math.round(getLaborCost(year) * Math.abs(tier.laborMod));
    effects.push({ text: `Labor ${Math.round(tier.laborMod * 100)}%`, detail: `Saves ${formatCash(saved)}/room/mo at ${year} wages` });
  }
  if (tier.nutrientMod) {
    const avgMod = ((tier.nutrientMod || 0) + (tier.co2Mod || 0)) / 2;
    const saved = Math.round(BASE_OVERHEAD.nutrients_co2_packaging * Math.abs(avgMod));
    effects.push({ text: `Nutrients & CO₂ ${Math.round(avgMod * 100)}%`, detail: `Saves ${formatCash(saved)}/room/mo` });
  }
  if (tier.monthlyRevenue) effects.push({ text: `+${formatCash(tier.monthlyRevenue)}/mo per flower room`, detail: `Passive income from pre-rolls` });
  if (tier.autoFlip && trackKey === "operations") {
    effects.push({ text: `Veg rooms: Auto-flip`, detail: `Completed veg auto-moves into empty flower rooms` });
    if (tier.vegCycleDays && tier.vegCycleDays > 0) effects.push({ text: `Veg rooms: −${tier.vegCycleDays} day cycle`, detail: `${VEG_DAYS}→${VEG_DAYS - tier.vegCycleDays} days before Lighting bonus` });
    const rotReduction = Math.round((1 - (tier.rotSpeedMult ?? 1)) * 100);
    effects.push({ text: `Flower rooms: Rot ${rotReduction}% slower`, detail: `More time to harvest before quality drops` });
    if (tier.flowerCycleDays && tier.flowerCycleDays > 0) effects.push({ text: `Flower rooms: −${tier.flowerCycleDays} day cycle`, detail: `${FLOWER_DAYS}→${FLOWER_DAYS - tier.flowerCycleDays} days` });
  } else if (tier.autoFlip) {
    effects.push({ text: `Auto-flip veg → flower`, detail: `Completed veg auto-moves into harvested flower rooms` });
  }
  if (tier.rotSpeedMult && trackKey !== "operations") {
    const reduction = Math.round((1 - tier.rotSpeedMult) * 100);
    effects.push({ text: `Rot ${reduction}% slower`, detail: `More time to harvest` });
  }
  return effects;
}

export default function UpgradesPanel() {
  const { cash, rooms, upgrades, gameStartRealMs, bonusGameDays } = useGameStore(
    useShallow((s) => ({
      cash: s.state?.cash ?? 0,
      rooms: s.state?.rooms ?? [],
      upgrades: s.state?.upgrades ?? ({} as Upgrades),
      gameStartRealMs: s.state?.gameStartRealMs ?? 0,
      bonusGameDays: s.state?.bonusGameDays ?? 0,
    }))
  );
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  if (!rooms.length) return null;

  const totalRealMs = Date.now() - gameStartRealMs;
  const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (bonusGameDays || 0);
  const gd = msToGameDate(totalGameDays * MS_PER_GAME_DAY);
  const unlockedRooms = rooms.filter((r: Room) => r.unlocked);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "#888", fontSize: 12, letterSpacing: 2, margin: 0 }}>UPGRADE SHOP</h3>
        <span style={{ fontSize: 10, color: "#444" }}>
          {getTotalUpgradesPurchased(upgrades)} / {getTotalUpgradesPossible(rooms)} purchased
        </span>
      </div>

      {Object.entries(UPGRADE_TRACKS).map(([key, track]) => {
        const totalTiers = track.tiers.length;
        const roomTiers = unlockedRooms.map(r => getRoomUpgradeTier(upgrades, key, r.index));
        const minTier = roomTiers.length > 0 ? Math.min(...roomTiers) : 0;
        const maxTier = roomTiers.length > 0 ? Math.max(...roomTiers) : 0;
        const roomsByMaxTier = unlockedRooms.filter(r => getRoomUpgradeTier(upgrades, key, r.index) >= totalTiers).length;
        const allMaxed = roomsByMaxTier === unlockedRooms.length;

        return (
          <div key={key} style={{
            background: "rgba(255,255,255,0.02)", borderRadius: 14,
            border: allMaxed ? "1px solid rgba(139,195,74,0.15)" : "1px solid rgba(255,255,255,0.06)",
            padding: "16px 14px", marginBottom: 12,
            opacity: allMaxed ? 0.7 : 1,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{track.icon === "joint" ? <JointIcon size={24} /> : track.icon}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{track.name}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{totalTiers} tiers · per room</div>
                </div>
              </div>
              {allMaxed ? (
                <span style={{ background: "rgba(139,195,74,0.1)", color: "#8BC34A", fontSize: 10, padding: "3px 10px", borderRadius: 6, fontWeight: 700, letterSpacing: 1 }}>ALL MAXED</span>
              ) : maxTier > 0 ? (
                <span style={{ background: "rgba(139,195,74,0.1)", color: "#8BC34A", fontSize: 10, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>
                  {minTier === maxTier ? `T${maxTier}` : `T${minTier}–T${maxTier}`}
                </span>
              ) : null}
            </div>

            {/* Next tier info */}
            {!allMaxed && (() => {
              const nextAvailTier = track.tiers[minTier];
              if (!nextAvailTier) return null;
              const yearGated = nextAvailTier.yearGate ? gd.year < nextAvailTier.yearGate : false;
              const effects = getEffectDescription(nextAvailTier, key, gd.year);

              return (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "#ccc", fontWeight: 700 }}>T{minTier + 1} — {nextAvailTier.name}</div>
                  <div style={{ fontSize: 11, color: "#777", fontStyle: "italic", margin: "3px 0 8px" }}>&ldquo;{nextAvailTier.copy}&rdquo;</div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                    {effects.map((eff, i) => (
                      <div key={i} style={{ padding: "3px 0", borderBottom: i < effects.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                        <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>→ {eff.text}</div>
                        <div style={{ fontSize: 9, color: "#666", marginTop: 1, fontStyle: "italic" }}>{eff.detail}</div>
                      </div>
                    ))}
                  </div>

                  {/* Yield stacking tip */}
                  {(key === "lighting" || key === "genetics") && nextAvailTier.yieldMod && (
                    <div style={{ fontSize: 9, color: "#689F38", padding: "4px 8px", marginBottom: 8, background: "rgba(139,195,74,0.04)", borderRadius: 6, border: "1px solid rgba(139,195,74,0.08)", lineHeight: 1.5 }}>
                      💡 Yield bonuses from Lighting and Genetics <span style={{ fontWeight: 700 }}>stack additively</span>.
                    </div>
                  )}

                  {yearGated && <div style={{ fontSize: 10, color: "#FFB74D", marginBottom: 8 }}>🔒 Unlocks in {nextAvailTier.yearGate}</div>}
                </div>
              );
            })()}

            {/* Room picker grid */}
            {!allMaxed && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 4 }}>
                {unlockedRooms.map(room => {
                  const roomTier = getRoomUpgradeTier(upgrades, key, room.index);
                  const roomMaxed = roomTier >= totalTiers;
                  const nextTierIdx = roomTier;
                  const nextTier = track.tiers[nextTierIdx];
                  const scaledCost = nextTier ? getUpgradeCostForRoom(key, nextTierIdx, upgrades) : 0;
                  const canAfford = nextTier && cash >= scaledCost;
                  const yearGated = nextTier?.yearGate ? gd.year < nextTier.yearGate : false;
                  const canBuy = canAfford && !yearGated && !roomMaxed;

                  return (
                    <button
                      key={room.index}
                      onClick={() => canBuy && buyUpgrade(key, nextTierIdx, room.index)}
                      disabled={!canBuy}
                      style={{
                        background: roomMaxed ? "rgba(139,195,74,0.04)" : canBuy ? "rgba(139,195,74,0.08)" : "rgba(255,255,255,0.02)",
                        border: roomMaxed ? "1px solid rgba(139,195,74,0.12)" : canBuy ? "1px solid rgba(139,195,74,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10, padding: "8px 6px",
                        cursor: canBuy ? "pointer" : "default",
                        textAlign: "center", transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 9, color: "#666", fontWeight: 600, letterSpacing: 0.5 }}>RM {room.index + 1}</div>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "4px 0" }}>
                        {track.tiers.map((_, ti) => (
                          <div key={ti} style={{ width: 8, height: 3, borderRadius: 1.5, background: ti < roomTier ? "#8BC34A" : "rgba(255,255,255,0.08)" }} />
                        ))}
                      </div>
                      {roomMaxed ? (
                        <div style={{ fontSize: 8, color: "#8BC34A", fontWeight: 700 }}>MAX</div>
                      ) : yearGated ? (
                        <div style={{ fontSize: 8, color: "#FFB74D" }}>{nextTier?.yearGate}</div>
                      ) : (
                        <div style={{ fontSize: 10, fontWeight: 700, color: canAfford ? "#8BC34A" : "#555" }}>{formatCash(scaledCost)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
