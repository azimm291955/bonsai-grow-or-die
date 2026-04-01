"use server";

import { Redis } from "@upstash/redis";
import { Resend } from "resend";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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
      <div style="font-family: 'Courier New', monospace; background: #0a0a0a; color: #e0e0e0; padding: 48px 32px; max-width: 480px; margin: 0 auto;">
        <div style="border-top: 2px solid #8BC34A; margin-bottom: 32px;"></div>

        <p style="font-size: 10px; letter-spacing: 3px; color: #8BC34A; text-transform: uppercase; margin: 0 0 8px;">Bonsai Cultivation</p>
        <h1 style="font-size: 28px; font-weight: 700; color: #e0e0e0; margin: 0 0 8px;">${joints} Claimed</h1>
        <p style="color: #888; font-size: 13px; line-height: 1.7; margin: 0 0 32px;">Hey ${data.name} — ${blurb}</p>

        <p style="font-size: 10px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin: 0 0 10px;">Your Claim Code</p>
        <div style="background: #111; border: 1px solid #8BC34A44; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 26px; font-weight: 700; letter-spacing: 6px; color: #8BC34A;">${data.code}</span>
        </div>

        <p style="color: #888; font-size: 12px; line-height: 1.8; margin: 0 0 8px;">
          Screenshot this email or write the code down. Bring it to Space Jam Dispensary starting <strong style="color: #e0e0e0;">April 24th, 2026</strong>.
        </p>
        <p style="color: #555; font-size: 11px; margin: 0 0 32px;">📍 1810 S Broadway, Denver, CO 80210 &nbsp;·&nbsp; 📞 (720) 986-0882</p>

        <div style="border-top: 1px solid #1a1a1a; padding-top: 20px;">
          <p style="color: #444; font-size: 10px; margin: 0;">— Bonsai Cultivation &nbsp;·&nbsp; bonsaicultivation.com</p>
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

/** Create a new claim code and store it in KV. Returns the code.
 *  If the phone number already has a claim, returns the existing code instead. */
export async function createClaimAction(data: {
  name: string;
  email: string;
  phone: string;
  jointCount: number;
  gameEvent: string;
}): Promise<{ success: true; code: string; existing?: boolean } | { success: false; error: string }> {
  try {
    const phoneKey = `phone:${normalizePhone(data.phone)}`;

    // Check for duplicate phone number
    const existingCode = await redis.get<string>(phoneKey);
    if (existingCode) {
      await sendClaimEmail({ name: data.name, email: data.email, code: existingCode, jointCount: data.jointCount });
      return { success: true, code: existingCode, existing: true };
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
