"use client";

import { useGameStore } from "@/store/useGameStore";
import { ACHIEVEMENTS } from "@/lib/constants";

export default function AchievementToast() {
  const showAchievement = useGameStore((s) => s.ui.showAchievement);
  const setShowAchievement = useGameStore((s) => s.setShowAchievement);
  const state = useGameStore((s) => s.state);
  if (!showAchievement) return null;
  const ach = ACHIEVEMENTS.find(a => a.id === showAchievement);
  if (!ach) return null;
  const unlockedCount = Object.keys(state?.achievements || {}).length;

  return (
    <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center" onClick={() => setShowAchievement(null)}>
      <div className="bg-gradient-to-br from-[#1a2e1a] to-[#1a1a1a] border border-bonsai-green/30 rounded-2xl px-7 py-8 max-w-xs text-center shadow-[0_0_60px_rgba(139,195,74,0.15),0_0_120px_rgba(139,195,74,0.05)] animate-[fade-up_0.4s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="text-[10px] tracking-[3px] text-bonsai-green font-bold mb-3">ACHIEVEMENT UNLOCKED</div>
        <img
          src="/Rainbow_Bonsai_Full.png"
          alt="Bonsai Cultivation"
          style={{ width: 110, height: 110, objectFit: "contain", margin: "0 auto 12px", display: "block" }}
          draggable={false}
        />
        <div className="text-xl font-extrabold text-white mb-1.5">{ach.name}</div>
        <div className="text-sm text-[#888] leading-relaxed mb-5">{ach.desc}</div>
        <div className="text-[10px] text-[#555] mb-4">{unlockedCount} / {ACHIEVEMENTS.length} achievements</div>
        <button onClick={() => setShowAchievement(null)} className="px-8 py-2.5 bg-bonsai-green/15 border border-bonsai-green/30 rounded-lg text-bonsai-green font-bold text-sm cursor-pointer tracking-widest hover:bg-bonsai-green/20 transition-colors">NICE</button>
      </div>
    </div>
  );
}
