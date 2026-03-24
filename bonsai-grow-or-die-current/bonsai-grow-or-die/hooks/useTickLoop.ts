"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

/**
 * useTickLoop — mounts the game tick interval.
 * Mount EXACTLY ONCE in GameRouter.
 */
export function useTickLoop() {
  const processTick = useGameStore((s) => s.processTick);
  const processNotifications = useGameStore((s) => s.processNotifications);
  const processAchievementQueue = useGameStore((s) => s.processAchievementQueue);
  const screen = useGameStore((s) => s.ui.screen);
  const paused = useGameStore((s) => s.ui.paused);
  const gameSpeed = useGameStore((s) => s.ui.gameSpeed);
  const tutorialStep = useGameStore((s) => s.state?.tutorialStep);
  const showAchievement = useGameStore((s) => s.ui.showAchievement);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick interval
  useEffect(() => {
    if (screen === "game" && !paused && (tutorialStep === undefined || tutorialStep === 0 || tutorialStep >= 5)) {
      const interval = gameSpeed >= 64 ? 150 : gameSpeed >= 32 ? 300 : 2000;
      tickRef.current = setInterval(() => {
        processTick();
        processNotifications();
      }, interval);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
    if (tickRef.current) clearInterval(tickRef.current);
  }, [screen, paused, processTick, processNotifications, tutorialStep, gameSpeed]);

  // Achievement queue processing
  useEffect(() => {
    processAchievementQueue();
  }, [showAchievement, processAchievementQueue]);
}
