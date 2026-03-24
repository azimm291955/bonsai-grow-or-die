"use client";

import { useGameStore } from "@/store/useGameStore";

// ─── SVG Illustrations ─────────────────────────────────────────────────────────

function VegPlantSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block", margin: "0 auto" }} aria-hidden="true">
      <ellipse cx="24" cy="42" rx="10" ry="2" fill="rgba(139,195,74,0.08)" />
      <path d="M16,40 L18,46 L30,46 L32,40Z" fill="#5D4037" />
      <rect x="15" y="38" width="18" height="3" rx="1" fill="#6D4C41" />
      <path d="M23,37 Q23,20 24,12" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M24,20 Q14,10 8,16 Q16,8 22,12 Q18,4 12,8 Q20,0 24,14" fill="#2E7D32" />
      <path d="M24,20 Q14,10 8,16 Q16,8 22,12" fill="#43A047" opacity="0.7" />
      <path d="M24,20 Q34,10 40,16 Q32,8 26,12 Q30,4 36,8 Q28,0 24,14" fill="#2E7D32" />
      <path d="M24,20 Q34,10 40,16 Q32,8 26,12" fill="#43A047" opacity="0.7" />
      <path d="M24,28 Q16,22 10,26 Q18,20 24,24" fill="#388E3C" />
      <path d="M24,28 Q32,22 38,26 Q30,20 24,24" fill="#388E3C" />
      <ellipse cx="24" cy="10" rx="5" ry="4" fill="#66BB6A" opacity="0.9" />
      <ellipse cx="24" cy="9" rx="3" ry="2.5" fill="#81C784" opacity="0.8" />
    </svg>
  );
}

function FlowerPlantSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block", margin: "0 auto" }} aria-hidden="true">
      <ellipse cx="24" cy="42" rx="10" ry="2" fill="rgba(156,39,176,0.06)" />
      <path d="M16,40 L18,46 L30,46 L32,40Z" fill="#5D4037" />
      <rect x="15" y="38" width="18" height="3" rx="1" fill="#6D4C41" />
      <line x1="24" y1="37" x2="24" y2="6" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="26" x2="12" y2="18" stroke="#558B2F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="26" x2="36" y2="18" stroke="#558B2F" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="24" cy="4" rx="8" ry="10" fill="#6A1B9A" opacity="0.85" />
      <ellipse cx="23" cy="6" rx="6" ry="8" fill="#4A148C" opacity="0.75" />
      <ellipse cx="25" cy="3" rx="5" ry="7" fill="#7B1FA2" opacity="0.65" />
      <ellipse cx="10" cy="16" rx="5" ry="6" fill="#6A1B9A" opacity="0.75" />
      <ellipse cx="38" cy="16" rx="5" ry="6" fill="#6A1B9A" opacity="0.75" />
      <circle cx="22" cy="2" r="0.7" fill="#fff" opacity="0.6" />
      <circle cx="26" cy="5" r="0.6" fill="#fff" opacity="0.5" />
    </svg>
  );
}

function CycleStage({ bgColor, borderColor, labelColor, label, sublabel, children }: {
  bgColor: string; borderColor: string; labelColor: string; label: string; sublabel: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
      {children}
      <div style={{ color: labelColor, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div style={{ color: "#666", fontSize: 10 }}>{sublabel}</div>
    </div>
  );
}

export default function IntroScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 24px",
    }}>
      <div style={{
        background: "#1e1e1e", border: "1px solid #3a5a3a", borderRadius: 16,
        maxWidth: 420, width: "100%", padding: 28, textAlign: "center",
      }}>
        <div style={{ fontSize: 11, color: "#8BC34A", letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>
          WELCOME TO BONSAI
        </div>
        <h2 style={{ color: "#fff", fontSize: 22, margin: "0 0 16px", fontWeight: 700 }}>
          The Cultivation Cycle
        </h2>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "20px 0", flexWrap: "wrap" }}>
          <CycleStage bgColor="#1a2a1a" borderColor="#4a7a4a" labelColor="#8BC34A" label="VEG" sublabel="32 days">
            <VegPlantSVG />
          </CycleStage>
          <div style={{ color: "#555", fontSize: 20 }} aria-hidden="true">→</div>
          <CycleStage bgColor="#2a1a2a" borderColor="#7a4a7a" labelColor="#CE93D8" label="FLOWER" sublabel="64 days">
            <FlowerPlantSVG />
          </CycleStage>
          <div style={{ color: "#555", fontSize: 20 }} aria-hidden="true">→</div>
          <CycleStage bgColor="#2a2a1a" borderColor="#7a7a4a" labelColor="#FFB74D" label="HARVEST" sublabel="Get paid">
            <div style={{ fontSize: 24 }}>💰</div>
          </CycleStage>
        </div>

        <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: "16px 0" }}>
          Every plant starts in a <strong style={{ color: "#8BC34A" }}>veg room</strong> for 32 days.
          When veg completes, you <strong style={{ color: "#FFB74D" }}>flip</strong> the plants to a{" "}
          <strong style={{ color: "#CE93D8" }}>flower room</strong> for 64 more days. Then you harvest and sell at market price.
        </p>
        <p style={{ color: "#888", fontSize: 12, lineHeight: 1.6 }}>
          Your first batch of plants just finished vegging in Room 1. Now you need a flower room to move them into.
        </p>

        <button
          onClick={() => setScreen("game")}
          style={{
            width: "100%", padding: 14, background: "#8BC34A", color: "#1a1a1a",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: "pointer", marginTop: 16, transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = "0.9"; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; }}
        >
          Learn the ropes →
        </button>
      </div>
    </div>
  );
}
