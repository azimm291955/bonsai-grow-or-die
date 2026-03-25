// All game constants extracted from BonsaiGame.tsx

export const AMR_DATA: Record<number, number[]> = {
  2014: [1876, 1876, 1876, 1876],
  2015: [2007, 2007, 2007, 2007],
  2016: [1880, 1880, 1880, 1880],
  2017: [1471, 1400, 1350, 1298],
  2018: [1265, 1100, 900, 759],
  2019: [781, 850, 950, 999],
  2020: [1000, 600, 1316, 1316],
  2021: [1308, 1500, 1650, 1721],
  2022: [948, 850, 750, 658],
  2023: [750, 720, 700, 680],
  2024: [670, 660, 655, 650],
  2025: [649, 649, 649, 649],
  2026: [648, 648, 648, 648],
};

export const COVID_DEMAND_MOD: Record<number, number[]> = { 2020: [1, 0.4, 1.4, 1] };

export const WAGE_TABLE: Record<number, number> = {
  2014: 28000, 2015: 29500, 2016: 31600, 2017: 33100,
  2018: 34700, 2019: 36500, 2020: 43700, 2021: 50200,
  2022: 53900, 2023: 56000, 2024: 62200, 2025: 62200, 2026: 62200,
};

export const ROOM_COSTS = [0, 250000, 350000, 450000, 600000, 750000, 900000, 1000000, 1100000];

export interface UpgradeTierDef {
  cost: number;
  name: string;
  copy: string;
  electricityMod?: number;
  yieldMod?: number;
  laborMod?: number;
  nutrientMod?: number;
  co2Mod?: number;
  priceMod?: number;
  monthlyRevenue?: number;
  operatingCostPct?: number;
  prerollPricePerLb?: number;
  yearGate?: number;
  autoFlip?: boolean;
  rotSpeedMult?: number;
  vegCycleDays?: number;
  flowerCycleDays?: number;
}

export interface UpgradeTrackDef {
  name: string;
  icon: string;
  tiers: UpgradeTierDef[];
}

export const UPGRADE_TRACKS: Record<string, UpgradeTrackDef> = {
  lighting: {
    name: "Lighting", icon: "💡",
    tiers: [
      { cost: 120000, electricityMod: -0.15, yieldMod: 0.08, name: "HPS Upgrade", copy: "Better bulbs. Better buds." },
      { cost: 280000, electricityMod: -0.28, yieldMod: 0.18, flowerCycleDays: 1, name: "LED Hybrid", copy: "Half the heat. Twice the output." },
      { cost: 520000, electricityMod: -0.40, yieldMod: 0.30, flowerCycleDays: 2, name: "Fluence/Fohse Full LED", copy: "The same lights Bonsai runs." },
    ],
  },
  irrigationEnvironmental: {
    name: "Irrigation/Environmental", icon: "💧🌡️",
    tiers: [
      { cost: 42000, laborMod: -0.08, nutrientMod: -0.08, co2Mod: -0.10, name: "Basic Climate & Watering", copy: "Consistent feed. Optimized environment." },
      { cost: 76000, laborMod: -0.16, nutrientMod: -0.12, co2Mod: -0.15, name: "Automated + Monitoring", copy: "Your team does less. Plants get more." },
      { cost: 113000, laborMod: -0.25, nutrientMod: -0.15, co2Mod: -0.20, name: "Full Integration", copy: "Complete climate and irrigation control." },
    ],
  },
  genetics: {
    name: "Genetics", icon: "🧬",
    tiers: [
      { cost: 100000, yieldMod: 0.10, priceMod: 0.05, name: "Proven Strains", copy: "Good genetics. Good start." },
      { cost: 250000, yieldMod: 0.22, priceMod: 0.10, name: "Premium Genetics", copy: "The market's changing. Your genetics should too." },
      { cost: 500000, yieldMod: 0.35, priceMod: 0.12, name: "Signature Strains", copy: "These are the strains people ask for by name." },
    ],
  },
  preroll: {
    name: "Pre-Roll Line", icon: "🚬",
    tiers: [
      { cost: 75000, monthlyRevenue: 8000, operatingCostPct: 0.15, prerollPricePerLb: 103, name: "Knock-Box", copy: "Don't waste the trim.", yearGate: 2016 },
      { cost: 180000, monthlyRevenue: 22000, operatingCostPct: 0.15, prerollPricePerLb: 283, name: "ApeHex Rolling Machine", copy: "Volume is the game now.", yearGate: 2019 },
      { cost: 380000, monthlyRevenue: 45000, operatingCostPct: 0.15, prerollPricePerLb: 580, name: "Better Process - Joint Tubing Automation", copy: "AMR can't touch pre-roll revenue.", yearGate: 2022 },
    ],
  },
  operations: {
    name: "Operations", icon: "👤",
    tiers: [
      { cost: 50000, autoFlip: true, rotSpeedMult: 0.50, name: "Head Grower", copy: "Let the pros handle it.", vegCycleDays: 0, flowerCycleDays: 0 },
      { cost: 140000, autoFlip: true, rotSpeedMult: 0.25, name: "Specialist", copy: "Tighter ops. Faster turns.", vegCycleDays: 1, flowerCycleDays: 2 },
      { cost: 250000, autoFlip: true, rotSpeedMult: 0.10, name: "Master Grower", copy: "Your facility runs itself.", vegCycleDays: 2, flowerCycleDays: 3 },
    ],
  },
};

