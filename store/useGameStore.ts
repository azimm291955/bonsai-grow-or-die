import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import type { GameState, GameDate, Room } from "@/lib/types";
import {
  ROOM_COSTS, UPGRADE_TRACKS, VEG_DAYS,
  MS_PER_GAME_DAY, GAME_START_DATE,
  EXCISE_TAX_RATE, BROKER_FEE_RATE, COVID_DEMAND_MOD,
  BASE_YIELD_PER_HARVEST, ACHIEVEMENTS,
} from "@/lib/constants";
import {
  createInitialState, migrateUpgrades, msToGameDate, getQuarter,
  getAMR, getVegDaysForRoom, getFlowerDaysForRoom, getMonthlyOverheadForRoom,
  getPrerollPriceForRoom, hasAutoFlipForRoom, getRotSpeedMultiplierForRoom,
  getRotQuality, getYieldMultiplierForRoom, getPriceMultiplierForRoom,
  getVegQualityBonus, getRoomUpgradeTier, getUpgradeCostForRoom, formatCash,
} from "@/lib/helpers";

// ============================================================
// UI State (not persisted)
// ============================================================
interface UIState {
  screen: string;
  activeTab: string;
  selectedRoom: number | null;
  showVC: boolean;
  showEvent: string | null;
  nameInput: string;
  roomTypeChoice: "veg" | "flower" | null;
  showRoomBuy: number | null;
  showResetConfirm: boolean;
  showAMRInfo: boolean;
  showRunwayInfo: boolean;
  showBurnInfo: boolean;
  gameSpeed: number;
  paused: boolean;
  autoPaused: boolean;
  showAchievement: string | null;
  achievementQueue: string[];
}

// ============================================================
// Store interface
// ============================================================
interface GameStore {
  // Game state (persisted)
  state: GameState | null;

  // UI state (not persisted)
  ui: UIState;

  // UI setters
  setScreen: (s: string) => void;
  setActiveTab: (t: string) => void;
  setSelectedRoom: (i: number | null) => void;
  setShowVC: (v: boolean) => void;
  setShowEvent: (id: string | null) => void;
  setNameInput: (n: string) => void;
  setRoomTypeChoice: (t: "veg" | "flower" | null) => void;
  setShowRoomBuy: (i: number | null) => void;
  setShowResetConfirm: (v: boolean) => void;
  setShowAMRInfo: (v: boolean) => void;
  setShowRunwayInfo: (v: boolean) => void;
  setShowBurnInfo: (v: boolean) => void;
  setGameSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
  setShowAchievement: (id: string | null) => void;

  // Game actions
  initFromStorage: () => void;
  startGame: () => void;
  unlockRoom: (index: number) => void;
  startGrowing: (roomIndex: number) => void;
  flipToFlower: (vegIndex: number, flowerIndex: number) => void;
  harvest: (index: number) => void;
  destroyCrop: (roomIndex: number) => void;
  buyUpgrade: (track: string, tierIndex: number, roomIndex: number) => void;
  acceptVC: () => void;
  declineVC: () => void;
  resetGame: () => void;
  advanceTutorial: (toStep: number) => void;

  // Tick
  processTick: () => void;

  // Achievements
  processAchievementQueue: () => void;
  processNotifications: () => void;
}

// ============================================================
// Helpers
// ============================================================

const DEFAULT_UI: UIState = {
  screen: "loading",
  activeTab: "facility",
  selectedRoom: null,
  showVC: false,
  showEvent: null,
  nameInput: "",
  roomTypeChoice: null,
  showRoomBuy: null,
  showResetConfirm: false,
  showAMRInfo: false,
  showRunwayInfo: false,
  showBurnInfo: false,
  gameSpeed: 1,
  paused: false,
  autoPaused: false,
  showAchievement: null,
  achievementQueue: [],
};

function getCurrentGameDate(s: GameState): GameDate {
  const totalRealMs = Date.now() - s.gameStartRealMs;
  const totalGameMs = totalRealMs + (s.bonusGameDays || 0) * MS_PER_GAME_DAY;
  return msToGameDate(totalGameMs);
}

/** 
 * Achievement checker — mutates state in place, pushes to queue.
 * Returns array of newly unlocked achievement IDs.
 */
