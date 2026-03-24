"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ACHIEVEMENTS } from "@/lib/constants";

// ── Warp constants ──
// Clock frozen during tutorial (tutorialStep 1-4). No real overhead runs.
// Simulated: Room 2 ($250K) + Dec overhead 2 rooms ($168K) + Jan overhead 2 rooms ($172.2K)
const WARP_CASH       = 409800;
const WARP_COSTS      = 250000 + 168000 + 172200;
const WARP_BONUS_DAYS = 60;  // pushes date to Feb 29 2016
const WARP_LAST_MONTH = 14;  // Feb 2016 = month 14 → first real tick charges Mar only

// ── Steps ──
type Step =
  | "buy_room2"      // 0 spotlight Room 2
  | "flip_veg"       // 1 spotlight Room 1
  | "time_warp"      // 2 full card
  | "harvest"        // 3 spotlight Room 2
  | "pnl_tab"        // 4 spotlight P&L tab
  | "upgrades_tab"   // 5 spotlight Upgrades tab
  | "achievement";   // 6 achievement card

const STEPS: Step[] = [
  "buy_room2",
  "flip_veg",
  "time_warp",
  "harvest",
  "pnl_tab",
  "upgrades_tab",
  "achievement",
];

// ── Spotlight rect ──
interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function Tutorial() {
  const state            = useGameStore((s) => s.state);
  const tutorialBuyRoom2 = useGameStore((s) => s.tutorialBuyRoom2);
  const tutorialFlip     = useGameStore((s) => s.tutorialFlip);
  const advanceTutorial  = useGameStore((s) => s.advanceTutorial);
  const harvest          = useGameStore((s) => s.harvest);
  const setActiveTab     = useGameStore((s) => s.setActiveTab);

  const [stepIdx, setStepIdx]               = useState(0);
  const [rect, setRect]                     = useState<Rect | null>(null);
  const [harvestPending, setHarvestPending] = useState(false);
  const [visible, setVisible]               = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = STEPS[stepIdx];
  const isSpotlight = step === "buy_room2" || step === "flip_veg" || step === "harvest" || step === "pnl_tab" || step === "upgrades_tab";

  // Continuously track the spotlight target so it stays synced on scroll/resize
  useEffect(() => {
    if (!isSpotlight) { setRect(null); return; }
    const selectors: Record<Step, string> = {
      buy_room2:    "room-2",
      flip_veg:     "room-1",
      harvest:      "room-2",
      pnl_tab:      "tab-pnl",
      upgrades_tab: "tab-upgrades",
      time_warp:    "",
      achievement:  "",
    };
    const sel = selectors[step];
    const tick = () => {
      const r = getRect(sel);
      setRect(r);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step, isSpotlight]);

  // Fade in on step change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [stepIdx]);

  if (!state || state.tutorialStep >= 5) return null;

  const PAD = 8; // spotlight padding around target

  // ── Handlers ──
  const handleBuyRoom2 = () => {
    tutorialBuyRoom2();
    setStepIdx(1);
  };

  const handleFlip = () => {
    tutorialFlip();
    setStepIdx(2);
  };

  const handleWarp = () => {
    setStepIdx(3);
  };

  const handleHarvest = () => {
    setHarvestPending(true);
    useGameStore.setState((store) => {
      if (!store.state) return store;
      const ns = { ...store.state };
      ns.cash               = WARP_CASH;
      ns.bonusGameDays      = (ns.bonusGameDays || 0) + WARP_BONUS_DAYS;
      ns.totalCosts         = WARP_COSTS;
      ns.totalRevenue       = 0;
      ns.lastProcessedMonth = WARP_LAST_MONTH;
      const rooms = [...ns.rooms];
      // Room 2: ready to harvest
      rooms[1] = { ...rooms[1], status: "ready_to_harvest" as const, daysGrown: 64, rotDays: 0 };
      // Room 1: veg ready to flip (day 32, full cycle) — player starts with an action waiting
      rooms[0] = { ...rooms[0], status: "ready_to_flip" as const, daysGrown: 32, rotDays: 0, stalled: true, growStartMs: Date.now() };
      ns.rooms = rooms;
      return { state: ns };
    });
    setTimeout(() => {
      harvest(1);
      setHarvestPending(false);
      setStepIdx(4);
    }, 1200);
  };

  const handlePnL = () => {
    setActiveTab("pnl");
    setStepIdx(5);
  };

  const handleUpgrades = () => {
    setActiveTab("upgrades");
    setStepIdx(6);
  };

  const handleStartClock = () => {
    setActiveTab("facility");
    advanceTutorial(5);
  };

  // ── Tooltip position relative to spotlight rect ──
  function tooltipStyle(r: Rect): React.CSSProperties {
    const PAD_OUTER = 16;
    const winH = window.innerHeight;
    const spaceBelow = winH - (r.top + r.height + PAD);
    const onTop = spaceBelow < 160;
    return {
      position: "fixed",
      left: Math.max(PAD_OUTER, r.left - PAD),
      width: Math.min(r.width + PAD * 2, 380),
      ...(onTop
        ? { bottom: winH - r.top + PAD + 8 }
        : { top: r.top + r.height + PAD + 12 }),
      zIndex: 400,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: "opacity 0.25s, transform 0.25s",
    };
  }

  // ── Render ──
  return (
    <>
      <style>{`
        @keyframes tut-fade  { from { opacity:0 } to { opacity:1 } }
        @keyframes tut-up    { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes tut-pop   { from { transform:scale(0.9);opacity:0 } to { transform:scale(1);opacity:1 } }
        @keyframes tut-pulse-green  { 0%,100%{box-shadow:0 0 0 3px rgba(139,195,74,0.25)}  50%{box-shadow:0 0 0 6px rgba(139,195,74,0.5),  0 0 30px rgba(139,195,74,0.3)} }
        @keyframes tut-pulse-purple { 0%,100%{box-shadow:0 0 0 3px rgba(206,147,216,0.25)} 50%{box-shadow:0 0 0 6px rgba(206,147,216,0.5), 0 0 30px rgba(206,147,216,0.3)} }
        @keyframes tut-pulse-amber  { 0%,100%{box-shadow:0 0 0 3px rgba(255,183,77,0.25)}  50%{box-shadow:0 0 0 6px rgba(255,183,77,0.5),  0 0 30px rgba(255,183,77,0.3)} }
      `}</style>

      {/* ── SPOTLIGHT STEPS ── */}
      {isSpotlight && rect && (
        <>
          {/* Dark mask with hole cut out */}
          <svg
            style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 300, pointerEvents: "none", opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
          >
            <defs>
              <mask id="tut-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left - PAD} y={rect.top - PAD}
                  width={rect.width + PAD * 2} height={rect.height + PAD * 2}
                  rx="16" fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tut-mask)" />
          </svg>

          {/* Animated ring around target */}
          <div style={{
            position: "fixed",
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            borderRadius: 16, zIndex: 301, pointerEvents: "none",
            animation: step === "buy_room2" || step === "harvest"
              ? "tut-pulse-purple 1.8s ease-in-out infinite"
              : step === "flip_veg"
              ? "tut-pulse-amber 1.8s ease-in-out infinite"
              : "tut-pulse-green 1.8s ease-in-out infinite",
          }} />

          {/* Tooltip */}
          <div style={tooltipStyle(rect)}>
            <Tooltip
              step={step}
              onBuyRoom2={handleBuyRoom2}
              onFlip={handleFlip}
              onHarvest={handleHarvest}
              onPnL={handlePnL}
              onUpgrades={handleUpgrades}
            />
          </div>
        </>
      )}

      {/* ── TIME WARP CARD ── */}
      {step === "time_warp" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 400, animation: "tut-fade 0.35s ease-out" }}>
          <div style={{ background: "#111", border: "1px solid rgba(206,147,216,0.35)", borderRadius: 20, maxWidth: 380, width: "100%", padding: "36px 28px", boxShadow: "0 0 80px rgba(206,147,216,0.1)", animation: "tut-up 0.4s ease-out" }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#CE93D8", fontWeight: 700, marginBottom: 16 }}>TIME WARP</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 20 }}>Feb 29, 2016.</div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 8 }}>
              64 days of flower. Room 2 is dense with bud.
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 8 }}>
              Two months of overhead came out while you waited —
              <span style={{ color: "#fff" }}> $168K in December</span>,
              <span style={{ color: "#fff" }}> $172K in January</span>.
              Room 2 cost <span style={{ color: "#fff" }}>$250K</span>.
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 28 }}>
              You&apos;re at <span style={{ color: "#FFB74D", fontWeight: 700 }}>$409,800</span>. Room 2 is ready. Pull the harvest and get your money back.
            </div>
            <button
              onClick={handleWarp}
              style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg, #6a3d8f, #9c4dcc)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1.5, boxShadow: "0 4px 24px rgba(206,147,216,0.25)" }}
            >
              PULL THE HARVEST →
            </button>
          </div>
        </div>
      )}

      {/* ── HARVEST PENDING TOAST ── */}
      {harvestPending && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 500, maxWidth: 340, width: "90%", animation: "tut-up 0.3s ease-out" }}>
          <div style={{ padding: "13px 18px", background: "rgba(139,195,74,0.12)", border: "1px solid rgba(139,195,74,0.3)", borderRadius: 12, backdropFilter: "blur(8px)", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#8BC34A", fontWeight: 600 }}>💰 420 lbs @ $2,007/lb — $649K net</div>
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENT CARD ── */}
      {step === "achievement" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 400, animation: "tut-fade 0.3s ease-out" }}>
          <div style={{ background: "linear-gradient(160deg, #152015 0%, #111 100%)", border: "1px solid rgba(139,195,74,0.3)", borderRadius: 20, maxWidth: 360, width: "100%", padding: "36px 28px", textAlign: "center", boxShadow: "0 0 80px rgba(139,195,74,0.1)", animation: "tut-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#8BC34A", fontWeight: 700, marginBottom: 14 }}>ACHIEVEMENT UNLOCKED</div>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🌿</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 18 }}>First Harvest</div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, textAlign: "left", marginBottom: 6 }}>
              <p style={{ margin: "0 0 10px", color: "#ddd", fontWeight: 600 }}>Feb 29, 2016. 420 lbs. Room 2. A converted warehouse in Denver.</p>
              <p style={{ margin: "0 0 10px" }}>This was the real date Bonsai Cultivation pulled their first-ever harvest. The AMR is $2,007/lb. Colorado is in a gold rush.</p>
              <p style={{ margin: "0 0 10px" }}>Room 1 is ready to flip. Room 2 is empty. The clock hasn&apos;t started yet.</p>
              <p style={{ margin: 0, color: "#FFB74D" }}>Prices will crash. Overhead will climb. The next 10 years will test everything.</p>
            </div>
            <div style={{ fontSize: 10, color: "#333", margin: "16px 0" }}>1 / {ACHIEVEMENTS.length} achievements</div>
            <button
              onClick={handleStartClock}
              style={{ width: "100%", padding: "16px 0", background: "linear-gradient(135deg, #7CB342, #8BC34A, #9CCC65)", border: "none", borderRadius: 10, color: "#111", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 2, boxShadow: "0 4px 28px rgba(139,195,74,0.3)" }}
            >
              START THE CLOCK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Tooltip component — anchored below/above spotlight ──
