"use client";

import { useGameStore } from "@/store/useGameStore";

export default function ResetConfirmModal() {
  const showResetConfirm = useGameStore((s) => s.ui.showResetConfirm);
  const setShowResetConfirm = useGameStore((s) => s.setShowResetConfirm);
  const resetGame = useGameStore((s) => s.resetGame);
  if (!showResetConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center" onClick={() => setShowResetConfirm(false)}>
      <div className="bg-[#1a1a1a] border border-bonsai-red/30 rounded-2xl p-7 max-w-xs text-center shadow-[0_0_40px_rgba(239,83,80,0.1)]" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-3">⚠️</div>
        <div className="text-base font-extrabold text-bonsai-red mb-2 tracking-wide">RESET GAME?</div>
        <div className="text-xs text-[#888] leading-relaxed mb-6">This will wipe all progress, cash, upgrades, and achievements. This cannot be undone.</div>
        <div className="flex gap-2">
          <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[#666] font-semibold text-xs cursor-pointer hover:bg-white/[0.06] transition-colors">Cancel</button>
          <button onClick={() => { resetGame(); setShowResetConfirm(false); }} className="flex-1 py-2.5 bg-bonsai-red/20 border border-bonsai-red/40 rounded-lg text-bonsai-red font-bold text-xs cursor-pointer hover:bg-bonsai-red/30 transition-colors">Reset Everything</button>
        </div>
      </div>
    </div>
  );
}