// Rot clock constants
export const ROT_GRACE_DAYS = 4;       // Days before rot starts after completion
export const ROT_TOTAL_DAYS = 24;      // Days from rot start to 0% quality
export const ROT_FAST_PHASE_DAYS = 8;  // First phase: lose 30% quality in this many days
export const ROT_FAST_PHASE_LOSS = 0.30; // Quality lost in fast phase

export const BASE_OVERHEAD = {
  rent: 18000,
  electricity: 22000,
  nutrients_co2_packaging: 10000,
  license_fees: 4500,
};

export const BASE_YIELD_PER_HARVEST = 420; // lbs per flower room per harvest
export const EXCISE_TAX_RATE = 0.15;
export const BROKER_FEE_RATE = 0.08;
export const VEG_DAYS = 32;
export const FLOWER_DAYS = 64;
export const GAME_DAYS_PER_MONTH = 30;
// 2 hrs = 30 game days → 240000ms/day = 4 min/day
export const MS_PER_GAME_DAY = (2 * 60 * 60 * 1000) / GAME_DAYS_PER_MONTH;
export const STARTING_CASH = 750000;
export const GAME_START_DATE = { year: 2016, month: 2, day: 26 };
export const WIN_DATE = { year: 2026, month: 4, day: 20 };

// ============================================================
// ACHIEVEMENTS — categories and definitions
// ============================================================

export const ACHIEVEMENT_CATEGORIES = [
  { id: "cultivation", name: "Cultivation", icon: "🌱" },
  { id: "financial", name: "Financial", icon: "💰" },
  { id: "facility", name: "Facility", icon: "🏗️" },
  { id: "upgrades", name: "Upgrades", icon: "⚡" },
  { id: "survival", name: "Survival & Eras", icon: "📅" },
  { id: "challenge", name: "Challenge", icon: "🎲" },
];

export interface AchievementDef {
  id: string;
  cat: string;
  badge: string;
  name: string;
  desc: string;
  maxProgress: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- CULTIVATION ---
  { id: "first_harvest", cat: "cultivation", badge: "🌿", name: "First Harvest — Feb 26, 2016", desc: "The real date of Bonsai's first harvest! The day the legend took root. 420 lbs of premium flower, harvested straight from the concrete jungle of a Denver warehouse. Room 2 didn't just produce a harvest; it made history. Now, it's your turn to grow the empire.", maxProgress: 1 },
  { id: "harvest_10", cat: "cultivation", badge: "🌿🌿", name: "Seasoned Grower", desc: "Complete 10 harvests. Ten harvests deep! Zero compromises. You've mastered the art of the cycle, dialing in the lights, the feed, and the timing until it's second nature. Crushing the double-digit mark proves you have the grit to dominate the Denver grind. You aren't just growing plants anymore—you're fueling an unstoppable momentum.", maxProgress: 10 },
  { id: "harvest_30", cat: "cultivation", badge: "🏆", name: "Harvest Machine", desc: "42 harvests deep. The answer to everything. You've peered into the heart of the cycle and found the ultimate truth: quality is king. Don't panic; you've officially mastered the galaxy.", maxProgress: 42 },
  { id: "assembly_line", cat: "cultivation", badge: "🏭", name: "Assembly Line", desc: "Harvest 5+ different rooms. Beyond the walls of Room 2. You've scaled the legend across five different rooms, proving that your genius isn't confined to a single space. Managing this much canopy requires more than just luck; it takes the vision of a mogul. The warehouse is breathing as one, and your empire is finally finding its true scale.", maxProgress: 5 },
  { id: "crop_death", cat: "cultivation", badge: "💀", name: "Crop Death", desc: "Let a crop rot to 0%. Watched it all turn to dust. The smell. The loss. Sometimes the best education comes from failure. You won't make this mistake twice.", maxProgress: 1 },