function Tooltip({ step, onBuyRoom2, onFlip, onHarvest, onPnL, onUpgrades }: {
  step: Step;
  onBuyRoom2: () => void;
  onFlip: () => void;
  onHarvest: () => void;
  onPnL: () => void;
  onUpgrades: () => void;
}) {
  const configs: Record<Step, { color: string; line: string; sub: string; cta: string; onClick: () => void } | null> = {
    buy_room2: {
      color: "#CE93D8",
      line: "December 2015. One room, $84K/mo in overhead, zero revenue.",
      sub: "Buy Room 2 to unlock your first flower room. No flower room — no harvest.",
      cta: "UNLOCK ROOM 2 — $250K",
      onClick: onBuyRoom2,
    },
    flip_veg: {
      color: "#FFB74D",
      line: "Veg is done. The rot clock started the moment it finished.",
      sub: "Flip it into Room 2. Every day you wait costs quality — and quality is money.",
      cta: "FLIP TO FLOWER",
      onClick: onFlip,
    },
    harvest: {
      color: "#8BC34A",
      line: "420 lbs. $2,007/lb. After taxes and broker fees — $649K.",
      sub: "You came in with $409K. This harvest puts you back above a million. Pull it.",
      cta: "HARVEST ROOM 2",
      onClick: onHarvest,
    },
    pnl_tab: {
      color: "#FFB74D",
      line: "Every dollar in, every dollar out.",
      sub: "P&L is your lifeline. Revenue, overhead, burn rate — it's all here.",
      cta: "OPEN P&L",
      onClick: onPnL,
    },
    upgrades_tab: {
      color: "#8BC34A",
      line: "The market will crash. Your costs won't.",
      sub: "Upgrades increase yield and cut overhead. This is how you survive the compression.",
      cta: "OPEN UPGRADES",
      onClick: onUpgrades,
    },
    time_warp:   null,
    achievement: null,
  };

  const cfg = configs[step];
  if (!cfg) return null;

  return (
    <div style={{
      background: "#141414",
      border: `1px solid ${cfg.color}40`,
      borderRadius: 14,
      padding: "16px 18px",
      boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.color}20`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 6 }}>{cfg.line}</div>
      <div style={{ fontSize: 11, color: "#777", lineHeight: 1.6, marginBottom: 14 }}>{cfg.sub}</div>
      <button
        onClick={cfg.onClick}
        style={{
          width: "100%", padding: "12px 0",
          background: `${cfg.color}18`,
          border: `1px solid ${cfg.color}60`,
          borderRadius: 8, color: cfg.color,
          fontWeight: 700, fontSize: 12,
          cursor: "pointer", letterSpacing: 1.5,
        }}
      >
        {cfg.cta}
      </button>
    </div>
  );
}
