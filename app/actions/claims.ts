"use server";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface ClaimRecord {
  code: string;
  name: string;
  email: string;
  phone: string;
  jointCount: number;
  gameEvent: string;
  createdAt: string;
  redeemed: boolean;
  redeemedAt?: string;
}

/** Generate a short, readable claim code like BONSAI-A3F7K2 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars (0/O, 1/I)
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BONSAI-${suffix}`;
}

/** Create a new claim code and store it in KV. Returns the code. */
export async function createClaimAction(data: {
  name: string;
  email: string;
  phone: string;
  jointCount: number;
  gameEvent: string;
}): Promise<{ success: true; code: string } | { success: false; error: string }> {
  try {
    // Generate a unique code (retry on collision)
    let code = generateCode();
    let attempts = 0;
    while ((await redis.exists(`claim:${code}`)) && attempts < 5) {
      code = generateCode();
      attempts++;
    }

    const record: ClaimRecord = {
      code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jointCount: data.jointCount,
      gameEvent: data.gameEvent,
      createdAt: new Date().toISOString(),
      redeemed: false,
    };

    await redis.set(`claim:${code}`, record);

    // Also store an index of all codes for the admin list
    await redis.lpush("claims:all", code);

    return { success: true, code };
  } catch (err) {
    console.error("createClaimAction error:", err);
    return { success: false, error: "Failed to create claim code." };
  }
}

/** Look up a claim by code */
export async function getClaimAction(
  code: string
): Promise<{ success: true; claim: ClaimRecord } | { success: false; error: string }> {
  try {
    const normalized = code.trim().toUpperCase();
    const record = await redis.get<ClaimRecord>(`claim:${normalized}`);
    if (!record) return { success: false, error: "Code not found." };
    return { success: true, claim: record };
  } catch (err) {
    console.error("getClaimAction error:", err);
    return { success: false, error: "Lookup failed." };
  }
}

/** Mark a claim as redeemed */
export async function redeemClaimAction(
  code: string,
  adminPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Invalid password." };
  }
  try {
    const normalized = code.trim().toUpperCase();
    const record = await redis.get<ClaimRecord>(`claim:${normalized}`);
    if (!record) return { success: false, error: "Code not found." };
    if (record.redeemed) return { success: false, error: "Already redeemed." };

    const updated: ClaimRecord = {
      ...record,
      redeemed: true,
      redeemedAt: new Date().toISOString(),
    };
    await redis.set(`claim:${normalized}`, updated);
    return { success: true };
  } catch (err) {
    console.error("redeemClaimAction error:", err);
    return { success: false, error: "Redemption failed." };
  }
}

/** Get all claims (admin only) */
export async function getAllClaimsAction(
  adminPassword: string
): Promise<{ success: true; claims: ClaimRecord[] } | { success: false; error: string }> {
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Invalid password." };
  }
  try {
    const codes = await redis.lrange<string>("claims:all", 0, -1);
    const claims = await Promise.all(
      codes.map((c: string) => redis.get<ClaimRecord>(`claim:${c}`))
    );
    return {
      success: true,
      claims: (claims as (ClaimRecord | null)[]).filter((c): c is ClaimRecord => c !== null),
    };
  } catch (err) {
    console.error("getAllClaimsAction error:", err);
    return { success: false, error: "Failed to load claims." };
  }
}