  // --- FINANCIAL ---
  { id: "rev_1m", cat: "financial", badge: "💵", name: "First Million", desc: "Reach $1M total revenue. A million reasons why they should've never doubted you!", maxProgress: 1000000 },
  { id: "rev_5m", cat: "financial", badge: "💰", name: "Ten-Bagger", desc: "Reach $10M total revenue. The Eight-Figure Force. You've reached $10M in revenue! You've transformed that original Denver warehouse into a financial powerhouse. From the first 420 lbs to an eight-figure powerhouse, your momentum is crushing the competition!", maxProgress: 10000000 },
  { id: "rev_25m", cat: "financial", badge: "💎", name: "The Centennial Sovereign", desc: "Reach $100M total revenue. The hundred-million-dollar mark has fallen. You've built a financial fortress that stands as the ultimate testament to your cultivation mastery. Every light, every room, and every harvest has led to this moment of absolute market supremacy. Your name is now synonymous with the Bonsai standard.", maxProgress: 100000000 },
  { id: "cash_hoarder", cat: "financial", badge: "🏦", name: "Cash Hoarder", desc: "Have $5M+ cash on hand at once. Five million in cold, hard cash. You've stacked the bags so high they're starting to crowd the canopy.", maxProgress: 5000000 },
  { id: "red_month", cat: "financial", badge: "📉", name: "Red Month", desc: "Survive a month with negative cash flow. Thirty days of deficit. One unbreakable spirit. You've navigated the hardest month in the warehouse's history without losing your nerve.", maxProgress: 1 },

  // --- FACILITY ---
  { id: "rooms_4", cat: "facility", badge: "🏠", name: "Expansion", desc: "Unlock 4 rooms", maxProgress: 4 },
  { id: "rooms_9", cat: "facility", badge: "🏭", name: "Full Facility", desc: "Unlock all 9 rooms", maxProgress: 9 },
  { id: "all_active", cat: "facility", badge: "🔥", name: "All Systems Go", desc: "All 9 rooms unlocked and none empty", maxProgress: 1 },

  // --- UPGRADES ---
  { id: "track_master", cat: "upgrades", badge: "⚡", name: "Track Master", desc: "Max out any single track on any room", maxProgress: 1 },
  { id: "fully_loaded", cat: "upgrades", badge: "🏅", name: "Fully Loaded Room", desc: "Max all 6 tracks on a single room", maxProgress: 1 },
  { id: "completionist", cat: "upgrades", badge: "🏆", name: "Upgrade Completionist", desc: "Max all tracks on all unlocked rooms", maxProgress: 1 },

  // --- SURVIVAL & ERAS ---
  { id: "crash_2018", cat: "survival", badge: "📉", name: "Crash Landing", desc: "Survive the 2018 AMR crash", maxProgress: 1 },
  { id: "covid_2020", cat: "survival", badge: "🦠", name: "COVID Operator", desc: "Survive through 2020", maxProgress: 1 },
  { id: "cliff_2022", cat: "survival", badge: "🪂", name: "Cliff Jumper", desc: "Survive the 2022 AMR cliff", maxProgress: 1 },
  { id: "win_game", cat: "survival", badge: "🎯", name: "4/20/2026", desc: "Win the game", maxProgress: 1 },

  // --- CHALLENGE ---
  { id: "pure_grower", cat: "challenge", badge: "✊", name: "Pure Grower", desc: "Win without taking VC money", maxProgress: 1 },
  { id: "minimalist", cat: "challenge", badge: "💪", name: "Minimalist", desc: "Win with exactly 4 rooms", maxProgress: 1 },
  { id: "phoenix", cat: "challenge", badge: "💀", name: "Phoenix", desc: "Let a crop rot to 0%, then still win", maxProgress: 1 },
  { id: "patient_grower", cat: "challenge", badge: "🐢", name: "Patient Grower", desc: "Play for 7+ real-time days", maxProgress: 1 },
];