function checkAchievements(ns: GameState, gd: GameDate, extras: Record<string, unknown>): string[] {
  if (!ns || ns.tutorialStep < 5) return [];
  if (!ns.achievements) ns.achievements = {};
  if (!ns.achievementProgress) ns.achievementProgress = {};
  if (!ns.roomsHarvested) ns.roomsHarvested = {};

  const newlyUnlocked: string[] = [];
  const unlock = (id: string) => {
    if (ns.achievements[id]) return;
    ns.achievements[id] = true;
    newlyUnlocked.push(id);
  };

  const totalHarvests = ns.rooms.reduce((s, r) => s + r.harvestCount, 0);
  const unlockedRooms = ns.rooms.filter(r => r.unlocked);
  const unlockedCount = unlockedRooms.length;
  const nonEmptyRooms = unlockedRooms.filter(r => r.status !== "empty");
  const roomsWithHarvests = Object.keys(ns.roomsHarvested || {}).length;

  // CULTIVATION
  ns.achievementProgress.harvest_10 = totalHarvests;
  ns.achievementProgress.harvest_30 = totalHarvests;
  if (totalHarvests >= 1) unlock("first_harvest");
  if (totalHarvests >= 10) unlock("harvest_10");
  if (totalHarvests >= 30) unlock("harvest_30");
  ns.achievementProgress.assembly_line = roomsWithHarvests;
  if (roomsWithHarvests >= 5) unlock("assembly_line");
  if (extras?.cropDeath || ns.hadCropRot) unlock("crop_death");

  // FINANCIAL
  ns.achievementProgress.rev_1m = ns.totalRevenue;
  ns.achievementProgress.rev_5m = ns.totalRevenue;
  ns.achievementProgress.rev_25m = ns.totalRevenue;
  if (ns.totalRevenue >= 1000000) unlock("rev_1m");
  if (ns.totalRevenue >= 5000000) unlock("rev_5m");
  if (ns.totalRevenue >= 25000000) unlock("rev_25m");
  ns.achievementProgress.cash_hoarder = ns.cash;
  if (ns.cash >= 2000000) unlock("cash_hoarder");
  if (extras?.redMonth) unlock("red_month");

  // FACILITY
  ns.achievementProgress.rooms_4 = unlockedCount;
  ns.achievementProgress.rooms_9 = unlockedCount;
  if (unlockedCount >= 4) unlock("rooms_4");
  if (unlockedCount >= 9) unlock("rooms_9");
  if (unlockedCount >= 9 && nonEmptyRooms.length >= 9) unlock("all_active");

  // UPGRADES
  for (const [track, trackData] of Object.entries(UPGRADE_TRACKS)) {
    const maxTier = trackData.tiers.length;
    for (const tier of Object.values(ns.upgrades[track] || {})) {
      if ((tier as number) >= maxTier) { unlock("track_master"); break; }
    }
  }
  for (const room of unlockedRooms) {
    let allMaxed = true;
    for (const [track, trackData] of Object.entries(UPGRADE_TRACKS)) {
      if (getRoomUpgradeTier(ns.upgrades, track, room.index) < trackData.tiers.length) {
        allMaxed = false; break;
      }
    }
    if (allMaxed) { unlock("fully_loaded"); break; }
  }
  if (unlockedCount >= 2) {
    let allRoomsMaxed = true;
    for (const room of unlockedRooms) {
      for (const [track, trackData] of Object.entries(UPGRADE_TRACKS)) {
        if (getRoomUpgradeTier(ns.upgrades, track, room.index) < trackData.tiers.length) {
          allRoomsMaxed = false; break;
        }
      }
      if (!allRoomsMaxed) break;
    }
    if (allRoomsMaxed) unlock("completionist");
  }

  // SURVIVAL & ERAS
  if (gd.year >= 2019) unlock("crash_2018");
  if (gd.year >= 2021) unlock("covid_2020");
  if (gd.year >= 2023) unlock("cliff_2022");

  if (ns.gameWon) {
    unlock("win_game");
    if (!ns.vcTaken) unlock("pure_grower");
    if (unlockedCount === 4) unlock("minimalist");
    if (ns.hadCropRot) unlock("phoenix");
  }

  // CHALLENGE
  const realDaysPlayed = (Date.now() - ns.gameStartRealMs) / (1000 * 60 * 60 * 24);
  if (realDaysPlayed >= 7) unlock("patient_grower");

  return newlyUnlocked;
}

/** Ensure old saves have all fields */
function migrateSavedState(saved: GameState): GameState {
  if (saved.upgrades) {
    saved.upgrades = migrateUpgrades(saved.upgrades, saved.rooms || []);
  }
  if (!saved.achievements) saved.achievements = {};
  if (!saved.achievementProgress) saved.achievementProgress = {};
  if (!saved.roomsHarvested) saved.roomsHarvested = {};
  if (saved.totalSpentOnUpgrades === undefined) saved.totalSpentOnUpgrades = 0;
  if (saved.consecutiveProfitMonths === undefined) saved.consecutiveProfitMonths = 0;
  if (saved.hadCropRot === undefined) saved.hadCropRot = false;
  if (saved.totalLbsProduced === undefined) saved.totalLbsProduced = 0;
  if (saved.peakCash === undefined) saved.peakCash = saved.cash || 0;
  if (saved.lowestCash === undefined) saved.lowestCash = saved.cash || 0;
  if (saved.totalWholesaleRevenue === undefined) saved.totalWholesaleRevenue = 0;
  if (saved.totalPrerollRevenue === undefined) saved.totalPrerollRevenue = 0;
  if (saved.totalSpentOnRooms === undefined) saved.totalSpentOnRooms = 0;
  if (saved.vcTriggered === undefined) saved.vcTriggered = false;
  if (!saved.harvestLog) saved.harvestLog = [];
  if (saved.pausedAtMs === undefined) saved.pausedAtMs = null;
  return saved;
}

// Helper to update a room immutably
function updateRoom(rooms: Room[], index: number, changes: Partial<Room>): Room[] {
  const newRooms = [...rooms];
  newRooms[index] = { ...newRooms[index], ...changes };
  return newRooms;
}

