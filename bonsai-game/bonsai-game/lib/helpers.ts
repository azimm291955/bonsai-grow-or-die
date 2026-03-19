import type { Room, Upgrades, GameState, GameDate, MonthlyPnLEntry, OverheadBreakdown } from "./types";
import {
  AMR_DATA, WAGE_TABLE, UPGRADE_TRACKS, BASE_OVERHEAD,
  BASE_YIELD_PER_HARVEST, VEG_DAYS, FLOWER_DAYS,
  ROT_GRACE_DAYS, ROT_TOTAL_DAYS, ROT_FAST_PHASE_DAYS, ROT_FAST_PHASE_LOSS,
  STARTING_CASH, GAME_START_DATE, MS_PER_GAME_DAY,
} from "./constants";

// ---- AMR / Market helpers ----

export function getAMR(year: number, quarter: number): number {
  const y = Math.min(Math.max(year, 2014), 2026);
  const q = Math.min(Math.max(quarter, 0), 3);
  return AMR_DATA[y]?.[q] ?? AMR_DATA[2026][3];
}

export function getQuarter(month: number): number {
  return Math.floor((month - 1) / 3);
}

export function getLaborCost(year: number): number {
  const y = Math.min(Math.max(year, 2014), 2026);
  return WAGE_TABLE[y] ?? WAGE_TABLE[2026];
}

// ---- Per-room upgrade helpers ----

export function getRoomUpgradeTier(upgrades: Upgrades, track: string, roomIndex: number): number {
  return (upgrades[track] && upgrades[track][roomIndex]) || 0;
}

export function getRoomUpgrades(upgrades: Upgrades, roomIndex: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const track of Object.keys(UPGRADE_TRACKS)) {
    result[track] = getRoomUpgradeTier(upgrades, track, roomIndex);
  }
  return result;
}

export function getYieldMultiplierForRoom(upgrades: Upgrades, roomIndex: number): number {
  let mult = 1;
  const lt = getRoomUpgradeTier(upgrades, "lighting", roomIndex);
  if (lt > 0) mult += UPGRADE_TRACKS.lighting.tiers[lt - 1].yieldMod ?? 0;
  const gt = getRoomUpgradeTier(upgrades, "genetics", roomIndex);
  if (gt > 0) mult += UPGRADE_TRACKS.genetics.tiers[gt - 1].yieldMod ?? 0;
  return mult;
}

// Veg room bonuses: lighting + genetics on the veg room boost starting quality
export function getVegQualityBonus(upgrades: Upgrades, vegRoomIndex: number): number {
  let bonus = 0;
  const lt = getRoomUpgradeTier(upgrades, "lighting", vegRoomIndex);
  if (lt >= 1) bonus += 0.05;
  if (lt >= 2) bonus += 0.05;
  if (lt >= 3) bonus += 0.05;
  const gt = getRoomUpgradeTier(upgrades, "genetics", vegRoomIndex);
  if (gt >= 1) bonus += 0.05;
  if (gt >= 2) bonus += 0.05;
  if (gt >= 3) bonus += 0.05;
  return bonus; // 0.0 to 0.30
}

export function getVegDaysForRoom(upgrades: Upgrades, roomIndex: number): number {
  const lt = getRoomUpgradeTier(upgrades, "lighting", roomIndex);
  const ot = getRoomUpgradeTier(upgrades, "operations", roomIndex);
  const opsReduction = ot > 0 ? (UPGRADE_TRACKS.operations.tiers[ot - 1].vegCycleDays ?? 0) : 0;
  return VEG_DAYS - lt - opsReduction;
}

export function getFlowerDaysForRoom(upgrades: Upgrades, roomIndex: number): number {
  const ot = getRoomUpgradeTier(upgrades, "operations", roomIndex);
  const opsReduction = ot > 0 ? (UPGRADE_TRACKS.operations.tiers[ot - 1].flowerCycleDays ?? 0) : 0;
  return FLOWER_DAYS - opsReduction;
}

export function getPriceMultiplierForRoom(upgrades: Upgrades, roomIndex: number): number {
  let mult = 1;
  const gt = getRoomUpgradeTier(upgrades, "genetics", roomIndex);
  if (gt > 0) mult += UPGRADE_TRACKS.genetics.tiers[gt - 1].priceMod ?? 0;
  return mult;
}

