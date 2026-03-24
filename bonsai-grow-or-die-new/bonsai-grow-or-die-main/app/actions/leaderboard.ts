"use server";

import { Redis } from "@upstash/redis";
import { createHmac, randomBytes } from "crypto";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const KV_KEY = "leaderboard:top420";
const MAX_ENTRIES = 420;
const TOKEN_TTL_SECONDS = 120; // Tokens expire after 2 minutes

function getSigningSalt(): string {
  return process.env.LEADERBOARD_SIGN_SALT || "bonsai_grow_or_die_2026_default_salt";
}

// ============================================================
// Submit Token — server-generated nonce eliminates clock skew
// ============================================================

/**
 * Client calls this when the win screen loads.
 * Server returns { nonce, timestamp, salt } — all server-authoritative.
 * The nonce is stored in Redis with a 2-minute TTL to prevent replay.
 */
export async function getSubmitTokenAction(): Promise<{
  nonce: string;
  timestamp: number;
  salt: string;
}> {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();

  // Store nonce in Redis with TTL — can only be used once
  await redis.set(`submit_nonce:${nonce}`, "1", { ex: TOKEN_TTL_SECONDS });

  return {
    nonce,
    timestamp,
    salt: getSigningSalt(),
  };
}

/**
 * Verify HMAC-SHA256 signature.
 * Payload format: playerName:finalCash:rooms:totalHarvests:timestamp:nonce:salt
 */
function verifySignature(
  playerName: string,
  finalCash: number,
  rooms: number,
  totalHarvests: number,
  timestamp: number,
  nonce: string,
  signature: string
): boolean {
  const salt = getSigningSalt();
  const payload = `${playerName}:${finalCash}:${rooms}:${totalHarvests}:${timestamp}:${nonce}:${salt}`;
  const expected = createHmac("sha256", salt).update(payload).digest("hex");
  return expected === signature;
}

// ============================================================
// Fetch Leaderboard
// ============================================================

const AZ_SEED = {
  name: "AZ",
  cash: 29000000,
  rooms: 9,
  harvests: 99,
  ts: new Date("2026-04-20T04:20:00.000Z").getTime(),
};

interface LeaderboardResult {
  rank: number;
  name: string;
  cash: number;
  rooms: number;
  harvests: number;
  ts: number;
}

export async function fetchLeaderboardAction(): Promise<{ entries: LeaderboardResult[]; total: number }> {
  try {
    const raw = await redis.zrange(KV_KEY, 0, MAX_ENTRIES - 1, { rev: true, withScores: true });
    const results: LeaderboardResult[] = [];

    for (let i = 0; i < raw.length; i++) {
      const entry = raw[i] as unknown;
      if (typeof entry === "number") continue;

      let memberData: Record<string, unknown>;
      let cash: number;

      if (
        typeof entry === "object" && entry !== null &&
        "score" in (entry as object) && "member" in (entry as object)
      ) {
        const e = entry as { score: number; member: unknown };
        memberData = e.member as Record<string, unknown>;
        cash = e.score;
      } else if (typeof entry === "object" && entry !== null) {
        memberData = entry as Record<string, unknown>;
        cash = i + 1 < raw.length && typeof raw[i + 1] === "number" ? (raw[i + 1] as number) : 0;
      } else if (typeof entry === "string") {
        try { memberData = JSON.parse(entry); } catch { continue; }
        cash = i + 1 < raw.length && typeof raw[i + 1] === "number" ? (raw[i + 1] as number) : 0;
      } else {
        continue;
      }

      if (typeof memberData === "string") {
        try { memberData = JSON.parse(memberData); } catch { continue; }
      }

      if (memberData && typeof memberData === "object") {
        results.push({
          rank: results.length + 1,
          name: (memberData.name as string) || "???",
          cash: Math.round(cash),
          rooms: (memberData.rooms as number) || 0,
          harvests: (memberData.harvests as number) || 0,
          ts: (memberData.ts as number) || 0,
        });
      }
    }

    // Merge AZ seed if not present
    const azExists = results.some(e => e.name === AZ_SEED.name && e.cash === AZ_SEED.cash);
    if (!azExists) {
      const azEntry: LeaderboardResult = { rank: 0, ...AZ_SEED };
      const insertIdx = results.findIndex(e => e.cash < AZ_SEED.cash);
      if (insertIdx === -1) results.push(azEntry);
      else results.splice(insertIdx, 0, azEntry);
    }

    results.forEach((e, i) => { e.rank = i + 1; });
    return { entries: results, total: results.length };
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return { entries: [], total: 0 };
  }
}

// ============================================================
// Submit Score — with server-generated nonce + HMAC + single-use
// ============================================================

export async function submitScoreAction(
  playerName: string,
  finalCash: number,
  rooms: number,
  totalHarvests: number,
  signature: string,
  timestamp: number,
  nonce: string,
): Promise<{ success: boolean; rank?: number | null; error?: string }> {
  // Input validation
  if (!playerName || typeof finalCash !== "number" || typeof rooms !== "number") {
    return { success: false, error: "Missing required fields" };
  }
  if (finalCash <= 0) return { success: false, error: "Cash must be positive" };
  if (rooms < 4) return { success: false, error: "Need at least 4 rooms" };
  if (finalCash > 500000000) return { success: false, error: "Cash exceeds maximum" };
  if (playerName.length > 24) return { success: false, error: "Name too long" };

  // Nonce validation — check it exists in Redis (proves server generated it)
  if (!nonce || typeof nonce !== "string") {
    return { success: false, error: "Missing nonce" };
  }
  const nonceKey = `submit_nonce:${nonce}`;
  const nonceExists = await redis.get(nonceKey);
  if (!nonceExists) {
    return { success: false, error: "Submission token expired or already used" };
  }
  // Delete nonce immediately — single use only
  await redis.del(nonceKey);

  // Timestamp validation (server-generated, so this is just a sanity check)
  if (!timestamp || typeof timestamp !== "number") {
    return { success: false, error: "Missing timestamp" };
  }
  const age = Date.now() - timestamp;
  if (age > TOKEN_TTL_SECONDS * 1000 || age < -5000) {
    return { success: false, error: "Submission token expired" };
  }

  // HMAC signature verification
  if (!signature || typeof signature !== "string") {
    return { success: false, error: "Missing signature" };
  }
  const valid = verifySignature(playerName, finalCash, rooms, totalHarvests, timestamp, nonce, signature);
  if (!valid) {
    return { success: false, error: "Invalid score signature" };
  }

  try {
    const member = JSON.stringify({
      name: playerName.slice(0, 24),
      rooms,
      harvests: totalHarvests,
      ts: Date.now(),
    });

    await redis.zadd(KV_KEY, { score: Math.round(finalCash), member });

    const totalEntries = await redis.zcard(KV_KEY);
    if (totalEntries > MAX_ENTRIES) {
      await redis.zremrangebyrank(KV_KEY, 0, totalEntries - MAX_ENTRIES - 1);
    }

    const rank = await redis.zrevrank(KV_KEY, member);
    return { success: true, rank: rank !== null ? rank + 1 : null };
  } catch (error) {
    console.error("Leaderboard submit error:", error);
    return { success: false, error: "Failed to submit" };
  }
}
