"use client";

import { useState, useEffect } from "react";
import { createClaimAction, getClaimStatusAction } from "@/app/actions/claims";

// ─── localStorage keys ───
export const LS_FORM_SEEN = "bonsai:form_seen";
export const LS_FORM_DATA = "bonsai:form_data"; // JSON: { name, email, phone }
export const LS_WIN_SUBMITTED = "bonsai:win_submitted";

export interface SavedFormData {
  name: string;
  email: string;
  phone: string;
}

/** Calculate age in years from a date string like "1990-05-20" */
function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Format a phone number string to (XXX) XXX-XXXX as the user types */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Max allowable DOB = 21 years ago today */
function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().split("T")[0];
}

interface Props {
  /** 1 = registered during gameplay (Mar 1 popup); 5 = won a pure run */
  jointCount: 1 | 5;
  onSkip: () => void;
  onSuccess: () => void;
}

export default function DataCollectionModal({ jointCount, onSkip, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [ageError, setAgeError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Check if registration is still open ──
  const [regStatus, setRegStatus] = useState<"loading" | "open" | "deadline" | "capacity">("loading");
  const [claimCount, setClaimCount] = useState<number>(0);
  const [claimCapacity] = useState<number>(2000);
  useEffect(() => {
    getClaimStatusAction().then(({ isOpen, reason, count, capacity: cap }) => {
      setRegStatus(isOpen ? "open" : (reason ?? "deadline"));
      setClaimCount(count);
      if (cap) setClaimCount(count); // capacity is constant, keep as 2000
    });
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setPhoneError("Enter a valid 10-digit US phone number.");
      return;
    }
    setPhoneError("");
    if (calcAge(dob) < 21) {
      setAgeError("You must be 21 or older to claim your reward.");
      return;
    }
    setAgeError("");
    setSubmitError(null);
    setSubmitting(true);

    try {
      // 1. Generate claim code first (also handles phone deduplication)
      const claimResult = await createClaimAction({
        name,
        email,
        phone,
        jointCount,
        gameEvent: jointCount === 5 ? "win_pure" : "registration",
      });

      if (!claimResult.success) {
        setSubmitError("Couldn't generate a claim code. Try again or visit Space Jam directly.");
        setSubmitting(false);
        return;
      }

      const code = claimResult.code;

      // 2. POST to Formspree with claim_code included so the email template fills in
      const body = new FormData();
      body.append("name", name);
      body.append("email", email);
      body.append("phone", phone);
      body.append("dob", dob);
      body.append("joint_count", String(jointCount));
      body.append("game_event", jointCount === 5 ? "win_pure" : "registration");
      body.append("claim_code", code);

      await fetch("https://formspree.io/f/xwvwqwqo", {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });

      // 3. Persist to localStorage and show the code
      localStorage.setItem(LS_FORM_SEEN, "true");
      localStorage.setItem(LS_FORM_DATA, JSON.stringify({ name, email, phone }));
      if (jointCount === 5) localStorage.setItem(LS_WIN_SUBMITTED, "true");

      setClaimCode(code);
    } catch {
      setSubmitError("Network error — check your connection and try again.");
    }

    setSubmitting(false);
  };

  // ── Claim code success screen ──
  if (claimCode) {
    const isPureCode = jointCount === 5;
    const accentCode = isPureCode ? "#D4871A" : "#7AAB3A";
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
          border: `1px solid ${accentCode}28`,
          borderRadius: 20,
          maxWidth: 390,
          width: "100%",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8)`,
          overflow: "hidden",
          textAlign: "center",
          margin: "auto 0",
          flexShrink: 0,
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${accentCode} 30%, ${accentCode} 70%, transparent 100%)` }} />
          <div style={{ padding: "36px 28px 32px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: accentCode,
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
              {isPureCode ? "Five Penny Joints Claimed" : "One Penny Joint Claimed"}
            </h2>

            {/* The code itself */}
            <div style={{
              background: `${accentCode}10`,
              border: `1px solid ${accentCode}40`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: 6,
                color: accentCode,
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
              Write this down or screenshot it. Bring it to Space Jam Dispensary{" "}
              <span style={{ color: accentCode }}>04/24 – 04/30/2026</span> to collect your{" "}
              {isPureCode ? "five penny joints" : "penny joint"}.
            </p>
            <p style={{
              color: "#555", fontSize: 9, lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', monospace",
              margin: "0 0 24px",
            }}>
              📍 1810 S Broadway, Denver, CO 80210
            </p>

            {submitError && (
              <p style={{ color: "#ef5350", fontSize: 10, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>
                {submitError}
              </p>
            )}

            <button
              onClick={onSuccess}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, ${isPureCode ? "#b86812" : "#4a7a22"}, ${isPureCode ? "#F09830" : "#8BC34A"})`,
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
    const closedAccent = "#7AAB3A";
    const closedMsg = regStatus === "deadline"
      ? { headline: "Contest Closed", body: "The Bonsai: Grow or Die contest ended at midnight on 4/20/2026. Thank you for playing!" }
      : { headline: "Sold Out", body: "All 2,000 penny joints have been claimed. Thank you for playing — the hunt was real." };
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(4,4,4,0.92)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", backdropFilter: "blur(8px)",
      }}>
        <div style={{
          background: "linear-gradient(160deg, #141414 0%, #0f0f0f 100%)",
          border: `1px solid ${closedAccent}28`,
          borderRadius: 20, maxWidth: 390, width: "100%",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.8)",
          overflow: "hidden", textAlign: "center",
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${closedAccent} 30%, ${closedAccent} 70%, transparent 100%)` }} />
          <div style={{ padding: "40px 28px 36px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{regStatus === "capacity" ? "🌿" : "🏁"}</div>
            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: closedAccent,
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

  const isPure = jointCount === 5;
  const accent = isPure ? "#D4871A" : "#7AAB3A";
  const accentGlow = isPure ? "rgba(212,135,26,0.18)" : "rgba(122,171,58,0.18)";
  const shimmerClass = isPure ? "shimmer-text" : "shimmer-text-green";
  const btnFrom = isPure ? "#b86812" : "#4a7a22";
  const btnTo   = isPure ? "#F09830" : "#8BC34A";

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
            src="/Space_Jam_Logo.png"
            alt="Space Jam Dispensary"
            style={{ width: 72, height: "auto", objectFit: "contain", display: "block", margin: "0 auto 16px" }}
          />

          <div style={{
            fontSize: 8, letterSpacing: 3.5, color: accent,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 10, textTransform: "uppercase",
          }}>
            {isPure ? "Winner, Winner, 4/20 Dinner" : "Player Registration"}
          </div>

          <h2 className={shimmerClass} style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 30, fontWeight: 700, margin: "0 0 12px",
            letterSpacing: 0.5, lineHeight: 1.1,
          }}>
            {isPure ? "Claim Five Penny Joints" : "Claim Your Penny Joint"}
          </h2>

          {/* Prestige / capacity badge */}
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
            {isPure
              ? "You beat the game on a pure run — no vulture capital."
              : "Thanks for playing Bonsai: Grow or Die!"}
          </p>

          {/* Contest rules */}
          <div style={{
            background: `${accent}0d`,
            border: `1px solid ${accent}22`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            textAlign: "left",
          }}>
            {isPure ? (
              <p style={{
                color: "#b0b0b0", fontSize: 10, lineHeight: 1.75,
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
              }}>
                <span style={{ color: accent, fontWeight: 700 }}>DECADE OF DOMINANCE.</span>{" "}
                You survived ten years of market crashes and pricing cliffs that wiped out the competition.
                Bonsai Cultivation has lived this same grind, and while the work never stops, it is time to celebrate your empire.
                Head to Space Jam Dispensary on{" "}
                <span style={{ color: accent, fontWeight: 700 }}>04/24 – 04/30/2026</span>{" "}
                to claim your victory joints!
              </p>
            ) : (
              <p style={{
                color: "#b0b0b0", fontSize: 10, lineHeight: 1.75,
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
              }}>
                <span style={{ color: accent, fontWeight: 700 }}>The race to 4/20 is on!</span> You&apos;ve unlocked one penny joint for joining the hunt! Now, finish the job: beat the game by{" "}
                <span style={{ color: accent, fontWeight: 700 }}>April 20th</span> to claim four more for a total of five joints. All prizes can be collected in person at Space Jam Dispensary{" "}
                <span style={{ color: accent, fontWeight: 700 }}>April 24th – April 30th</span>.
              </p>
            )}
          </div>

          {/* Dispensary card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 14px",
            background: `${accent}0c`,
            border: `1px solid ${accent}20`,
            borderRadius: 10,
            textAlign: "left",
            marginBottom: 14,
          }}>
            <img src="/Space_Jam_Logo.png" alt="Space Jam" style={{
              width: 42, height: 42, objectFit: "contain", flexShrink: 0, display: "block",
            }} />
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#bbb", marginBottom: 4,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Space Jam Dispensary
              </div>
              <a
                href="https://www.google.com/maps/place/Space+Jam+Dispensary/@39.6836826,-104.9898433,594m"
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#4d8ab5", fontSize: 10, display: "block", textDecoration: "none", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}
              >
                📍 1810 S Broadway, Denver, CO 80210
              </a>
              <a
                href="tel:7209860882"
                style={{ color: "#4d8ab5", fontSize: 10, display: "block", textDecoration: "none", fontFamily: "'JetBrains Mono', monospace" }}
              >
                📞 (720) 986-0882
              </a>
            </div>
          </div>

          <p style={{
            color: "#ff2222", fontSize: 9, margin: 0,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
          }}>
            MUST BE 21+
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: "0 26px 26px" }}>
          <input type="hidden" name="joint_count" value={jointCount} />
          <input type="hidden" name="game_event" value={isPure ? "win_pure" : "registration"} />

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" name="name" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
              required style={inputStyle("name")} placeholder="Jane Doe"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" name="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              required style={inputStyle("email")} placeholder="jane@example.com"
            />
          </div>

          <div style={{ marginBottom: phoneError ? 6 : 12 }}>
            <label style={labelStyle}>Telephone Number</label>
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

          <div style={{ marginBottom: ageError ? 6 : 20 }}>
            <label style={labelStyle}>Date of Birth (must be 21+)</label>
            <input
              type="date" name="dob" value={dob}
              onChange={e => { setDob(e.target.value); setAgeError(""); }}
              onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)}
              required max={maxDob()}
              style={inputStyle("dob", !!ageError)}
            />
          </div>

          {ageError && (
            <div style={{
              color: "#ef5350", fontSize: 10, marginBottom: 16, textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              ⚠ {ageError}
            </div>
          )}

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
            disabled={submitting}
            style={{
              width: "100%", padding: "13px",
              background: submitting ? "#141414" : `linear-gradient(135deg, ${btnFrom}, ${btnTo})`,
              color: submitting ? "#383838" : "#fff",
              border: submitting ? "1px solid #222" : "none",
              borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5,
              boxShadow: submitting ? "none" : `0 4px 24px ${accentGlow}`,
              transition: "all 0.25s",
            }}
          >
            {submitting ? "Submitting…" : isPure ? "Claim Five Penny Joints →" : "Claim My Penny Joint →"}
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
            {isPure ? "Decline the Spoils" : "Skip — play anonymous"}
          </button>
        </form>
      </div>
    </div>
  );
}