export function getMonthlyOverheadForRoom(year: number, upgrades: Upgrades, roomIndex: number): OverheadBreakdown {
  let rent = BASE_OVERHEAD.rent;
  let electricity = BASE_OVERHEAD.electricity;
  let labor = getLaborCost(year);
  let nutrients = BASE_OVERHEAD.nutrients_co2_packaging;
  const license = BASE_OVERHEAD.license_fees;

  const lt = getRoomUpgradeTier(upgrades, "lighting", roomIndex);
  if (lt > 0) electricity *= (1 + (UPGRADE_TRACKS.lighting.tiers[lt - 1].electricityMod ?? 0));
  const it = getRoomUpgradeTier(upgrades, "irrigation", roomIndex);
  if (it > 0) labor *= (1 + (UPGRADE_TRACKS.irrigation.tiers[it - 1].laborMod ?? 0));
  const et = getRoomUpgradeTier(upgrades, "environmental", roomIndex);
  if (et > 0) {
    const tier = UPGRADE_TRACKS.environmental.tiers[et - 1];
    nutrients *= (1 + ((tier.nutrientMod ?? 0) + (tier.co2Mod ?? 0)) / 2);
  }

  return {
    rent,
    electricity: Math.round(electricity),
    labor: Math.round(labor),
    nutrients: Math.round(nutrients),
    license,
    total: Math.round(rent + electricity + labor + nutrients + license),
  };
}

export function getAverageOverheadPerRoom(year: number, upgrades: Upgrades, rooms: Room[]): OverheadBreakdown {
  const activeRooms = rooms.filter(r => r.unlocked);
  if (activeRooms.length === 0) {
    const labor = getLaborCost(year);
    return {
      rent: BASE_OVERHEAD.rent,
      electricity: BASE_OVERHEAD.electricity,
      labor,
      nutrients: BASE_OVERHEAD.nutrients_co2_packaging,
      license: BASE_OVERHEAD.license_fees,
      total: BASE_OVERHEAD.rent + BASE_OVERHEAD.electricity + labor + BASE_OVERHEAD.nutrients_co2_packaging + BASE_OVERHEAD.license_fees,
    };
  }
  const totals = { rent: 0, electricity: 0, labor: 0, nutrients: 0, license: 0, total: 0 };
  for (const r of activeRooms) {
    const oh = getMonthlyOverheadForRoom(year, upgrades, r.index);
    totals.rent += oh.rent;
    totals.electricity += oh.electricity;
    totals.labor += oh.labor;
    totals.nutrients += oh.nutrients;
    totals.license += oh.license;
    totals.total += oh.total;
  }
  const n = activeRooms.length;
  return {
    rent: Math.round(totals.rent / n),
    electricity: Math.round(totals.electricity / n),
    labor: Math.round(totals.labor / n),
    nutrients: Math.round(totals.nutrients / n),
    license: Math.round(totals.license / n),
    total: Math.round(totals.total / n),
  };
}

export function getPrerollRevenueForRoom(upgrades: Upgrades, roomIndex: number): number {
  const pt = getRoomUpgradeTier(upgrades, "preroll", roomIndex);
  if (pt === 0) return 0;
  return UPGRADE_TRACKS.preroll.tiers[pt - 1].monthlyRevenue ?? 0;
}

export function getTotalPrerollRevenue(upgrades: Upgrades, rooms: Room[]): number {
  let total = 0;
  for (const r of rooms) {
    if (r.unlocked && r.type === "flower") {
      total += getPrerollRevenueForRoom(upgrades, r.index);
    }
  }
  return total;
}

export function getRotSpeedMultiplierForRoom(upgrades: Upgrades, roomIndex: number): number {
  const ot = getRoomUpgradeTier(upgrades, "operations", roomIndex);
  if (ot > 0) return UPGRADE_TRACKS.operations.tiers[ot - 1].rotSpeedMult ?? 1.0;
  return 1.0;
}

export function hasAutoFlipForRoom(upgrades: Upgrades, roomIndex: number): boolean {
  return getRoomUpgradeTier(upgrades, "operations", roomIndex) >= 1;
}

export function getUpgradeCostForRoom(track: string, tierIndex: number, upgrades: Upgrades): number {
  const baseCost = UPGRADE_TRACKS[track].tiers[tierIndex].cost;
  const alreadyUpgraded = Object.values(upgrades[track] || {}).filter(t => t > tierIndex).length;
  return Math.round(baseCost * Math.pow(1.4, alreadyUpgraded));
}

export function getTotalUpgradesPurchased(upgrades: Upgrades): number {
  let count = 0;
  for (const track of Object.keys(upgrades)) {
    for (const tier of Object.values(upgrades[track] || {})) {
      count += tier;
    }
  }
  return count;
}

export function getTotalUpgradesPossible(rooms: Room[]): number {
  const activeRooms = rooms.filter(r => r.unlocked).length;
  return Object.values(UPGRADE_TRACKS).reduce((a, t) => a + t.tiers.length, 0) * activeRooms;
}

export function migrateUpgrades(upgrades: Upgrades | Record<string, number>, rooms: Room[]): Upgrades {
  const firstVal = Object.values(upgrades)[0];
  if (typeof firstVal === "object" && firstVal !== null) return upgrades as Upgrades;
  const newUpgrades: Upgrades = { lighting: {}, irrigation: {}, environmental: {}, genetics: {}, preroll: {}, operations: {} };
  for (const [track, tier] of Object.entries(upgrades)) {
    newUpgrades[track] = {};
    if ((tier as number) > 0) {
      for (const room of rooms) {
        if (room.unlocked) {
          newUpgrades[track][room.index] = tier as number;
        }
      }
    }
  }
  return newUpgrades;
}

