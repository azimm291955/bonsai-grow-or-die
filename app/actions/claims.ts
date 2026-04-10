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
  shirtSize: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}) {
  await resend.emails.send({
    from: "Bonsai Cultivation <bot@bonsaicultivation.com>",
    to: data.email,
    subject: "Your Bonsai Swag Claim Code",
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
          <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:50px; font-weight:900; color:#eef5ee; line-height:1.05; margin:0 0 20px; letter-spacing:-1px;">T-Shirt<br>Claimed.</h1>
          <p style="color:#6a7a6a; font-size:14px; line-height:1.8; margin:0; max-width:360px;">Hey ${data.name} — You survived to 4/20/2026. That&apos;s the real win. We&apos;ll mail your free Bonsai t-shirt to the address below.</p>
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

        <!-- Shipping details -->
        <div style="margin:0 40px 44px; border-radius:12px; overflow:hidden; border:1px solid rgba(126,199,37,0.18);">
          <div style="background:#040a04; padding:18px 24px; border-bottom:1px solid rgba(126,199,37,0.10);">
            <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:3px; color:#5a8a2a; text-transform:uppercase; margin:0 0 14px;">Shipping To</p>
            <p style="color:#8aaa6a; font-size:13px; line-height:2; margin:0;">
              ${data.name}<br>
              ${data.address}<br>
              ${data.city}, ${data.state} ${data.zip}
            </p>
          </div>
          <div style="background:#040a04; padding:14px 24px;">
            <p style="font-family:'Courier New',Courier,monospace; font-size:9px; letter-spacing:3px; color:#5a8a2a; text-transform:uppercase; margin:0 0 8px;">Shirt Size</p>
            <p style="color:#8aaa6a; font-size:16px; font-weight:700; margin:0; letter-spacing:2px;">${data.shirtSize}</p>
          </div>
        </div>

        <!-- Note -->
        <div style="padding:0 40px 32px;">
          <p style="color:#5a6a5a; font-size:13px; line-height:1.85; margin:0;">
            Keep this code for your records. If you have any questions, reply to this email or reach us at <strong style="color:#c8d8c8; font-weight:500;">bonsaicultivation.com</strong>. Please allow 4–6 weeks for delivery.
          </p>
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
  dob: string;
  shirtSize: string;
  address: string;
  city: string;
  state: string;
  zip: string;
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
  dob: string;
  shirtSize: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gameEvent: string;
}): Promise<{ success: true; code: string } | { success: false; error: string; reason?: "deadline" | "capacity" | "duplicate" }> {
  try {
    const phoneKey = `phone:${normalizePhone(data.phone)}`;

    // Block duplicate phone numbers — one entry per phone number
    const existingCode = await redis.get<string>(phoneKey);
    if (existingCode) {
      return { success: false, error: "This phone number has already been used to claim a t-shirt. One entry per person.", reason: "duplicate" };
    }

    // Deadline check — new entries not allowed after game end
    if (new Date() >= GAME_END) {
      return { success: false, error: "Registration closed — the contest ended at midnight on 4/20/2026.", reason: "deadline" };
    }

    // Capacity check — no more than 2,000 entries
    const currentCount = await redis.llen("claims:all");
    if (currentCount >= CLAIM_CAPACITY) {
      return { success: false, error: "All claim slots have been filled. Thank you for playing!", reason: "capacity" };
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
      dob: data.dob,
      shirtSize: data.shirtSize,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
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
      shirtSize: data.shirtSize,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
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
