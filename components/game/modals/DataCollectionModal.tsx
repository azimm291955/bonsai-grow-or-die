"use client";

import { useEffect, useState } from "react";
import { useForm } from "@formspree/react";

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
  const [formState, handleSubmit] = useForm("xwvwqwqo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [ageError, setAgeError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  // When Formspree confirms success, persist data and notify parent
  useEffect(() => {
    if (!formState.succeeded) return;
    localStorage.setItem(LS_FORM_SEEN, "true");
    localStorage.setItem(LS_FORM_DATA, JSON.stringify({ name, email, phone }));
    if (jointCount === 5) localStorage.setItem(LS_WIN_SUBMITTED, "true");
    onSuccess();
  }, [formState.succeeded]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (calcAge(dob) < 21) {
      setAgeError("You must be 21 or older to claim your reward.");
      return;
    }
    setAgeError("");
    handleSubmit(e);
  };

  const isPure = jointCount === 5;
  const accent = isPure ? "#D4871A" : "#7AAB3A";
  const accentGlow = isPure ? "rgba(212,135,26,0.18)" : "rgba(122,171,58,0.18)";
  const shimmerClass = isPure ? "shimmer-text" : "shimmer-text-green";
  const btnFrom = isPure ? "#b86812" : "#4a7a22";
  const btnTo   = isPure ? "#F09830" : "#8BC34A";

  const inputStyle = (field: string, isError = false): React.CSSProperties => ({
    width: "100%",
    background: focused === field ? "rgba(255,255,255,0.03)" : "#0b0b0b",
    border: `1px solid ${isError ? "#ef5350" : focused === field ? accent : "#1e1e1e"}`,
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
    color: "#383838",
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
        position: "relative",
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
            {isPure ? "Pure Run Reward" : "Player Registration"}
          </div>

          <h2 className={shimmerClass} style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 30, fontWeight: 700, margin: "0 0 10px",
            letterSpacing: 0.5, lineHeight: 1.1,
          }}>
            {isPure ? "Claim Five Free Joints" : "Claim Your Free Joint"}
          </h2>

          <p style={{
            color: "#4a4a4a", fontSize: 11, lineHeight: 1.7,
            fontFamily: "'JetBrains Mono', monospace",
            margin: "0 0 18px",
          }}>
            {isPure
              ? "You beat the game on a pure run — no vulture capital."
              : "Thanks for playing Bonsai: Grow or Die!"}
          </p>

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
            color: "#2a2a2a", fontSize: 9, margin: 0,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
          }}>
            MUST BE 21+ · INFO USED ONLY FOR REWARD REDEMPTION
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

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Telephone Number</label>
            <input
              type="tel" name="phone" value={phone}
              onChange={e => setPhone(e.target.value)}
              onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
              required style={inputStyle("phone")} placeholder="(303) 555-0100"
            />
          </div>

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

          <button
            type="submit"
            disabled={formState.submitting}
            style={{
              width: "100%", padding: "13px",
              background: formState.submitting ? "#141414" : `linear-gradient(135deg, ${btnFrom}, ${btnTo})`,
              color: formState.submitting ? "#383838" : "#fff",
              border: formState.submitting ? "1px solid #222" : "none",
              borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              cursor: formState.submitting ? "wait" : "pointer",
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5,
              boxShadow: formState.submitting ? "none" : `0 4px 24px ${accentGlow}`,
              transition: "all 0.25s",
            }}
          >
            {formState.submitting ? "Submitting…" : isPure ? "Claim Five Joints →" : "Claim My Joint →"}
          </button>

          <button
            type="button"
            onClick={() => { localStorage.setItem(LS_FORM_SEEN, "true"); onSkip(); }}
            style={{
              width: "100%", padding: "10px",
              background: "transparent", color: "#2c2c2c",
              border: "1px solid #181818", borderRadius: 8,
              fontSize: 9, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5, textTransform: "uppercase",
              transition: "color 0.2s",
            }}
          >
            Skip — play anonymous
          </button>
        </form>
      </div>
    </div>
  );
}
