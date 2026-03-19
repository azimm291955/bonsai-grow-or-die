"use client";

import { useGameStore } from "@/store/useGameStore";

export default function SpeedControls() {
  // Granular selectors — only re-renders when speed/pause actually changes
  const gameSpeed = useGameStore((s) => s.ui.gameSpeed);
  const paused = useGameStore((s) => s.ui.paused);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const setPaused = useGameStore((s) => s.setPaused);
  const hasState = useGameStore((s) => !!s.state);

  const resetTickTime = () => {
    useGameStore.setState((store) => ({
      state: store.state ? { ...store.state, lastTickRealMs: Date.now() } : store.state,
    }));
  };

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <button
        onClick={() => {
          if (paused && hasState) resetTickTime();
          setPaused(!paused);
        }}
        className="px-2.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all"
        style={{
          background: paused ? "rgba(139,195,74,0.12)" : "rgba(255,255,255,0.02)",
          border: paused ? "1px solid rgba(139,195,74,0.4)" : "1px solid rgba(255,255,255,0.06)",
          color: paused ? "#8BC34A" : "#666",
        }}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? "▶" : "⏸"}
      </button>
      {[1, 32, 64].map(s => (
        <button
          key={s}
          onClick={() => {
            setGameSpeed(s);
            if (paused && hasState) resetTickTime();
            setPaused(false);
          }}
          className="px-2.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all"
          style={{
            border: !paused && gameSpeed === s ? "1px solid rgba(139,195,74,0.4)" : "1px solid rgba(255,255,255,0.06)",
            background: !paused && gameSpeed === s ? "rgba(139,195,74,0.12)" : "rgba(255,255,255,0.02)",
            color: !paused && gameSpeed === s ? "#8BC34A" : "#444",
          }}
        >
          {s}×
        </button>
      ))}
      {!paused && gameSpeed > 1 && (
        <span className="text-[9px] text-bonsai-green ml-1 opacity-60">⚡ {gameSpeed}× speed</span>
      )}
    </div>
  );
}
