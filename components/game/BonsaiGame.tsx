"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useTickLoop } from "@/hooks/useTickLoop";
import { fetchLeaderboardAction } from "@/app/actions/leaderboard";
import { ACHIEVEMENTS } from "@/lib/constants";
import { getGameDateFromState, getQuarter, getAMR } from "@/lib/helpers";

// UI Components
import GameHeader from "./ui/GameHeader";

// Tabs
import FacilityTab from "./tabs/FacilityTab";
import UpgradesPanel from "./UpgradesPanel";
import PnLTab from "./PnLTab";
import AchievementsTab from "./AchievementsTab";
import LeaderboardTab from "./LeaderboardTab";

// Screens
import Onboarding from "./Onboarding";
import WinScreen from "./WinScreen";
import GameOverScreen from "./GameOverScreen";

// Modals
import VcOfferModal from "./modals/VcOfferModal";
import EventModal from "./modals/EventModal";
import RoomBuyModal from "./modals/RoomBuyModal";
import ResetConfirmModal from "./modals/ResetConfirmModal";
import AchievementToast from "./modals/AchievementToast";
import RoomDetailModal from "./modals/RoomDetailModal";
import Tutorial from "./Tutorial";
import SpeedHint from "./SpeedHint";
import IntroScreen from "./IntroScreen";

// ─── Keyframes ───
const GAME_STYLES = `
  @keyframes action-pulse { 0%,100%{opacity:0.8;box-shadow:0 0 8px rgba(255,183,77,0.2)} 50%{opacity:1;box-shadow:0 0 20px rgba(255,183,77,0.4)} }
  @keyframes glow-green { 0%,100%{box-shadow:inset 0 0 15px rgba(139,195,74,0.05)} 50%{box-shadow:inset 0 0 25px rgba(139,195,74,0.12)} }
  @keyframes glow-purple { 0%,100%{box-shadow:inset 0 0 15px rgba(206,147,216,0.05)} 50%{box-shadow:inset 0 0 25px rgba(206,147,216,0.12)} }
  @keyframes toast-in { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
  @keyframes shimmer-bar { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes lock-breathe { 0%,100%{border-color:rgba(255,255,255,0.04)} 50%{border-color:rgba(255,255,255,0.08)} }
  @keyframes fade-up { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
`;

// ─── AMR Info Modal ───
function AMRInfoModal() {
  const showAMRInfo = useGameStore((s) => s.ui.showAMRInfo);
  const setShowAMRInfo = useGameStore((s) => s.setShowAMRInfo);
  const state = useGameStore((s) => s.state);

  if (!showAMRInfo || !state) return null;

  const gd = getGameDateFromState(state.gameStartRealMs, state.bonusGameDays);
  const currentAMR = getAMR(gd.year, getQuarter(gd.month));

  return (
    <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center" onClick={() => setShowAMRInfo(false)}>
      <div className="bg-[#1a1a1a] border border-bonsai-green/20 rounded-2xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-base font-extrabold text-bonsai-green mb-2 tracking-widest">AVERAGE MARKET RATE (AMR)</div>
        <p className="text-xs text-[#888] leading-relaxed mb-4">
          The AMR is the wholesale price per pound your broker pays. It tracks real Colorado cannabis market data from 2015–2026.
          Prices peaked in 2017 (~$1,400/lb), crashed by 2019, and have continued to compress.
          Upgrades can raise your effective sell price above the AMR.
        </p>
        <div className="text-sm font-bold text-bonsai-green mb-3" style={{ fontFamily: "var(--font-mono)" }}>Current: ${currentAMR}/lb</div>
        <a href="https://tax.colorado.gov/average-market-rate" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#666] hover:text-bonsai-green transition-colors block mb-3" style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
          Source: Colorado Dept. of Revenue — Average Market Rate
        </a>
        <button onClick={() => setShowAMRInfo(false)} className="w-full py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#666] text-sm cursor-pointer">Got it</button>
      </div>
    </div>
  );
}

// ─── Runway Info Modal ───
function RunwayInfoModal() {
  const showRunwayInfo = useGameStore((s) => s.ui.showRunwayInfo);
  const setShowRunwayInfo = useGameStore((s) => s.setShowRunwayInfo);

  if (!showRunwayInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center" onClick={() => setShowRunwayInfo(false)}>
      <div className="bg-[#1a1a1a] border border-bonsai-amber/20 rounded-2xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-base font-extrabold text-bonsai-amber mb-2 tracking-widest">RUNWAY</div>
        <p className="text-xs text-[#888] leading-relaxed mb-4">
          The estimated number of months until the company runs out of cash, based on your current monthly burn rate.
          Runway does not account for future harvests — it assumes pure overhead spend. A longer runway gives you more room to
          time your harvests and upgrades without running dry.
        </p>
        <div className="text-xs text-[#666] leading-relaxed mb-4">
          <strong className="text-[#aaa]">Formula:</strong> Cash on Hand ÷ Monthly Burn = Months of Runway
        </div>
        <button onClick={() => setShowRunwayInfo(false)} className="w-full py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#666] text-sm cursor-pointer">Got it</button>
      </div>
    </div>
  );
}

