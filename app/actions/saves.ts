"use server";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ─── Player ID generation ────────────────────────────────────────────────────
// Format: BG-XXXXXXXX (8 alphanumeric chars, no confusable chars)
const SAFE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

function generatePlayerId(): string {
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return `BG-${id}`;
}

// ─── Save game state to KV ───────────────────────────────────────────────────
// Key: save:{playerId} → JSON game state
// TTL: 30 days (refreshed on every save)
const SAVE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function saveGameAction(
  playerId: string,
  gameState: unknown
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!playerId || typeof playerId !== "string" || !playerId.startsWith("BG-")) {
      return { ok: false, error: "Invalid player ID" };
    }

    // Basic size check — don't store anything over 512KB
    const json = JSON.stringify(gameState);
    if (json.length > 512 * 1024) {
      return { ok: false, error: "Save data too large" };
    }

    await redis.set(`save:${playerId}`, json, { ex: SAVE_TTL_SECONDS });
    return { ok: true };
  } catch (e) {
    console.error("saveGameAction error:", e);
    return { ok: false, error: "Server error" };
  }
}

// ─── Load game state from KV ─────────────────────────────────────────────────
export async function loadGameAction(
  playerId: string
): Promise<{ ok: boolean; gameState?: unknown; error?: string }> {
  try {
    if (!playerId || typeof playerId !== "string" || !playerId.startsWith("BG-")) {
      return { ok: false, error: "Invalid player ID" };
    }

    const raw = await redis.get<string>(`save:${playerId}`);
    if (!raw) {
      return { ok: false, error: "No save found" };
    }

    // Redis may return already-parsed object or string depending on driver
    const gameState = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { ok: true, gameState };
  } catch (e) {
    console.error("loadGameAction error:", e);
    return { ok: false, error: "Server error" };
  }
}

// ─── Generate a new player ID (called once on game start) ────────────────────
export async function generatePlayerIdAction(): Promise<{
  ok: boolean;
  playerId?: string;
  error?: string;
}> {
  try {
    // Generate and verify uniqueness (collision is astronomically unlikely but be safe)
    let playerId = generatePlayerId();
    let attempts = 0;
    while (attempts < 3) {
      const existing = await redis.exists(`save:${playerId}`);
      if (!existing) break;
      playerId = generatePlayerId();
      attempts++;
    }

    return { ok: true, playerId };
  } catch (e) {
    console.error("generatePlayerIdAction error:", e);
    return { ok: false, error: "Server error" };
  }
}
