"use client";

import { useState, useEffect } from "react";
import { createClaimAction, getClaimStatusAction } from "@/app/actions/claims";

// ─── localStorage keys ───
export const LS_FORM_SEEN = "bonsai:form_seen";
export const LS_WIN_SUBMITTED = "bonsai:win_submitted";

/** Format a phone number string to (XXX) XXX-XXXX as the user types */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Returns true if the zip code is a Colorado zip (80xxx or 81xxx) */
function isColoradoZip(zip: string): boolean {
  const digits = zip.replace(/\D/g, "");
  if (digits.length !== 5) return false;
  const prefix = parseInt(digits.slice(0, 2), 10);
  return prefix === 80 || prefix === 81;
}

const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
type ShirtSize = (typeof SHIRT_SIZES)[number];

interface Props {
  /**
   * "info"  — mid-game informational popup ("How to Win Bonsai Swag")
   * "claim" — post-win form to collect address + shirt size
   */
  mode: "info" | "claim";
  /** For claim mode: passed through to the KV record */
  gameEvent?: string;
  onSkip: () => void;
  onSuccess: () => void;
}

export default function DataCollectionModal({ mode, gameEvent = "win", onSkip, onSuccess }: Props) {
  // ── Form state ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [shirtSize, setShirtSize] = useState<ShirtSize | "">("");
  const [focused, setFocused] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [zipError, setZipError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [claimedAddress, setClaimedAddress] = useState<{ address: string; city: string; zip: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Internal view mode ──
  // Starts as the prop `mode`, but info mode can switch itself to "claim"
  // when the player taps "Claim My T-Shirt Now" on the How to Win popup.
  const [viewMode, setViewMode] = useState<"info" | "claim">(mode);

  // ── Check if registration is still open (claim view only) ──
  const [regStatus, setRegStatus] = useState<"loading" | "open" | "deadline" | "capacity">("open");
  const [claimCount, setClaimCount] = useState<number>(0);
  const [claimCapacity] = useState<number>(2000);

  useEffect(() => {
    if (viewMode !== "claim") return;
    getClaimStatusAction().then(({ isOpen, reason, count }) => {
      setRegStatus(isOpen ? "open" : (reason ?? "deadline"));
      setClaimCount(count);
    });
  }, [viewMode]);

  const accent = "#7AAB3A";
  const accentGlow = "rgba(122,171,58,0.18)";

  const inputStyle = (field: string, isError = false): React.CSSProperties => ({
    width: "100%",
    background: focused === field ? "rgba(255,255,255,0.05)" : "#131313",
    border: `1px solid ${isError ? "#ef5350" : focused === field ? accent : "#333"}`,
    borderRadius: 8,
    padding: "10px 13px",
    color: "#e0e0e0",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: focused === field ? `0 0 0 3px ${accentGlow}` : "none",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    colorScheme: "dark",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 8,
    color: "#888",
    fontWeight: 600,
    letterSpacing: 2.5,
    display: "block",
    marginBottom: 5,
    textTransform: "uppercase",
    fontFamily: "'JetBrains Mono', monospace",
  };

  // ─────────────────────────────────────────────────────────────────────────
  // INFO MODE — "How to Win Bonsai Swag" informational screen
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "info") {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(4,4,4,0.92)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(8px)",
      }}>
        <div className="modal-enter" style={{
          background: "linear-gradient(160deg, #141414 0%, #0f0f0f 100%)",
          border: `1px solid ${accent}28`,
          borderRadius: 20,
          maxWidth: 390,
          width: "100%",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8), 0 0 80px ${accentGlow}`,
          overflow: "hidden",
          textAlign: "center",
        }}>
          {/* Top accent bar */}
          <div style={{
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
          }} />

          <div style={{ padding: "36px 28px 32px" }}>
            {/* Bonsai logo */}
            <img
              src="/bonsai-logo.png"
              alt="Bonsai Cultivation"
              style={{ width: 72, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 20px" }}
            />

            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 10, textTransform: "uppercase",
            }}>
              Bonsai Swag
            </div>

            <h2 className="shimmer-text-green" style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 30, fontWeight: 700, margin: "0 0 20px",
              letterSpacing: 0.5, lineHeight: 1.1,
            }}>
              How to Win
            </h2>

            {/* Prize info card */}
            <div style={{
              background: `${accent}0d`,
              border: `1px solid ${accent}22`,
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 18,
              textAlign: "left",
            }}>
              <p style={{
                color: "#c0c0c0", fontSize: 14, lineHeight: 1.75,
                fontFamily: "'JetBrains Mono', monospace",
                margin: "0 0 14px",
                textAlign: "center",
              }}>
                <span style={{ fontSize: 28 }}>👕</span>
              </p>
              <p style={{
                color: "#c0c0c0", fontSize: 12, lineHeight: 1.75,
                fontFamily: "'JetBrains Mono', monospace",
                margin: "0 0 10px",
              }}>
                <span style={{ color: accent, fontWeight: 700 }}>Survive to 4/20/2026</span> and we&apos;ll
                mail you a <span style={{ color: accent, fontWeight: 700 }}>free Bonsai t-shirt</span>!
              </p>
              <p style={{
                color: "#888", fontSize: 10, lineHeight: 1.7,
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
              }}>
                Any win condition qualifies — pure run or vulture capital survivor, you earned it.
              </p>
            </div>

            {/* Colorado restriction note */}
            <div style={{
              background: "rgba(255,183,77,0.06)",
              border: "1px solid rgba(255,183,77,0.18)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 24,
            }}>
              <p style={{
                color: "#FFB74D", fontSize: 9, lineHeight: 1.7,
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0, fontWeight: 700, letterSpacing: 1,
                textTransform: "uppercase",
              }}>
                📍 Must be in Colorado to receive a free t-shirt!
              </p>
            </div>

            {/* Primary CTA — switch modal to the full claim form */}
            <button
              onClick={() => {
                localStorage.setItem(LS_FORM_SEEN, "true");
                setViewMode("claim");
              }}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, #4a7a22, #8BC34A)`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1.5,
                boxShadow: `0 4px 24px ${accentGlow}`,
                marginBottom: 10,
              }}
            >
              Claim My T-Shirt Now →
            </button>

            {/* Secondary — dismiss and keep playing */}
            <button
              onClick={() => { localStorage.setItem(LS_FORM_SEEN, "true"); onSuccess(); }}
              style={{
                width: "100%", padding: "11px",
                background: "transparent",
                color: "#888",
                border: "1px solid #333",
                borderRadius: 10,
                fontSize: 10, fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1.5,
              }}
            >
              Keep Growing →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLAIM MODE — post-win t-shirt claim form
  // ─────────────────────────────────────────────────────────────────────────

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Phone validation
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setPhoneError("Enter a valid 10-digit US phone number.");
      return;
    }
    setPhoneError("");

    // Colorado zip validation
    if (!isColoradoZip(zip)) {
      setZipError("Sorry, find us in a Colorado Dispensary next time you visit!");
      return;
    }
    setZipError("");

    setSubmitError(null);
    setSubmitting(true);

    try {
      // 1. Generate claim code (also handles phone deduplication)
      const claimResult = await createClaimAction({
        name,
        email,
        phone,
        dob,
        shirtSize,
        address,
        city,
        state: "CO",
        zip,
        gameEvent,
      });

      if (!claimResult.success) {
        setSubmitError(claimResult.error ?? "Couldn't generate a claim code. Try again.");
        setSubmitting(false);
        return;
      }

      const code = claimResult.code;

      // 2. POST to Formspree for record-keeping
      const body = new FormData();
      body.append("name", name);
      body.append("email", email);
      body.append("phone", phone);
      body.append("dob", dob);
      body.append("address", address);
      body.append("city", city);
      body.append("state", "CO");
      body.append("zip", zip);
      body.append("shirt_size", shirtSize);
      body.append("game_event", gameEvent);
      body.append("claim_code", code);

      await fetch("https://formspree.io/f/xwvwqwqo", {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });

      // 3. Persist win submission to localStorage
      localStorage.setItem(LS_WIN_SUBMITTED, "true");

      setClaimedAddress({ address, city, zip });
      setClaimCode(code);
    } catch {
      setSubmitError("Network error — check your connection and try again.");
    }

    setSubmitting(false);
  };

  // ── Claim code success screen ──
  if (claimCode) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(4,4,4,0.92)",
        zIndex: 9999,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(8px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        <div className="modal-enter" style={{
          background: "linear-gradient(160deg, #141414 0%, #0f0f0f 100%)",
          border: `1px solid ${accent}28`,
          borderRadius: 20,
          maxWidth: 390,
          width: "100%",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8)`,
          overflow: "hidden",
          textAlign: "center",
          margin: "auto 0",
          flexShrink: 0,
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)` }} />
          <div style={{ padding: "36px 28px 32px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👕</div>
            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 10, textTransform: "uppercase",
            }}>
              Your Claim Code
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 28, fontWeight: 700, margin: "0 0 20px",
              color: "#e0e0e0",
            }}>
              T-Shirt Claimed!
            </h2>

            {/* The code itself */}
            <div style={{
              background: `${accent}10`,
              border: `1px solid ${accent}40`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: 6,
                color: accent,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {claimCode}
              </div>
            </div>

            <p style={{
              color: "#888", fontSize: 10, lineHeight: 1.8,
              fontFamily: "'JetBrains Mono', monospace",
              margin: "0 0 8px",
            }}>
              Check your email for confirmation. We&apos;ll mail your shirt to{" "}
              <span style={{ color: accent }}>{claimedAddress?.address}, {claimedAddress?.city}, CO {claimedAddress?.zip}</span>.
            </p>
            <p style={{
              color: "#555", fontSize: 9, lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', monospace",
              margin: "0 0 24px",
            }}>
              Size: <span style={{ color: "#888" }}>{shirtSize}</span>
              &nbsp;·&nbsp; Please allow 4–6 weeks for delivery.
            </p>

            <button
              onClick={onSuccess}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, #4a7a22, #8BC34A)`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1.5,
              }}
            >
              Let&apos;s Go →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading / Closed states ──
  if (regStatus === "loading") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(4,4,4,0.92)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}>
        <p style={{ color: "#555", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          Checking registration status…
        </p>
      </div>
    );
  }

  if (regStatus === "deadline" || regStatus === "capacity") {
    const closedMsg = regStatus === "deadline"
      ? { headline: "Contest Closed", body: "The Bonsai: Grow or Die contest ended at midnight on 4/20/2026. Thank you for playing!" }
      : { headline: "Sold Out", body: "All claim slots have been filled. Thank you for playing — you made it to 4/20." };
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(4,4,4,0.92)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", backdropFilter: "blur(8px)",
      }}>
        <div style={{
          background: "linear-gradient(160deg, #141414 0%, #0f0f0f 100%)",
          border: `1px solid ${accent}28`,
          borderRadius: 20, maxWidth: 390, width: "100%",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8)",
          overflow: "hidden", textAlign: "center",
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)` }} />
          <div style={{ padding: "40px 28px 36px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{regStatus === "capacity" ? "🌿" : "🏁"}</div>
            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 10, textTransform: "uppercase",
            }}>
              Bonsai: Grow or Die
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 28, fontWeight: 700, margin: "0 0 16px", color: "#e0e0e0",
            }}>
              {closedMsg.headline}
            </h2>
            <p style={{
              color: "#888", fontSize: 11, lineHeight: 1.8,
              fontFamily: "'JetBrains Mono', monospace", margin: "0 0 28px",
            }}>
              {closedMsg.body}
            </p>
            <button
              onClick={() => { localStorage.setItem(LS_FORM_SEEN, "true"); onSkip(); }}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, #4a7a22, #8BC34A)`,
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
              }}
            >
              Keep Playing →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main claim form ──
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4,4,4,0.92)",
      zIndex: 9999,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "16px",
      backdropFilter: "blur(8px)",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      <div className="modal-enter" style={{
        background: "linear-gradient(160deg, #141414 0%, #0f0f0f 100%)",
        border: `1px solid ${accent}28`,
        borderRadius: 20,
        maxWidth: 390,
        width: "100%",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8), 0 0 80px ${accentGlow}`,
        overflow: "hidden",
        position: "relative",
        margin: "auto 0",
        flexShrink: 0,
      }}>

        {/* Top accent bar */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
        }} />

        {/* Header */}
        <div style={{ padding: "28px 26px 20px", textAlign: "center" }}>
          <img
            src="/bonsai-logo.png"
            alt="Bonsai Cultivation"
            style={{ width: 64, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 16px" }}
          />

          <div style={{
            fontSize: 8, letterSpacing: 3.5, color: accent,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 10, textTransform: "uppercase",
          }}>
            You Survived to 4/20
          </div>

          <h2 className="shimmer-text-green" style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 30, fontWeight: 700, margin: "0 0 12px",
            letterSpacing: 0.5, lineHeight: 1.1,
          }}>
            Claim Your Free T-Shirt
          </h2>

          {/* Capacity badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${accent}12`,
            border: `1px solid ${accent}35`,
            borderRadius: 20, padding: "5px 14px",
            marginBottom: 14,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: claimCount < claimCapacity ? accent : "#ef5350",
              display: "inline-block", flexShrink: 0,
            }} />
            <span style={{
              fontSize: 8, letterSpacing: 2, color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase", fontWeight: 700,
            }}>
              {claimCount < claimCapacity
                ? `Limited to 2,000 · ${(claimCapacity - claimCount).toLocaleString()} spots remaining`
                : "2,000 of 2,000 · Sold Out"}
            </span>
          </div>

          <p style={{
            color: "#c0c0c0", fontSize: 12, lineHeight: 1.7,
            fontFamily: "'JetBrains Mono', monospace",
            margin: "0 0 6px",
          }}>
            10 years. Four crashes. A pandemic. You made it.
          </p>

          {/* Prize description */}
          <div style={{
            background: `${accent}0d`,
            border: `1px solid ${accent}22`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            textAlign: "left",
          }}>
            <p style={{
              color: "#b0b0b0", fontSize: 10, lineHeight: 1.75,
              fontFamily: "'JetBrains Mono', monospace",
              margin: 0,
            }}>
              <span style={{ color: accent, fontWeight: 700 }}>DECADE OF DOMINANCE.</span>{" "}
              Fill out your shipping info below and we&apos;ll mail a free Bonsai t-shirt directly to you.{" "}
              <span style={{ color: "#FFB74D", fontWeight: 700 }}>Must be in Colorado.</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: "0 26px 26px" }}>
          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" name="name" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
              required style={inputStyle("name")} placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" name="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              required style={inputStyle("email")} placeholder="jane@example.com"
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: phoneError ? 6 : 12 }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel" name="phone" value={phone}
              onChange={e => { setPhone(formatPhone(e.target.value)); setPhoneError(""); }}
              onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
              required style={inputStyle("phone", !!phoneError)} placeholder="(303) 555-0100"
            />
          </div>
          {phoneError && (
            <div style={{
              color: "#ef5350", fontSize: 10, marginBottom: 12, textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              ⚠ {phoneError}
            </div>
          )}

          {/* Date of Birth */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date" name="dob" value={dob}
              onChange={e => setDob(e.target.value)}
              onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)}
              required style={inputStyle("dob")}
            />
          </div>

          {/* Street Address */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Street Address</label>
            <input
              type="text" name="address" value={address}
              onChange={e => setAddress(e.target.value)}
              onFocus={() => setFocused("address")} onBlur={() => setFocused(null)}
              required style={inputStyle("address")} placeholder="1234 Main St"
            />
          </div>

          {/* City + State row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                type="text" name="city" value={city}
                onChange={e => setCity(e.target.value)}
                onFocus={() => setFocused("city")} onBlur={() => setFocused(null)}
                required style={inputStyle("city")} placeholder="Denver"
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <div style={{
                ...inputStyle("state-locked"),
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 52, color: accent, fontWeight: 700, fontSize: 13,
                cursor: "default", userSelect: "none",
              }}>
                CO
              </div>
            </div>
          </div>

          {/* Zip */}
          <div style={{ marginBottom: zipError ? 6 : 12 }}>
            <label style={labelStyle}>Zip Code</label>
            <input
              type="text" name="zip" value={zip}
              onChange={e => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipError(""); }}
              onFocus={() => setFocused("zip")} onBlur={() => setFocused(null)}
              required style={inputStyle("zip", !!zipError)} placeholder="80210"
              maxLength={5}
            />
          </div>
          {zipError && (
            <div style={{
              color: "#FFB74D", fontSize: 10, marginBottom: 12, textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
            }}>
              📍 {zipError}
            </div>
          )}

          {/* T-Shirt Size */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>T-Shirt Size</label>
            <div style={{ display: "flex", gap: 8 }}>
              {SHIRT_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setShirtSize(size)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: shirtSize === size ? `${accent}20` : "#131313",
                    border: `1px solid ${shirtSize === size ? accent : "#333"}`,
                    borderRadius: 8,
                    color: shirtSize === size ? accent : "#666",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: "all 0.15s",
                    boxShadow: shirtSize === size ? `0 0 0 2px ${accentGlow}` : "none",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Hidden required input for shirt size so form validation works */}
            <input type="hidden" name="shirt_size" value={shirtSize} required />
          </div>

          {submitError && (
            <div style={{
              color: "#ef5350", fontSize: 10, marginBottom: 12, textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              ⚠ {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !shirtSize}
            style={{
              width: "100%", padding: "13px",
              background: submitting || !shirtSize ? "#141414" : `linear-gradient(135deg, #4a7a22, #8BC34A)`,
              color: submitting || !shirtSize ? "#383838" : "#fff",
              border: submitting || !shirtSize ? "1px solid #222" : "none",
              borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              cursor: submitting || !shirtSize ? "not-allowed" : "pointer",
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5,
              boxShadow: submitting || !shirtSize ? "none" : `0 4px 24px ${accentGlow}`,
              transition: "all 0.25s",
            }}
          >
            {submitting ? "Submitting…" : "Claim My T-Shirt →"}
          </button>

          <button
            type="button"
            onClick={() => { localStorage.setItem(LS_FORM_SEEN, "true"); onSkip(); }}
            style={{
              width: "100%", padding: "10px",
              background: "transparent", color: "#777",
              border: "1px solid #333", borderRadius: 8,
              fontSize: 9, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5, textTransform: "uppercase",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            Decline the Spoils
          </button>
        </form>
      </div>
    </div>
  );
}
