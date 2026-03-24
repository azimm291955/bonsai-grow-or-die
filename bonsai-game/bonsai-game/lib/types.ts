export interface Room {
  index: number;
  unlocked: boolean;
  type: "veg" | "flower" | null;
  status: "empty" | "growing" | "ready_to_flip" | "ready_to_harvest";
  daysGrown: number;
  rotDays: number;
  harvestCount: number;
  growStartMs: number | null;
  stalled: boolean;
  vegQuality?: number;
  _rot50warned?: boolean;
  _rot25warned?: boolean;
  _rot10warned?: boolean;
}

export interface UpgradeMap {
  [roomIndex: number]: number;
}

export interface Upgrades {
  lighting: UpgradeMap;
  irrigation: UpgradeMap;
  environmental: UpgradeMap;
  genetics: UpgradeMap;
  preroll: UpgradeMap;
  operations: UpgradeMap;
  [key: string]: UpgradeMap;
}

export interface MonthlyPnLEntry {
  year: number;
  month: number;
  revenue?: number;
  harvestRevenue: number;
  preroll: number;
  overhead: number;
  net: number;
  cash: number;
  cashEnd?: number;
}

export interface GameNotification {
  type: "vc_trigger" | "event" | "rot_warning" | "rot_destroyed" | "harvest" | "excise_paid";
  message?: string;
  id?: string;
}

export interface ExciseLiability {
  amount: number;
  dueYear: number;
  dueMonth: number;
}

export interface GameState {
  playerName: string;
  cash: number;
  totalRevenue: number;
  totalCosts: number;
  rooms: Room[];
  upgrades: Upgrades;
  gameStartRealMs: number;
  lastTickRealMs: number;
  pausedAtMs: number | null;
  vcTaken: boolean;
  vcTriggered: boolean;
  vcRevenuePenalty: number;
  vcOverheadCredit: number;
  gameOver: boolean;
  gameWon: boolean;
  winType: "vc" | "pure" | null;
  deathCause?: string;
  monthlyPnL: MonthlyPnLEntry[];
  lastProcessedMonth: number;
  notifications: GameNotification[];
  eventsShown: Record<string, boolean>;
  tutorialStep: number;
  bonusGameDays: number;
  achievements: Record<string, boolean>;
  achievementProgress: Record<string, number>;
  totalSpentOnUpgrades: number;
  consecutiveProfitMonths: number;
  hadCropRot: boolean;
  roomsHarvested: Record<string, boolean>;
  totalLbsProduced: number;
  peakCash: number;
  lowestCash: number;
  totalWholesaleRevenue: number;
  totalPrerollRevenue: number;
  totalSpentOnRooms: number;
  exciseLiabilities: ExciseLiability[];
  _achRedMonth?: boolean;
  _achCropDeath?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  cash: number;
  rooms: number;
  harvests: number;
  ts: number;
}

export interface GameDate {
  year: number;
  month: number;
  day: number;
}

export interface OverheadBreakdown {
  rent: number;
  electricity: number;
  labor: number;
  nutrients: number;
  license: number;
  total: number;
}

export interface UpgradeTier {
  name: string;
  desc: string;
  cost: number;
  effect?: string;
  yearGate?: number;
  electricityMod?: number;
  yieldMod?: number;
  laborMod?: number;
  nutrientMod?: number;
  co2Mod?: number;
  priceMod?: number;
  monthlyRevenue?: number;
  operatingCostPct?: number;
  prerollPricePerLb?: number;
  autoFlip?: boolean;
  rotSpeedMult?: number;
  vegCycleDays?: number;
  flowerCycleDays?: number;
}

export interface UpgradeTrack {
  name: string;
  icon: string;
  tiers: UpgradeTier[];
}
