"use server";

import { Redis } from "@upstash/redis";
import { Resend } from "resend";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ─── Contest rules ───────────────────────────────────────────────────────────
// Midnight MDT (UTC-6) at the end of 4/20/2026 = 2026-04-21T06:00:00Z
const GAME_END = new Date("2026-04-21T06:00:00Z");
const CLAIM_CAPACITY = 2000;

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendClaimEmail(data: {
  name: string;
  email: string;
  code: string;
  jointCount: number;
}) {
  const joints = data.jointCount === 5 ? "Five Joints" : "One Joint";
  const blurb =
    data.jointCount === 5
      ? "You beat the game on a pure run — no vulture capital. That's the real win."
      : "You registered for the hunt. Finish the game by April 20th to unlock four more joints.";

  await resend.emails.send({
    from: "Bonsai Cultivation <bot@bonsaicultivation.com>",
    to: data.email,
    subject: "Your Claim Code is Ready",
    html: `
      <div style="background:#080c08; max-width:520px; margin:0 auto; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

        <!-- Top accent bar -->
        <div style="height:3px; background:#7ec725;"></div>

        <!-- Header -->
        <div style="padding:26px 40px 22px; border-bottom:1px solid #141f14;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td><span style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:4px; color:#7ec725; text-transform:uppercase;">Bonsai Cultivation</span></td>
              <td align="right"><span style="font-size:16px; opacity:0.5;">🌿</span></td>
            </tr>
          </table>
        </div>

        <!-- Hero -->
        <div style="padding:44px 40px 36px;">
          <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:3px; color:#3d5c3d; text-transform:uppercase; margin:0 0 14px;">Prize Confirmed</p>
          <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:50px; font-weight:900; color:#eef5ee; line-height:1.05; margin:0 0 20px; letter-spacing:-1px;">${joints}<br>Claimed.</h1>
          <p style="color:#6a7a6a; font-size:14px; line-height:1.8; margin:0; max-width:360px;">Hey ${data.name} — ${blurb}</p>
        </div>

        <!-- Divider -->
        <div style="height:1px; background:#141f14; margin:0 40px;"></div>

        <!-- Claim code -->
        <div style="padding:36px 40px;">
          <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:3px; color:#3d5c3d; text-transform:uppercase; margin:0 0 14px;">Your Claim Code</p>
          <div style="background:#040a04; border:1px solid rgba(126,199,37,0.22); border-radius:10px; padding:32px 24px; text-align:center;">
            <span style="font-family:'Courier New',Courier,monospace; font-size:26px; font-weight:bold; letter-spacing:7px; color:#a8e040;">${data.code}</span>
          </div>
          <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:2px; color:#2d3d2d; text-align:center; margin:10px 0 0;">One-time use &nbsp;·&nbsp; Non-transferable</p>
        </div>

        <!-- Instructions -->
        <div style="padding:0 40px 32px;">
          <p style="color:#5a6a5a; font-size:13px; line-height:1.85; margin:0;">
            Screenshot this email or write the code down. Bring it to Space Jam Dispensary between <strong style="color:#c8d8c8; font-weight:500;">April 24th – April 30th, 2026</strong>. Unclaimed prizes expire after April 30th.
          </p>
        </div>

        <!-- Space Jam pickup card -->
        <div style="margin:0 40px 44px; border-radius:12px; overflow:hidden; border:1px solid rgba(0,170,255,0.18);">
          <div style="background:#040d15; padding:30px 24px 26px; text-align:center; border-bottom:1px solid rgba(0,170,255,0.12);">
            <a href="https://share.google/Q0DuaCgJf87dNF4hi" target="_blank" style="display:block;">
              <img src="https://bonsai-game.vercel.app/Space_Jam_Logo.png" alt="Space Jam Dispensary" width="108" style="display:block; margin:0 auto; width:108px; height:auto;">
            </a>
          </div>
          <div style="background:#050d14; padding:22px 24px; text-align:center;">
            <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:3px; color:#0088bb; text-transform:uppercase; margin:0 0 12px;">Pickup Location</p>
            <p style="color:#6a8a8a; font-size:13px; line-height:2; margin:0;">
              <a href="https://share.google/Q0DuaCgJf87dNF4hi" target="_blank" style="color:#6a8a8a; text-decoration:none;">📍 1810 S Broadway, Denver, CO 80210</a><br>
              <a href="tel:7209860882" style="color:#6a8a8a; text-decoration:none;">📞 (720) 986-0882</a>
            </p>
          </div>
        </div>

        <!-- 21+ warning -->
        <div style="margin:0 40px 28px; background:#1a0a0a; border:1px solid rgba(200,50,50,0.25); border-radius:10px; padding:16px 20px; text-align:center;">
          <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:2px; color:#c03030; text-transform:uppercase; font-weight:bold; margin:0 0 6px;">Must Be 21+ To Claim</p>
          <p style="color:#7a4a4a; font-size:11px; line-height:1.7; margin:0;">Do not break the law and try to collect your winnings if you are under the legal age!</p>
        </div>

        <!-- Footer -->
        <div style="margin:0 40px; padding:20px 0 36px; border-top:1px solid #0f180f;">
          <p style="font-family:'Courier New',Courier,monospace; color:#2a3a2a; font-size:10px; margin:0;">— Bonsai Cultivation &nbsp;·&nbsp; bonsaicultivation.com</p>
        </div>

      </div>
    `,
  });
}

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