export function getRotQuality(daysSitting: number, rotSpeedMult: number): number {
  if (daysSitting <= ROT_GRACE_DAYS) return 1.0;
  const rotDays = (daysSitting - ROT_GRACE_DAYS) * rotSpeedMult;
  if (rotDays >= ROT_TOTAL_DAYS) return 0.0;
  if (rotDays <= ROT_FAST_PHASE_DAYS) {
    return 1.0 - (ROT_FAST_PHASE_LOSS * (rotDays / ROT_FAST_PHASE_DAYS));
  } else {
    const slowDays = rotDays - ROT_FAST_PHASE_DAYS;
    const slowTotal = ROT_TOTAL_DAYS - ROT_FAST_PHASE_DAYS;
    return (1.0 - ROT_FAST_PHASE_LOSS) * (1.0 - (slowDays / slowTotal));
  }
}

export function formatCash(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(abs % 1000000 === 0 ? 0 : 1)}M`;
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function formatDate(gd: GameDate): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[gd.month - 1]} ${gd.day}, ${gd.year}`;
}

export function msToGameDate(ms: number): GameDate {
  const totalDays = Math.floor(ms / MS_PER_GAME_DAY);
  const baseDay = (GAME_START_DATE.year * 365) + (GAME_START_DATE.month - 1) * 30 + (GAME_START_DATE.day - 1);
  const absDays = baseDay + totalDays;
  const year = Math.floor(absDays / 365);
  const rem = absDays % 365;
  const month = Math.floor(rem / 30) + 1;
  const day = (rem % 30) + 1;
  return { year: Math.min(year, 2027), month: Math.min(month, 12), day: Math.min(day, 30) };
}

export function createRoom(index: number, unlocked: boolean): Room {
  return {
    index,
    unlocked,
    type: index === 0 ? "veg" : null,
    status: "empty",
    daysGrown: 0,
    rotDays: 0,
    harvestCount: 0,
    growStartMs: null,
    stalled: false,
    vegQuality: undefined,
  };
}

export function createInitialState(playerName: string): GameState {
  const rooms: Room[] = [];
  for (let i = 0; i < 9; i++) {
    rooms.push(createRoom(i, i === 0));
  }
  return {
    playerName,
    cash: STARTING_CASH,
    totalRevenue: 0,
    totalCosts: 0,
    rooms,
    upgrades: { lighting: {}, irrigation: {}, environmental: {}, genetics: {}, preroll: {}, operations: {} },
    gameStartRealMs: Date.now(),
    lastTickRealMs: Date.now(),
    vcTaken: false,
    vcTriggered: false,
    vcRevenuePenalty: 0,
    vcOverheadCredit: 0,
    gameOver: false,
    gameWon: false,
    winType: null,
    monthlyPnL: [],
    lastProcessedMonth: -1,
    notifications: [],
    eventsShown: {},
    tutorialStep: 0,
    bonusGameDays: 0,
    achievements: {},
    achievementProgress: {},
    totalSpentOnUpgrades: 0,
    consecutiveProfitMonths: 0,
    hadCropRot: false,
    roomsHarvested: {},
    totalLbsProduced: 0,
    peakCash: STARTING_CASH,
    lowestCash: STARTING_CASH,
    totalWholesaleRevenue: 0,
    totalPrerollRevenue: 0,
    totalSpentOnRooms: 0,
  };
}

// Cumulative P&L totals from monthly data
export function getCumulativePnL(monthlyPnL: MonthlyPnLEntry[]) {
  return monthlyPnL.reduce(
    (acc, entry) => ({
      revenue: acc.revenue + (entry.harvestRevenue || 0) + (entry.preroll || 0),
      overhead: acc.overhead + (entry.overhead || 0),
      net: acc.net + (entry.net || 0),
    }),
    { revenue: 0, overhead: 0, net: 0 }
  );
}

/** Compute current game date from store state fields */
export function getCurrentGameDate(gameStartRealMs: number, bonusGameDays: number): GameDate {
  const totalRealMs = Date.now() - gameStartRealMs;
  const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (bonusGameDays || 0);
  return msToGameDate(totalGameDays * MS_PER_GAME_DAY);
}

/** Compute current game date from state fields - use this everywhere instead of msToGameDate(lastTickRealMs) */
export function getGameDateFromState(gameStartRealMs: number, bonusGameDays: number): GameDate {
  const totalRealMs = Date.now() - gameStartRealMs;
  const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (bonusGameDays || 0);
  return msToGameDate(totalGameDays * MS_PER_GAME_DAY);
}
