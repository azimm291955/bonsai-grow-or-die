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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "9px 11px",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: "#555",
    fontWeight: 700,
    letterSpacing: 1.5,
    display: "block",
    marginBottom: 4,
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#1a1a1a",
        border: `2px solid ${jointCount === 5 ? "rgba(255,183,77,0.4)" : "rgba(139,195,74,0.3)"}`,
        borderRadius: 16,
        padding: "28px 24px",
        maxWidth: 380,
        width: "100%",
        boxShadow: jointCount === 5
          ? "0 0 40px rgba(255,183,77,0.1)"
          : "0 0 40px rgba(139,195,74,0.08)",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {/* Space Jam logo */}
          <img
            src="/Space_Jam_Logo.png"
            alt="Space Jam Dispensary"
            style={{ width: 90, height: "auto", objectFit: "contain", marginBottom: 10 }}
          />
          <h2 style={{
            color: jointCount === 5 ? "#FFB74D" : "#8BC34A",
            fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: 1,
          }}>
            {jointCount === 5 ? "CLAIM YOUR 5 FREE JOINTS" : "CLAIM YOUR FREE JOINT"}
          </h2>
          <p style={{ color: "#888", fontSize: 11, marginTop: 8, lineHeight: 1.6, margin: "8px 0 0" }}>
            {jointCount === 5
              ? "You beat the game on a pure run — no vulture capital. Redeem 5 joints at Space Jam Dispensary."
              : "Thanks for playing Bonsai: Grow or Die! Redeem your free joint at Space Jam Dispensary."}
          </p>
          {/* Space Jam contact info */}
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <img src="/Space_Jam_Logo.png" alt="Space Jam Dispensary" style={{ width: 70, height: "auto", objectFit: "contain", marginBottom: 6 }} />
            <a
              href="https://www.google.com/maps/place/Space+Jam+Dispensary/@39.6836826,-104.9898433,594m"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#64B5F6", fontSize: 11, marginTop: 4, display: "block", textDecoration: "none" }}
            >
              📍 1810 S Broadway, Denver, CO 80210
            </a>
            <a
              href="tel:7209860882"
              style={{ color: "#64B5F6", fontSize: 11, marginTop: 2, display: "block", textDecoration: "none" }}
            >
              📞 (720) 986-0882
            </a>
          </div>
          <p style={{ color: "#555", fontSize: 10, marginTop: 8 }}>
            Must be 21+. Your info is used only for reward redemption.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          {/* Hidden fields */}
          <input type="hidden" name="joint_count" value={jointCount} />
          <input type="hidden" name="game_event" value={jointCount === 5 ? "win_pure" : "registration"} />

          {/* Full Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="jane@example.com"
            />
          </div>

          {/* Telephone (unique identifier) */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Telephone Number</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              style={inputStyle}
              placeholder="(303) 555-0100"
            />
          </div>

          {/* Date of Birth */}
          <div style={{ marginBottom: ageError ? 6 : 18 }}>
            <label style={labelStyle}>Date of Birth (must be 21+)</label>
            <input
              type="date"
              name="dob"
              value={dob}
              onChange={e => { setDob(e.target.value); setAgeError(""); }}
              required
              max={maxDob()}
              style={{
                ...inputStyle,
                border: `1px solid ${ageError ? "#ef5350" : "#2a2a2a"}`,
                colorScheme: "dark",
              }}
            />
          </div>

          {ageError && (
            <div style={{ color: "#ef5350", fontSize: 11, marginBottom: 14, textAlign: "center" }}>
              ⚠️ {ageError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={formState.submitting}
            style={{
              width: "100%",
              padding: "13px",
              background: jointCount === 5
                ? "linear-gradient(135deg, #E65100, #FFB74D)"
                : "linear-gradient(135deg, #33691E, #8BC34A)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: formState.submitting ? "wait" : "pointer",
              marginBottom: 10,
              opacity: formState.submitting ? 0.6 : 1,
              letterSpacing: 0.5,
              transition: "opacity 0.2s",
            }}
          >
            {formState.submitting
              ? "Submitting…"
              : jointCount === 5
                ? "🏆 Claim My 5 Free Joints"
                : "🌿 Claim My Free Joint"}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(LS_FORM_SEEN, "true");
              onSkip();
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              color: "#444",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 11,
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            Skip — play anonymous
          </button>
        </form>
      </div>
    </div>
  );
}
