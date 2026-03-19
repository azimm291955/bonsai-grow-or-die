"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

// ── Steps ──
type Step =
  | "buy_room2"       // spotlight Room 2 (locked), hint to tap & buy
  | "flip_veg"        // spotlight Room 1 (ready_to_flip), hint to tap & flip
  | "time_warp"       // full-screen narrative card (64 days pass)
  | "pnl_tab"         // spotlight P&L tab
  | "upgrades_tab"    // spotlight Upgrades tab + START THE CLOCK
  | "waiting"         // invisible — waiting for first harvest achievement to close
  | "speed_hint";     // highlight speed controls

const STEPS: Step[] = [
  "buy_room2",
  "flip_veg",
  "time_warp",
  "pnl_tab",
  "upgrades_tab",
  "waiting",
  "speed_hint",
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
  const advanceTutorial  = useGameStore((s) => s.advanceTutorial);
  const setActiveTab     = useGameStore((s) => s.setActiveTab);
  const showAchievement  = useGameStore((s) => s.ui.showAchievement);
  const showRoomBuy      = useGameStore((s) => s.ui.showRoomBuy);
  const selectedRoom     = useGameStore((s) => s.ui.selectedRoom);

  // Hide spotlight overlay when a modal is open so player can interact with it
  const modalOpen = showRoomBuy !== null || selectedRoom !== null;

  const [stepIdx, setStepIdx]   = useState(0);
  const [rect, setRect]         = useState<Rect | null>(null);
  const [visible, setVisible]   = useState(false);
  const [done, setDone]         = useState(false);
  const rafRef = useRef<number | null>(null);

  // Track when first_harvest achievement toast closes (for speed hint)
  const prevAchRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevAchRef.current === "first_harvest" && showAchievement !== "first_harvest") {
      // Achievement toast just closed — show speed hint
      const step = STEPS[stepIdx];
      if (step === "waiting") {
        setStepIdx(STEPS.indexOf("speed_hint"));
      }
    }
    prevAchRef.current = showAchievement ?? null;
  }, [showAchievement, stepIdx]);

  const step = STEPS[stepIdx];
  const isSpotlight = step === "buy_room2" || step === "flip_veg" || step === "pnl_tab" || step === "upgrades_tab" || step === "speed_hint";

  const getSelector = (s: Step): string => {
    switch (s) {
      case "buy_room2": return "room-2";
      case "flip_veg": return "room-1";
      case "pnl_tab": return "tab-pnl";
      case "upgrades_tab": return "tab-upgrades";
      case "speed_hint": return "speed-controls";
      default: return "";
    }
  };

  // Continuously track spotlight target
  useEffect(() => {
    if (!isSpotlight || modalOpen) { setRect(null); return; }
    const sel = getSelector(step);
    if (!sel) return;
    const tick = () => {
      const r = getRect(sel);
      setRect(r);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step, isSpotlight, modalOpen]);

  // Fade in on step change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [stepIdx]);

  // Auto-advance: after player buys room 2, move to flip step
  useEffect(() => {
    if (!state) return;
    if (step === "buy_room2" && state.rooms[1]?.unlocked) {
      setStepIdx(STEPS.indexOf("flip_veg"));
    }
  }, [state, step]);

  // Auto-advance: after player flips (room 1 status changes from ready_to_flip)
  useEffect(() => {
    if (!state) return;
    if (step === "flip_veg" && state.rooms[0]?.status !== "ready_to_flip") {
      setStepIdx(STEPS.indexOf("time_warp"));
    }
  }, [state, step]);

  if (!state || done) return null;

  // "waiting" step: invisible, just waiting for achievement toast to close
  if (step === "waiting") return null;

  const PAD = 8;

  // ── Handlers ──
  const handlePnL = () => {
    setActiveTab("pnl");
    setStepIdx(STEPS.indexOf("upgrades_tab"));
  };

  const handleStartClock = () => {
    setActiveTab("facility");
    advanceTutorial(5);
    // Move to "waiting" step — invisible, waiting for first harvest achievement
    setStepIdx(STEPS.indexOf("waiting"));
  };

  const handleDismissSpeedHint = () => {
    setDone(true); // unmount tutorial permanently
  };

  // ── Tooltip position ──
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

  return (
    <>
      <style>{`
        @keyframes tut-fade  { from { opacity:0 } to { opacity:1 } }
        @keyframes tut-up    { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes tut-pulse-green  { 0%,100%{box-shadow:0 0 0 3px rgba(139,195,74,0.25)}  50%{box-shadow:0 0 0 6px rgba(139,195,74,0.5),  0 0 30px rgba(139,195,74,0.3)} }
        @keyframes tut-pulse-purple { 0%,100%{box-shadow:0 0 0 3px rgba(206,147,216,0.25)} 50%{box-shadow:0 0 0 6px rgba(206,147,216,0.5), 0 0 30px rgba(206,147,216,0.3)} }
        @keyframes tut-pulse-amber  { 0%,100%{box-shadow:0 0 0 3px rgba(255,183,77,0.25)}  50%{box-shadow:0 0 0 6px rgba(255,183,77,0.5),  0 0 30px rgba(255,183,77,0.3)} }
        @keyframes tut-blink { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      {/* ── SPOTLIGHT STEPS ── */}
      {isSpotlight && rect && !modalOpen && (
        <>
          {/* Dark mask with hole */}
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

          {/* Pulsing ring */}
          <div style={{
            position: "fixed",
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            borderRadius: 16, zIndex: 301, pointerEvents: "none",
            animation: step === "buy_room2"
              ? "tut-pulse-purple 1.8s ease-in-out infinite"
              : step === "flip_veg"
              ? "tut-pulse-amber 1.8s ease-in-out infinite"
              : "tut-pulse-green 1.8s ease-in-out infinite",
          }} />

          {/* Tooltip */}
          <div style={tooltipStyle(rect)}>
            {step === "buy_room2" && (
              <TutTooltip color="#CE93D8" line="You need a flower room." sub="Tap Room 2 to unlock it. Your veg plants are waiting.">
                <div style={{ marginTop: 10, textAlign: "center", fontSize: 10, color: "#CE93D8", letterSpacing: 2, fontWeight: 600, animation: "tut-blink 2s ease-in-out infinite" }}>
                  ↑ TAP ROOM 2 ↑
                </div>
              </TutTooltip>
            )}
            {step === "flip_veg" && (
              <TutTooltip color="#FFB74D" line="Veg is done. Time to flip." sub="Tap Room 1 to move the plants into your new flower room.">
                <div style={{ marginTop: 10, textAlign: "center", fontSize: 10, color: "#FFB74D", letterSpacing: 2, fontWeight: 600, animation: "tut-blink 2s ease-in-out infinite" }}>
                  ↑ TAP ROOM 1 ↑
                </div>
              </TutTooltip>
            )}
            {step === "pnl_tab" && (
              <TutTooltip color="#FFB74D" line="Every dollar in. Every dollar out." sub="The P&L is your financial lifeline. It tracks your revenue and your burn rate in real time. See exactly how much you are clearing right now.">
                <button onClick={handlePnL} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: "rgba(255,183,77,0.12)", border: "1px solid rgba(255,183,77,0.4)", borderRadius: 8, color: "#FFB74D", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1.5 }}>
                  OPEN P&L
                </button>
              </TutTooltip>
            )}
            {step === "upgrades_tab" && (
              <TutTooltip color="#8BC34A" line="The market will crash. Your costs won't." sub="Upgrades increase yield and cut overhead. This is how you survive the compression.">
                <button onClick={handleStartClock} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: "rgba(139,195,74,0.12)", border: "1px solid rgba(139,195,74,0.4)", borderRadius: 8, color: "#8BC34A", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1.5 }}>
                  START THE CLOCK →
                </button>
                <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#555", lineHeight: 1.5 }}>
                  Feb 29, 2016. The next 10 years begin now.
                </div>
              </TutTooltip>
            )}
            {step === "speed_hint" && (
              <TutTooltip color="#8BC34A" line="Control the clock." sub="Speed up time to 32× or 64× to fast-forward through grow cycles. Pause anytime to plan your next move.">
                <button onClick={handleDismissSpeedHint} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: "rgba(139,195,74,0.12)", border: "1px solid rgba(139,195,74,0.4)", borderRadius: 8, color: "#8BC34A", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1.5 }}>
                  GOT IT
                </button>
              </TutTooltip>
            )}
          </div>
        </>
      )}

      {/* ── TIME WARP CARD ── */}
      {step === "time_warp" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 400, animation: "tut-fade 0.35s ease-out" }}>
          <div style={{ background: "#111", border: "1px solid rgba(206,147,216,0.35)", borderRadius: 20, maxWidth: 380, width: "100%", padding: "36px 28px", boxShadow: "0 0 80px rgba(206,147,216,0.1)", animation: "tut-up 0.4s ease-out" }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#CE93D8", fontWeight: 700, marginBottom: 16 }}>64 DAYS LATER</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 20 }}>Feb 29, 2016.</div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 12 }}>
              Your flower room is <span style={{ color: "#8BC34A", fontWeight: 700 }}>ready to harvest</span>. The next batch in Room 1 is <span style={{ color: "#FFB74D", fontWeight: 700 }}>ready to flip</span>.
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 12 }}>
              But growth carries a heavy price tag: <span style={{ color: "#ef5350", fontWeight: 600 }}>$84,000 every single month</span> for rent, power, and labor.
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.85, marginBottom: 8 }}>
              That overhead is a relentless heartbeat. The clock keeps ticking regardless of whether you are harvesting profit or just keeping the lights on.
            </div>

            <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
              <div style={{ flex: 1, background: "#1a2a1a", border: "1px solid #4a7a4a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#666", letterSpacing: 2, marginBottom: 4 }}>ROOM 1</div>
                <div style={{ fontSize: 10, color: "#FFB74D", fontWeight: 600 }}>⚡ Ready to flip</div>
              </div>
              <div style={{ flex: 1, background: "#2a1a2a", border: "1px solid #7a4a7a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#666", letterSpacing: 2, marginBottom: 4 }}>ROOM 2</div>
                <div style={{ fontSize: 10, color: "#8BC34A", fontWeight: 600 }}>🌿 Ready to harvest</div>
              </div>
            </div>

            <button
              onClick={() => setStepIdx(STEPS.indexOf("pnl_tab"))}
              style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg, #6a3d8f, #9c4dcc)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1.5, boxShadow: "0 4px 24px rgba(206,147,216,0.25)" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Reusable tooltip shell ──
function TutTooltip({ color, line, sub, children }: {
  color: string; line: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#141414",
      border: `1px solid ${color}40`,
      borderRadius: 14,
      padding: "16px 18px",
      boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 6 }}>{line}</div>
      <div style={{ fontSize: 11, color: "#777", lineHeight: 1.6 }}>{sub}</div>
      {children}
    </div>
  );
}
