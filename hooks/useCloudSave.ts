"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { saveGameAction, generatePlayerIdAction } from "@/app/actions/saves";

// ─── Cookie helpers ──────────────────────────────────────────────────────────
// Cookies are more durable than localStorage on Safari/WebKit (ITP won't purge
// first-party cookies as aggressively). We store the playerId in both.

function setPlayerIdCookie(playerId: string) {
  // 1 year expiry, SameSite=Lax, Secure in production
  const maxAge = 365 * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `bonsai_pid=${playerId}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function getPlayerIdCookie(): string | null {
  const match = document.cookie.match(/(?:^|; )bonsai_pid=([^;]+)/);
  return match ? match[1] : null;
}

// ─── Cloud save hook ─────────────────────────────────────────────────────────
// Debounces saves to KV — fires 30s after the last state change, or immediately
// on page unload (via visibilitychange).

const SAVE_DEBOUNCE_MS = 30_000; // 30 seconds

export function useCloudSave() {
  const state = useGameStore((s) => s.state);
  const setPlayerId = useGameStore((s) => s.setPlayerId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(""); // JSON hash to avoid redundant saves

  // ── Ensure playerId exists ──
  useEffect(() => {
    if (!state || !state.playerName) return;

    if (!state.playerId) {
      // Check cookie first — maybe we already have an ID from a previous session
      const cookieId = getPlayerIdCookie();
      if (cookieId) {
        setPlayerId(cookieId);
        return;
      }

      // Generate a new one
      generatePlayerIdAction().then((result) => {
        if (result.ok && result.playerId) {
          setPlayerId(result.playerId);
          setPlayerIdCookie(result.playerId);
        }
      });
    } else {
      // Ensure cookie is in sync
      setPlayerIdCookie(state.playerId);
    }
  }, [state?.playerId, state?.playerName, setPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save to cloud ──
  const saveNow = useCallback(async () => {
    const s = useGameStore.getState().state;
    if (!s?.playerId || !s.playerName) return;

    const json = JSON.stringify(s);
    if (json === lastSavedRef.current) return; // no changes

    const result = await saveGameAction(s.playerId, s);
    if (result.ok) {
      lastSavedRef.current = json;
    }
  }, []);

  // ── Debounced save on state changes ──
  useEffect(() => {
    if (!state?.playerId || !state.playerName) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveNow, SAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, saveNow]);

  // ── Save on tab hide / page unload ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveNow]);
}