// --- EVENT CARDS ---
export interface EventCard {
  title: string;
  color: string;
  text: string;
  effect: string;
}

export const EVENT_CARDS: Record<string, EventCard> = {
  welcome: {
    title: "🌱 Welcome to Bonsai Cultivation",
    color: "#8BC34A",
    text: "December 2015. You've leased a 42,000 sq ft industrial space in Denver's emerging cannabis corridor. CO just went recreational. The AMR is $2,007/lb. You've got $1M from angel investors and a dream.\n\nYour job: survive. Grow or Die. Make it through to 4/20/2026.",
    effect: "Room 1 (Veg) is unlocked. Room 2 costs $250K. You need at least 1 veg room and 1 flower room to harvest.",
  },
  amr_2017_drop: {
    title: "📉 2017: The Market Starts Sliding",
    color: "#FFB74D",
    text: "It was inevitable. Early rec markets always crash. Too many licenses, too much flower, not enough buyers. The AMR has dropped from $2,007 to $1,471 — and it's still falling.\n\nOperators who survived built scale and efficiency. Those who didn't are already gone.",
    effect: "AMR collapses from $2,007 to $1,471. Cost management becomes critical. Upgrades are your best hedge.",
  },
  amr_2018_crash: {
    title: "📉 2018: The Crash",
    color: "#ef5350",
    text: "The Colorado market has officially crashed. AMR is at $1,265 — down 37% from peak — and Q4 will hit $759. Industry insiders call it 'the correction.' Everyone else calls it a bloodbath.\n\nFacilities without scale or operational efficiency are being sold at pennies on the dollar.",
    effect: "AMR collapses. Cost management becomes critical. Upgrades are your best hedge.",
  },
  amr_2019_recovery: {
    title: "📈 2019: The Recovery Begins",
    color: "#8BC34A",
    text: "The weak hands are gone. Market consolidation is driving a recovery. AMR is climbing back — Q3 hits $950, Q4 tops $999. The industry is maturing.\n\nBut don't get comfortable. This is a brief window before new pressures arrive.",
    effect: "AMR recovering. New market dynamics emerging.",
  },
  covid_2020: {
    title: "🦠 2020: COVID-19 Hits",
    color: "#CE93D8",
    text: "March 2020. Cannabis is deemed 'essential.' But Q2 demand craters 60% as dispensaries cut orders amid lockdown uncertainty. Then the stimulus checks hit and demand rockets back.\n\nCO2 is at $1,316 by Q3. This is the most volatile quarter in the industry's history.",
    effect: "Q2 demand collapses 60%. Q3-Q4 surge follows. Manage cash through the dip.",
  },
  bull_2021: {
    title: "🚀 2021: The Bull Run",
    color: "#8BC34A",
    text: "Post-COVID. Federal legalization momentum builds. Institutional money floods the market. AMR hits $1,721 in Q4 — the highest since 2016.\n\nThis is your window. Scale hard. The market won't stay here.",
    effect: "AMR peaks at $1,721. Best harvest window in years.",
  },
  amr_2022_cliff: {
    title: "🪂 2022: The Cliff",
    color: "#ef5350",
    text: "The federal bill failed. California dumped product. The AMR fell off a cliff — from $1,721 to $948 in eight months. Q4 is $658.\n\nThis is the new normal. Operations, pre-roll revenue, and upgrades are your margin now.",
    effect: "AMR collapses. Pre-roll T3 is critical. Final VC risk zone.",
  },
  approaching_4_20: {
    title: "🎯 The Endgame",
    color: "#8BC34A",
    text: "4/20/2026 is coming. Three months left. The market is stable at $648/lb but this is a volume and efficiency game now.\n\nFocus: maximize your rooms. Harvest everything. Pre-roll revenue adds up.\n\nMake the last push count.",
    effect: "Final stretch. Every harvest counts. Win at $5M+ cash.",
  },
};

// Client-side score signing salt
export const SIGN_SALT = "bonsai_grow_or_die_2026_" + "zen_happy_plants" + "_420_leaderboard";