/** Normalize a phone number to digits only for deduplication */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Returns whether registration is currently open and how many entries have been claimed */
export async function getClaimStatusAction(): Promise<{
  isOpen: boolean;
  reason?: "deadline" | "capacity";
  count: number;
  capacity: number;
}> {
  try {
    const now = new Date();
    if (now >= GAME_END) {
      const count = await redis.llen("claims:all");
      return { isOpen: false, reason: "deadline", count, capacity: CLAIM_CAPACITY };
    }
    const count = await redis.llen("claims:all");
    if (count >= CLAIM_CAPACITY) {
      return { isOpen: false, reason: "capacity", count, capacity: CLAIM_CAPACITY };
    }
    return { isOpen: true, count, capacity: CLAIM_CAPACITY };
  } catch {
    // On error, default to open so we don't block legitimate players
    return { isOpen: true, count: 0, capacity: CLAIM_CAPACITY };
  }
}

/** Create a new claim code and store it in KV. Returns the code.
 *  If the phone number already has a claim, returns the existing code instead. */
export async function createClaimAction(data: {
  name: string;
  email: string;
  phone: string;
  jointCount: number;
  gameEvent: string;
}): Promise<{ success: true; code: string; existing?: boolean } | { success: false; error: string; reason?: "deadline" | "capacity" }> {
  try {
    const phoneKey = `phone:${normalizePhone(data.phone)}`;

    // Check for duplicate phone number first — existing entries are always allowed
    const existingCode = await redis.get<string>(phoneKey);
    if (existingCode) {
      await sendClaimEmail({ name: data.name, email: data.email, code: existingCode, jointCount: data.jointCount });
      return { success: true, code: existingCode, existing: true };
    }

    // Deadline check — new entries not allowed after game end
    if (new Date() >= GAME_END) {
      return { success: false, error: "Registration closed — the contest ended at midnight on 4/20/2026.", reason: "deadline" };
    }

    // Capacity check — no more than 2,000 entries
    const currentCount = await redis.llen("claims:all");
    if (currentCount >= CLAIM_CAPACITY) {
      return { success: false, error: "All 2,000 penny joints have been claimed. Thank you for playing!", reason: "capacity" };
    }

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

    // Index by phone for deduplication
    await redis.set(phoneKey, code);

    // Index of all codes for the admin list
    await redis.lpush("claims:all", code);

    // Send claim code email via Resend
    await sendClaimEmail({
      name: data.name,
      email: data.email,
      code,
      jointCount: data.jointCount,
    });

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