// ============================================================
// THE STORE
// ============================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      ui: { ...DEFAULT_UI },

      // ── UI Setters ──
      setScreen: (s) => set((store) => ({ ui: { ...store.ui, screen: s } })),
      setActiveTab: (t) => set((store) => ({ ui: { ...store.ui, activeTab: t } })),
      setSelectedRoom: (i) => set((store) => {
        // Auto-resume: when closing the modal after an auto-pause, unpause the game
        if (i === null && store.ui.autoPaused) {
          const now = Date.now();
          const s = store.state;
          const pauseDuration = s?.pausedAtMs ? now - s.pausedAtMs : 0;
          return {
            ui: { ...store.ui, selectedRoom: null, paused: false, autoPaused: false },
            state: s ? {
              ...s,
              pausedAtMs: null,
              gameStartRealMs: s.gameStartRealMs + pauseDuration,
              lastTickRealMs: now,
            } : s,
          };
        }
        return { ui: { ...store.ui, selectedRoom: i } };
      }),
      setShowVC: (v) => set((store) => ({ ui: { ...store.ui, showVC: v } })),
      setShowEvent: (id) => set((store) => ({ ui: { ...store.ui, showEvent: id } })),
      setNameInput: (n) => set((store) => ({ ui: { ...store.ui, nameInput: n } })),
      setRoomTypeChoice: (t) => set((store) => ({ ui: { ...store.ui, roomTypeChoice: t } })),
      setShowRoomBuy: (i) => set((store) => ({ ui: { ...store.ui, showRoomBuy: i } })),
      setShowResetConfirm: (v) => set((store) => ({ ui: { ...store.ui, showResetConfirm: v } })),
      setShowAMRInfo: (v) => set((store) => ({ ui: { ...store.ui, showAMRInfo: v } })),
      setShowRunwayInfo: (v) => set((store) => ({ ui: { ...store.ui, showRunwayInfo: v } })),
      setShowBurnInfo: (v) => set((store) => ({ ui: { ...store.ui, showBurnInfo: v } })),
      setGameSpeed: (s) => set((store) => ({ ui: { ...store.ui, gameSpeed: s } })),
      setPaused: (p) => set((store) => {
        const now = Date.now();
        const s = store.state;
        if (p) {
          // Pausing — record when we paused
          return {
            ui: { ...store.ui, paused: true },
            state: s ? { ...s, pausedAtMs: now } : s,
          };
        } else {
          // Resuming — shift gameStartRealMs and lastTickRealMs forward
          // by the full pause duration so no time appears to have passed
          const pauseDuration = s?.pausedAtMs ? now - s.pausedAtMs : 0;
          return {
            ui: { ...store.ui, paused: false, autoPaused: false },
            state: s ? {
              ...s,
              pausedAtMs: null,
              gameStartRealMs: s.gameStartRealMs + pauseDuration,
              lastTickRealMs: now,
            } : s,
          };
        }
      }),
      setShowAchievement: (id) => set((store) => {
        const now = Date.now();
        const s = store.state;
        if (id === null && s) {
          // Dismissing — shift gameStartRealMs forward by the time spent
          // viewing the achievement so the game calendar doesn't jump ahead
          // of plant growth (same approach as manual pause resume).
          const shownDuration = now - s.lastTickRealMs;
          return {
            ui: { ...store.ui, showAchievement: id },
            state: {
              ...s,
              gameStartRealMs: s.gameStartRealMs + shownDuration,
              lastTickRealMs: now,
            },
          };
        }
        return { ui: { ...store.ui, showAchievement: id } };
      }),

      // ── Init from localStorage ──
      initFromStorage: () => {
        const { state: current, ui } = get();

        // Zustand persist may have already hydrated state from localStorage.
        // If so, we just need to set the screen — don't bail early.
        if (current && current.playerName) {
          if (ui.screen === "loading") {
            set((store) => ({ ui: { ...store.ui, screen: "game" } }));
          }
          return;
        }

        // Persist didn't load anything (or loaded null) — try manual load
        try {
          const raw = localStorage.getItem("bonsai_grow_or_die");
          if (raw) {
            const parsed = JSON.parse(raw);
            // persist middleware wraps in { state: { state: ... } }
            const saved = parsed?.state ? migrateSavedState(parsed.state) : null;
            if (saved && saved.playerName) {
              set({ state: saved, ui: { ...get().ui, screen: "game" } });
              return;
            }
          }
        } catch { /* noop */ }

        // No saved game found — go to onboarding
        set((store) => ({ ui: { ...store.ui, screen: "onboarding" } }));
      },

      // ── Start Game ──
      startGame: () => {
        const { ui } = get();
        if (!ui.nameInput.trim()) return;
        const initial = createInitialState(ui.nameInput.trim());
        // Room 1: veg fully grown, ready to flip
        initial.rooms[0].status = "ready_to_flip";
        initial.rooms[0].growStartMs = Date.now();
        initial.rooms[0].daysGrown = VEG_DAYS;
        initial.rooms[0].stalled = true;
        initial.rooms[0].type = "veg";
        initial.tutorialStep = 1; // triggers tutorial overlay in game UI
        set({ state: initial, ui: { ...ui, screen: "intro" } });
      },

      // ── Unlock Room ──
      unlockRoom: (index) => {
        const { state: s, ui } = get();
        if (!s) return;
        // During tutorial, only Room 2 (index 1) can be unlocked
        if (s.tutorialStep < 5 && index !== 1) return;
        const cost = ROOM_COSTS[index];
        if (s.cash < cost) return;

        const roomType = index === 1 ? "flower" : ui.roomTypeChoice;
        const isVegRoom = roomType === "veg";

        const newRooms = [...s.rooms];
        newRooms[index] = {
          ...newRooms[index],
          unlocked: true,
          type: roomType,
          status: isVegRoom ? ("growing" as const) : ("empty" as const),
          ...(isVegRoom && { daysGrown: 0, growStartMs: Date.now() }),
        };

        set({
          state: {
            ...s,
            cash: s.cash - cost,
            totalSpentOnRooms: (s.totalSpentOnRooms || 0) + cost,
            rooms: newRooms,
          },
          ui: { ...ui, showRoomBuy: null, roomTypeChoice: null },
        });
      },

      // ── Start Growing ──
      startGrowing: (roomIndex) => {
        const { state: s } = get();
        if (!s) return;
        const room = s.rooms[roomIndex];
        if (!room || !room.unlocked || room.status !== "empty") return;

        set({
          state: {
            ...s,
            rooms: updateRoom(s.rooms, roomIndex, {
              status: "growing",
              daysGrown: 0,
              growStartMs: Date.now(),
            }),
          },
        });
      },

      // ── Flip to Flower ──
      flipToFlower: (vegIndex, flowerIndex) => {
        const { state: s, ui } = get();
        if (!s) return;
        const veg = s.rooms[vegIndex];
        const flower = s.rooms[flowerIndex];
        if (!veg || !flower) return;
        if (veg.status !== "ready_to_flip") return;
        if (!flower.unlocked || flower.type !== "flower" || flower.status !== "empty") return;

        const rawVegQuality = getRotQuality(veg.rotDays, getRotSpeedMultiplierForRoom(s.upgrades, vegIndex));
        const vegBonus = getVegQualityBonus(s.upgrades, vegIndex);
        const vegQuality = Math.min(rawVegQuality * (1 + vegBonus), 1 + vegBonus);

        const newRooms = [...s.rooms];
        newRooms[flowerIndex] = {
          ...flower, status: "growing", daysGrown: 0, growStartMs: Date.now(),
          vegQuality, rotDays: 0,
        };
        newRooms[vegIndex] = {
          ...veg, status: "growing", daysGrown: 0, growStartMs: Date.now(),
          stalled: false, rotDays: 0,
        };

        const ns: GameState = structuredClone({ ...s, rooms: newRooms });
        const gd = getCurrentGameDate(ns);
        const newAch = checkAchievements(ns, gd, {});

        set({
          state: ns,
          ui: {
            ...ui,
            selectedRoom: null,
            achievementQueue: [...ui.achievementQueue, ...newAch],
          },
        });
      },

      // ── Harvest ──
      harvest: (index) => {
        const { state: s, ui } = get();
        if (!s) return;
        const room = s.rooms[index];
        if (room.status !== "ready_to_harvest") return;

        // Clone state for complex mutation
        const ns: GameState = structuredClone(s); // user-triggered, acceptable perf
        const r = ns.rooms[index];
        const gd = getCurrentGameDate(ns);
        const quarter = getQuarter(gd.month);
        const amr = getAMR(gd.year, quarter);
        const yieldMult = getYieldMultiplierForRoom(ns.upgrades, index);
        const priceMult = getPriceMultiplierForRoom(ns.upgrades, index);

        const rawVegQ = r.vegQuality || 1.0;
        const softenedVegQ = rawVegQ >= 1.0 ? rawVegQ : Math.max(0.85, 1.0 - (1.0 - rawVegQ) * 0.45);
        const lbs = Math.round(BASE_YIELD_PER_HARVEST * yieldMult * softenedVegQ);
        let salePrice = amr * priceMult;

        const rawRotQ = getRotQuality(r.rotDays, getRotSpeedMultiplierForRoom(ns.upgrades, index));
        const softenedRotQ = rawRotQ >= 1.0 ? 1.0 : 1.0 - (1.0 - rawRotQ) * 0.45;
        salePrice *= softenedRotQ;

        const covidMod = (COVID_DEMAND_MOD as Record<number, number[]>)[gd.year];
        if (covidMod) salePrice *= covidMod[quarter];

        const grossRevenue = lbs * salePrice;
        const excise = grossRevenue * EXCISE_TAX_RATE;
        const broker = grossRevenue * BROKER_FEE_RATE;
        // Excise + broker both deducted immediately at harvest
        const netRevenue = grossRevenue - broker - excise;
        const effectiveWholesale = netRevenue * (1 - ns.vcRevenuePenalty);
        const effectiveExcise = excise * (1 - ns.vcRevenuePenalty);

        // Pre-roll revenue from trim (instant payout)
        const trimLbs = Math.round(lbs * 0.33);
        const prerollPrice = getPrerollPriceForRoom(ns.upgrades, index);
        const prerollGross = trimLbs * prerollPrice;
        const effectivePreroll = prerollGross * (1 - ns.vcRevenuePenalty);

        const totalEffectiveRevenue = effectiveWholesale + effectivePreroll;

        ns.cash += totalEffectiveRevenue;
        ns.totalRevenue += totalEffectiveRevenue;
        ns.totalCosts += effectiveExcise;
        ns.totalLbsProduced = (ns.totalLbsProduced || 0) + lbs;
        ns.totalWholesaleRevenue = (ns.totalWholesaleRevenue || 0) + effectiveWholesale;
        ns.totalPrerollRevenue = (ns.totalPrerollRevenue || 0) + effectivePreroll;

        if (ns.cash > (ns.peakCash || 0)) ns.peakCash = ns.cash;
        if (ns.cash < (ns.lowestCash ?? ns.cash)) ns.lowestCash = ns.cash;

        r.status = "empty";
        r.daysGrown = 0;
        r.growStartMs = null;
        r.rotDays = 0;
        r.harvestCount += 1;

        // Auto-flip
        if (r.type === "flower" && r.harvestCount > 0) {
          const waitingVeg = ns.rooms.find(v =>
            v.unlocked && v.type === "veg" && v.status === "ready_to_flip" &&
            hasAutoFlipForRoom(ns.upgrades, v.index)
          );
          if (waitingVeg) {
            const rawVegQ2 = getRotQuality(waitingVeg.rotDays || 0, getRotSpeedMultiplierForRoom(ns.upgrades, waitingVeg.index));
            const autoVegBonus = getVegQualityBonus(ns.upgrades, waitingVeg.index);
            const vegQ2 = Math.min(rawVegQ2 * (1 + autoVegBonus), 1 + autoVegBonus);
            r.status = "growing";
            r.daysGrown = 0;
            r.growStartMs = Date.now();
            r.vegQuality = vegQ2;
            r.rotDays = 0;
            waitingVeg.status = "growing";
            waitingVeg.daysGrown = 0;
            waitingVeg.growStartMs = Date.now();
            waitingVeg.stalled = false;
            waitingVeg.rotDays = 0;
            ns.notifications.push({
              type: "harvest",
              message: `⚡ Auto-flip: Room ${waitingVeg.index + 1} veg → Room ${r.index + 1} flower`,
            });
          }
        }

        if (ns.monthlyPnL.length > 0) {
          const lastPnL = ns.monthlyPnL[ns.monthlyPnL.length - 1];
          lastPnL.harvestRevenue += effectiveWholesale;
          lastPnL.preroll += effectivePreroll;
          lastPnL.net += totalEffectiveRevenue;
          lastPnL.cash = ns.cash;
        }

        const rotPenaltyMsg = softenedRotQ < 1.0 ? ` (${Math.round(softenedRotQ * 100)}% quality)` : "";
        const prerollMsg = effectivePreroll > 0 ? ` + ${formatCash(effectivePreroll)} pre-roll` : "";
        const exciseMsg = ` | ${formatCash(effectiveExcise)} excise paid`;
        const harvestMessage = `Harvested ${lbs} lbs @ ${formatCash(salePrice)}/lb = ${formatCash(effectiveWholesale)} wholesale${prerollMsg}${rotPenaltyMsg}${exciseMsg}`;
        ns.notifications.push({
          type: "harvest",
          message: harvestMessage,
        });

        // Persistent harvest log — survives refresh
        const MONTH_NAMES_STORE = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const _harvestRealMs = Date.now() - ns.gameStartRealMs;
        const _harvestTotalGameDays = (_harvestRealMs / MS_PER_GAME_DAY) + (ns.bonusGameDays || 0);
        const harvestGd = msToGameDate(_harvestTotalGameDays * MS_PER_GAME_DAY);
        if (!ns.harvestLog) ns.harvestLog = [];
        ns.harvestLog.push({
          message: harvestMessage,
          gameDateLabel: `${MONTH_NAMES_STORE[harvestGd.month - 1]} ${harvestGd.year}`,
          ts: Date.now(),
        });

        if (!ns.roomsHarvested) ns.roomsHarvested = {};
        ns.roomsHarvested[index] = true;

        const newAch = checkAchievements(ns, gd, {});

        set({
          state: ns,
          ui: { ...ui, achievementQueue: [...ui.achievementQueue, ...newAch] },
        });
      },

      // ── Destroy Crop (manual abandon) ──
      destroyCrop: (roomIndex) => {
        const { state: s, ui } = get();
        if (!s) return;
        const room = s.rooms[roomIndex];
        if (!room || !room.unlocked) return;
        if (room.status === "empty") return; // nothing to destroy

        set({
          state: {
            ...s,
            rooms: updateRoom(s.rooms, roomIndex, {
              status: "empty",
              daysGrown: 0,
              growStartMs: null,
              rotDays: 0,
              stalled: false,
              vegQuality: undefined,
              _rot50warned: false,
              _rot25warned: false,
            }),
            notifications: [
              ...s.notifications,
              { type: "rot_destroyed" as const, message: `🗑️ Room ${roomIndex + 1} crop destroyed by operator.` },
            ],
          },
          ui: { ...ui, selectedRoom: null },
        });
      },

      // ── Buy Upgrade ──
      buyUpgrade: (track, tierIndex, roomIndex) => {
        const { state: s, ui } = get();
        if (!s) return;
        const tier = UPGRADE_TRACKS[track].tiers[tierIndex];
        const scaledCost = getUpgradeCostForRoom(track, tierIndex, s.upgrades);
        if (s.cash < scaledCost) return;
        if (getRoomUpgradeTier(s.upgrades, track, roomIndex) !== tierIndex) return;
        if (!s.rooms[roomIndex]?.unlocked) return;
        // Pre-roll upgrades only apply to flower rooms
        if (track === "preroll" && s.rooms[roomIndex]?.type !== "flower") return;

        if (tier.yearGate) {
          const gd = getCurrentGameDate(s);
          if (gd.year < tier.yearGate) return;
        }

        const newUpgrades = { ...s.upgrades };
        newUpgrades[track] = { ...newUpgrades[track], [roomIndex]: tierIndex + 1 };

        const ns: GameState = structuredClone({
          ...s,
          cash: s.cash - scaledCost,
          totalSpentOnUpgrades: (s.totalSpentOnUpgrades || 0) + scaledCost,
          upgrades: newUpgrades,
        });

        const gd = getCurrentGameDate(ns);
        const newAch = checkAchievements(ns, gd, {});

        set({
          state: ns,
          ui: { ...ui, achievementQueue: [...ui.achievementQueue, ...newAch] },
        });
      },

      // ── Accept VC ──
      acceptVC: () => {
        const { state: s, ui } = get();
        if (!s) return;

        const ns: GameState = structuredClone(s); // user-triggered, acceptable perf
        const activeRooms = ns.rooms.filter(r => r.unlocked);
        const roomsToLose = Math.floor(activeRooms.length / 2);

        const gd = getCurrentGameDate(ns);
        let totalMonthlyOverhead = 0;
        for (const r of activeRooms) {
          totalMonthlyOverhead += getMonthlyOverheadForRoom(gd.year, ns.upgrades, r.index, r.status).total;
        }

        let lost = 0;
        for (let i = 8; i >= 2 && lost < roomsToLose; i--) {
          if (ns.rooms[i].unlocked) {
            ns.rooms[i].unlocked = false;
            ns.rooms[i].status = "empty";
            ns.rooms[i].type = null;
            ns.rooms[i].daysGrown = 0;
            ns.rooms[i].growStartMs = null;
            lost++;
          }
        }

        ns.cash = totalMonthlyOverhead * 3;
        ns.vcTaken = true;
        ns.vcRevenuePenalty = 0.15;
        ns.vcOverheadCredit = 0.05;
        ns.notifications = [];

        // Shift gameStartRealMs forward by time spent viewing the VC modal
        // so the game calendar doesn't jump ahead of plant growth.
        const now = Date.now();
        const shownDuration = now - ns.lastTickRealMs;
        ns.gameStartRealMs += shownDuration;
        ns.lastTickRealMs = now;
        set({ state: ns, ui: { ...ui, showVC: false } });
      },

      // ── Decline VC ──
      declineVC: () => {
        const { state: s, ui } = get();
        if (!s) return;
        // Game over — no need to shift gameStartRealMs since time stops anyway
        set({
          state: { ...s, gameOver: true, deathCause: "Declined Vulture Capital. Cash hit $0." },
          ui: { ...ui, showVC: false },
        });
      },

      // ── Reset Game ──
      resetGame: () => {
        localStorage.removeItem("bonsai_grow_or_die");
        set({ state: null, ui: { ...DEFAULT_UI, screen: "onboarding" } });
      },

      // ── Tutorial Actions ──
      advanceTutorial: (toStep) => {
        const { state: s } = get();
        if (!s) return;
        // Prevent re-running completed tutorial (would reset game state)
        if (s.tutorialStep >= 5 && toStep <= s.tutorialStep) return;
        const ns: GameState = structuredClone(s); // user-triggered, acceptable perf
        ns.tutorialStep = toStep;

        if (toStep === 5) {
          // Bake in the full post-tutorial state:
          // Game starts at GAME_START_DATE (Feb 26, 2016). Room 2 is pre-seeded ready to harvest.
          ns.gameStartRealMs = Date.now();
          ns.lastTickRealMs = Date.now();
          ns.bonusGameDays = 0;
          ns.lastProcessedMonth = 2; // Feb 2016 billed in warp narrative; first real charge = Mar 2016 (month 3 relative to new GAME_START_DATE Feb 2016)
          // AMR Q1 2016 = $1880. 420 lbs × $1880 = $789,600 gross.
          // Broker 8% = $63,168. Excise 15% = $118,440 (IMMEDIATE at harvest).
          // Net payout = $789,600 - $63,168 - $118,440 = $607,992.
          // Target $765K post-harvest → pre-harvest cash = $765K - $607,992 = $157,008.
          ns.cash = 157008;
          ns.totalRevenue = 0;
          ns.totalCosts = 250000; // room2 purchase only; overhead baked into cash
          ns.totalWholesaleRevenue = 0;
          ns.totalLbsProduced = 0;
          ns.peakCash = 765000;
          ns.lowestCash = 157008;
          ns.totalSpentOnRooms = 250000;
          // Room 1: veg done, waiting for player to flip
          ns.rooms[0].status = "ready_to_flip";
          ns.rooms[0].type = "veg";
          ns.rooms[0].daysGrown = 32;
          ns.rooms[0].growStartMs = null;
          ns.rooms[0].stalled = true;
          ns.rooms[0].rotDays = 0;
          // Room 2: flower room ready to harvest — player does this live!
          ns.rooms[1].unlocked = true;
          ns.rooms[1].type = "flower";
          ns.rooms[1].status = "ready_to_harvest";
          ns.rooms[1].daysGrown = 64;
          ns.rooms[1].growStartMs = null;
          ns.rooms[1].rotDays = 0;
          ns.rooms[1].stalled = false;
          ns.rooms[1].harvestCount = 0;
          ns.roomsHarvested = {};
          // Seed the P&L ledger with the warp months
          ns.monthlyPnL = [
            { year: 2015, month: 12, overhead: 168000, preroll: 0, harvestRevenue: 0, net: -168000, cash: 329208 },
            { year: 2016, month: 1,  overhead: 172200, preroll: 0, harvestRevenue: 0, net: -172200, cash: 157008 },
          ];
        }
        set({ state: ns });
      },

      // ── Process Tick (hot path) ──
      processTick: () => {
        const { state: prev, ui } = get();
        if (!prev || prev.gameOver || prev.gameWon) return;
        if (ui.paused || prev.pausedAtMs !== null) return; // safety guard

        const now = Date.now();
        const elapsedMs = Math.min(now - prev.lastTickRealMs, 30000);
        const baseGameDays = elapsedMs / MS_PER_GAME_DAY;
        if (baseGameDays <= 0) return;

        let newAch: string[] = [];
        let autoPauseRoomIndex: number | null = null;

        // Snapshot which rooms are already ready_to_harvest BEFORE this tick
        const alreadyReady = new Set(
          prev.rooms.filter(r => r.status === "ready_to_harvest").map(r => r.index)
        );

        // Immer produce — mutable draft with structural sharing.
        // Only modified objects get new references, preventing
        // unnecessary re-renders on unchanged rooms/fields.
        const ns = produce(prev, (draft) => {
          draft.lastTickRealMs = now;
          const effectiveGameDays = baseGameDays * ui.gameSpeed;
          const bonusDays = baseGameDays * (ui.gameSpeed - 1);
          draft.bonusGameDays = (draft.bonusGameDays || 0) + bonusDays;

          const totalRealMs = now - draft.gameStartRealMs;
          const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (draft.bonusGameDays || 0);
          const gd = msToGameDate(totalGameDays * MS_PER_GAME_DAY);

          // Win condition
          const pastWinDate = gd.year > 2026 || (gd.year === 2026 && (gd.month > 4 || (gd.month === 4 && gd.day >= 20)));
          if (pastWinDate) {
            const activeRooms = draft.rooms.filter(r => r.unlocked).length;
            if (draft.cash > 0 && activeRooms >= 4) {
              draft.gameWon = true;
              draft.winType = draft.vcTaken ? "vc" : "pure";
              return;
            } else if (gd.year > 2026 || (gd.year === 2026 && gd.month > 4)) {
              draft.gameOver = true;
              draft.deathCause = draft.cash <= 0 ? "Ran out of cash" : "Not enough active rooms (need 4+)";
              return;
            }
          }

          // Process rooms
          for (const room of draft.rooms) {
            if (!room.unlocked) continue;
            const rotSpeed = getRotSpeedMultiplierForRoom(draft.upgrades, room.index);

            if (room.status === "growing") {
              room.daysGrown += effectiveGameDays;
              room.rotDays = 0;
              const targetDays = room.type === "veg"
                ? getVegDaysForRoom(draft.upgrades, room.index)
                : getFlowerDaysForRoom(draft.upgrades, room.index);

              if (room.daysGrown >= targetDays) {
                if (room.type === "veg") {
                  if (hasAutoFlipForRoom(draft.upgrades, room.index)) {
                    const availFlower = draft.rooms.find(r =>
                      r.unlocked && r.type === "flower" && r.status === "empty" && r.harvestCount > 0
                    );
                    if (availFlower) {
                      const rawVegQ = getRotQuality(0, getRotSpeedMultiplierForRoom(draft.upgrades, room.index));
                      const autoVegBonus = getVegQualityBonus(draft.upgrades, room.index);
                      availFlower.status = "growing";
                      availFlower.daysGrown = 0;
                      availFlower.growStartMs = now;
                      availFlower.vegQuality = Math.min(rawVegQ * (1 + autoVegBonus), 1 + autoVegBonus);
                      room.status = "growing";
                      room.daysGrown = 0;
                      room.growStartMs = now;
                      continue;
                    }
                  }
                  room.status = "ready_to_flip";
                  room.stalled = true;
                  room.rotDays = 0;
                } else {
                  room.status = "ready_to_harvest";
                  room.rotDays = 0;
                  // Auto-pause: flag this room if it just became ready
                  if (!alreadyReady.has(room.index) && autoPauseRoomIndex === null) {
                    autoPauseRoomIndex = room.index;
                  }
                }
              }
            }

            if (room.status === "ready_to_flip" || room.status === "ready_to_harvest") {
              room.rotDays += effectiveGameDays;
              const quality = getRotQuality(room.rotDays, rotSpeed);
              if (quality <= 0.5 && quality > 0.45 && !room._rot50warned) {
                room._rot50warned = true;
                draft.notifications.push({ type: "rot_warning", message: `⚠️ Room ${room.index + 1} quality dropping — ${room.status === "ready_to_harvest" ? "harvest" : "flip"} soon! (${Math.round(quality * 100)}%)` });
              }
              if (quality <= 0.25 && quality > 0.2 && !room._rot25warned) {
                room._rot25warned = true;
                draft.notifications.push({ type: "rot_warning", message: `🚨 Room ${room.index + 1} CRITICAL — quality at ${Math.round(quality * 100)}%! Act now or lose the crop!` });
              }
              if (quality <= 0) {
                room.status = "empty"; room.daysGrown = 0; room.growStartMs = null;
                room.rotDays = 0; room._rot50warned = false; room._rot25warned = false;
                draft.hadCropRot = true; draft._achCropDeath = true;
                draft.notifications.push({ type: "rot_destroyed", message: `💀 Room ${room.index + 1} crop DESTROYED — plants died from neglect.` });
              }
            }
            if (room.status !== "ready_to_flip" && room.status !== "ready_to_harvest") {
              room._rot50warned = false; room._rot25warned = false;
            }
          }

          // Monthly overhead
          const currentMonth = (gd.year - GAME_START_DATE.year) * 12 + gd.month;
          if (currentMonth > draft.lastProcessedMonth) {
            const monthsToProcess = Math.min(currentMonth - draft.lastProcessedMonth, 12);
            for (let m = 0; m < monthsToProcess; m++) {
              const processMonth = draft.lastProcessedMonth + m + 1;
              const pYear = GAME_START_DATE.year + Math.floor((processMonth - 1) / 12);
              const pMonth = ((processMonth - 1) % 12) + 1;
              let totalOverhead = 0;
              for (const r of draft.rooms) { if (r.unlocked) totalOverhead += getMonthlyOverheadForRoom(pYear, draft.upgrades, r.index, r.status).total; }
              if (draft.vcOverheadCredit > 0) totalOverhead *= (1 - draft.vcOverheadCredit);
              draft.cash -= totalOverhead;
              draft.totalCosts += totalOverhead;
              if (draft.cash > (draft.peakCash || 0)) draft.peakCash = draft.cash;
              if (draft.cash < (draft.lowestCash ?? draft.cash)) draft.lowestCash = draft.cash;
              if (draft.monthlyPnL.length > 200) draft.monthlyPnL.shift();
              const monthNet = -totalOverhead;
              draft.monthlyPnL.push({ year: pYear, month: pMonth, overhead: totalOverhead, preroll: 0, harvestRevenue: 0, net: monthNet, cash: draft.cash });
              if (monthNet < 0) {
                // Only trigger Red Month achievement after the tutorial period (Apr 2016+)
                if (pYear > 2016 || (pYear === 2016 && pMonth >= 4)) draft._achRedMonth = true;
                draft.consecutiveProfitMonths = 0;
              }
              else { draft.consecutiveProfitMonths = (draft.consecutiveProfitMonths || 0) + 1; }
            }
            draft.lastProcessedMonth = currentMonth;
          }

          // Narrative events
          const quarter = getQuarter(gd.month);
          for (const ec of [{ year: 2018, quarter: 0, id: "amr_2018_crash" }, { year: 2020, quarter: 0, id: "covid_2020" }, { year: 2022, quarter: 0, id: "amr_2022_cliff" }]) {
            if (gd.year === ec.year && quarter >= ec.quarter && !draft.eventsShown[ec.id]) {
              draft.eventsShown[ec.id] = true;
              draft.notifications.push({ type: "event", id: ec.id });
            }
          }

          // VC trigger
          if (draft.cash <= 0 && !draft.vcTaken && !draft.gameOver && !draft.vcTriggered) {
            draft.vcTriggered = true;
            draft.notifications.push({ type: "vc_trigger" });
          } else if (draft.cash <= 0 && draft.vcTaken) {
            draft.gameOver = true;
            draft.deathCause = "Second bankruptcy. Vulture Capital already used.";
          }

          // Prune stale display-only notifications (keep last 4 of each type)
          const MAX_DISPLAY_NOTIFS = 4;
          const displayTypes = ["harvest", "rot_warning", "rot_destroyed"] as const;
          for (const dtype of displayTypes) {
            const matching = draft.notifications.filter(n => n.type === dtype);
            if (matching.length > MAX_DISPLAY_NOTIFS) {
              const toRemove = matching.slice(0, matching.length - MAX_DISPLAY_NOTIFS);
              draft.notifications = draft.notifications.filter(n => !toRemove.includes(n));
            }
          }

          // Achievements
          const tickExtras = { redMonth: draft._achRedMonth, cropDeath: draft._achCropDeath };
          draft._achRedMonth = false; draft._achCropDeath = false;
          newAch = checkAchievements(draft as GameState, gd, tickExtras);
        });

        // Build updated UI — merge achievements if any
        let updatedUI = newAch.length > 0
          ? { ...ui, achievementQueue: [...ui.achievementQueue, ...newAch] }
          : { ...ui };

        // Auto-pause on harvest ready: pause the game and open the room modal
        let finalState = ns;
        if (autoPauseRoomIndex !== null) {
          updatedUI.paused = true;
          updatedUI.autoPaused = true;
          updatedUI.selectedRoom = autoPauseRoomIndex;
          // Record pausedAtMs so resume logic works correctly
          // (ns is frozen by Immer, so spread a new object)
          finalState = { ...ns, pausedAtMs: Date.now() };
        }

        set({ state: finalState, ui: updatedUI });
      },

      // ── Achievement Queue ──
      processAchievementQueue: () => {
        const { ui } = get();
        if (ui.showAchievement) return; // One at a time
        if (ui.achievementQueue.length === 0) return;
        const [next, ...rest] = ui.achievementQueue;
        set({ ui: { ...ui, showAchievement: next, achievementQueue: rest } });
      },

      // ── Notification Processing ──
      processNotifications: () => {
        const { state: s, ui } = get();
        if (!s?.notifications?.length) return;

        const vcNotif = s.notifications.find(n => n.type === "vc_trigger");
        if (vcNotif && !ui.showVC) {
          set({
            state: { ...s, notifications: s.notifications.filter(n => n.type !== "vc_trigger") },
            ui: { ...ui, showVC: true },
          });
          return;
        }

        const eventNotif = s.notifications.find(n => n.type === "event");
        if (eventNotif && !ui.showVC) {
          set({
            state: { ...s, notifications: s.notifications.filter(n => n !== eventNotif) },
            ui: { ...ui, showEvent: eventNotif.id ?? null },
          });
        }
      },
    }),
    {
      name: "bonsai_grow_or_die",
      partialize: (store) => ({ state: store.state }),
      // After persist hydrates state from localStorage, set the screen
      onRehydrateStorage: () => (hydratedState) => {
        if (hydratedState?.state?.playerName) {
          // Persist loaded a valid save — go to game screen
          useGameStore.setState((store) => ({
            ui: { ...store.ui, screen: "game" },
          }));
        } else {
          // No valid save — show onboarding
          useGameStore.setState((store) => ({
            ui: { ...store.ui, screen: "onboarding" },
          }));
        }
      },
    }
  )
);