// ─── Burn Info Modal ───
function BurnInfoModal() {
  const showBurnInfo = useGameStore((s) => s.ui.showBurnInfo);
  const setShowBurnInfo = useGameStore((s) => s.setShowBurnInfo);

  if (!showBurnInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center" onClick={() => setShowBurnInfo(false)}>
      <div className="bg-[#1a1a1a] border border-bonsai-red/20 rounded-2xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-base font-extrabold text-bonsai-red mb-2 tracking-widest">MONTHLY BURN</div>
        <p className="text-xs text-[#888] leading-relaxed mb-4">
          The total amount of cash the company spends each month to operate. This includes rent, electricity, labor,
          nutrients & CO₂, and licensing fees for every unlocked room — whether or not that room has an active crop.
        </p>
        <div className="text-xs text-[#666] leading-relaxed mb-4">
          <strong className="text-[#aaa]">Tip:</strong> Upgrades to irrigation/environmental and operations
          can reduce per-room overhead. Empty rooms still cost ~15% of their full electricity and labor.
        </div>
        <button onClick={() => setShowBurnInfo(false)} className="w-full py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#666] text-sm cursor-pointer">Got it</button>
      </div>
    </div>
  );
}

// ─── Main Game UI ───
function MainGameUI() {
  const state = useGameStore((s) => s.state);
  const activeTab = useGameStore((s) => s.ui.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  if (!state) return null;

  const tabs = [
    { id: "facility", icon: "🌿", label: "Grow" },
    { id: "pnl", icon: "📊", label: "P&L" },
    { id: "upgrades", icon: "⚡", label: "Upgrades" },
    { id: "trophies", icon: "🏆", label: `${Object.keys(state.achievements || {}).length}/${ACHIEVEMENTS.length}` },
    { id: "leaderboard", icon: "👑", label: "Top 420" },
  ];

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{
        background: "#0a0a0a",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
    <div
      className="min-h-screen text-white w-full max-w-[480px] relative"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #152015 0%, #111 30%, #0a0a0a 100%)",
      }}
    >
      <style>{GAME_STYLES}</style>

      {/* ═══ STICKY HEADER (top bar + tabs) ═══ */}
      <div
        className="sticky top-0 z-[350]"
        style={{
          background: "linear-gradient(180deg, rgba(15,20,15,0.98) 0%, rgba(10,10,10,0.95) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid rgba(139,195,74,0.1)" }}>
          <GameHeader />
        </div>

        {/* Tab nav */}
        <div
          className="flex"
          style={{ background: "rgba(10,10,10,0.9)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-tutorial={tab.id === "pnl" ? "tab-pnl" : tab.id === "upgrades" ? "tab-upgrades" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 pb-2.5 bg-transparent border-none cursor-pointer text-[12px] font-bold tracking-widest transition-all"
              style={{
                color: activeTab === tab.id ? "#8BC34A" : "#444",
                borderBottom: activeTab === tab.id ? "2px solid #8BC34A" : "2px solid transparent",
              }}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span className="text-sm">{tab.icon}</span>{" "}
              <span className="text-[11px]">{tab.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ RAINBOW FOOTER ═══ */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        height: 44,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 30%, #000 100%)",
      }}>
        {/* Left: reset button */}
        <div style={{ width: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={() => useGameStore.getState().setShowResetConfirm(true)}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#555",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 5,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#c0392b";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(192,57,43,0.15)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
            aria-label="Reset Game"
          >
            RESET
          </button>
        </div>
        {/* Center: logo */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <img
            src="/Bonsai_Rainbow.png"
            alt="Bonsai Cultivation"
            style={{
              height: 36,
              width: "auto",
              maxWidth: "85%",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>
        {/* Right: spacer to balance left side */}
        <div style={{ width: 72 }} />
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-3 pb-24 pt-3">
        {activeTab === "facility" && <FacilityTab />}
        {activeTab === "pnl" && <PnLTab />}
        {activeTab === "upgrades" && <UpgradesPanel />}
        {activeTab === "trophies" && <AchievementsTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
      </div>

      {/* ═══ MODALS ═══ */}
      <VcOfferModal />
      {state.tutorialStep >= 5 && <EventModal />}
      <RoomBuyModal />
      <ResetConfirmModal />
      <AchievementToast />
      <RoomDetailModal />
      <AMRInfoModal />
      <RunwayInfoModal />
      <BurnInfoModal />
      <Tutorial />
      <SpeedHint />
    </div>
    </div>
  );
}

// ─── Router ───
function GameRouter() {
  const screen = useGameStore((s) => s.ui.screen);
  const state = useGameStore((s) => s.state);
  const initFromStorage = useGameStore((s) => s.initFromStorage);

  // Mount tick loop exactly once here
  useTickLoop();

  // Init on mount
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  if (screen === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-bonsai-green text-sm">Loading…</div>
      </div>
    );
  }
  if (screen === "onboarding") return <Onboarding />;
  if (screen === "intro") return <IntroScreen />;
  if (state?.gameWon) return <WinScreen />;
  if (state?.gameOver) return <GameOverScreen />;
  return <MainGameUI />;
}

// ─── Root export ───
export default function BonsaiGame() {
  return <GameRouter />;
}
