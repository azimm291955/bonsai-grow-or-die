"use client";

import { useState } from "react";
import { getClaimAction, redeemClaimAction, getAllClaimsAction } from "@/app/actions/claims";
import type { ClaimRecord } from "@/app/actions/claims";

const ACCENT = "#8BC34A";
const mono = "'JetBrains Mono', monospace";

export default function AdminClaimsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  // Lookup state
  const [lookupCode, setLookupCode] = useState("");
  const [lookedUp, setLookedUp] = useState<ClaimRecord | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // Redeem state
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");

  // All claims state
  const [allClaims, setAllClaims] = useState<ClaimRecord[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Quick client-side gate — real auth happens server-side on every action
    if (password.trim().length < 1) {
      setAuthError("Enter password.");
      return;
    }
    setAuthed(true);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLookedUp(null);
    setRedeemMsg("");
    if (!lookupCode.trim()) return;
    setLookupLoading(true);
    const res = await getClaimAction(lookupCode);
    setLookupLoading(false);
    if (res.success) setLookedUp(res.claim);
    else setLookupError(res.error);
  };

  const handleRedeem = async () => {
    if (!lookedUp) return;
    setRedeemLoading(true);
    setRedeemMsg("");
    const res = await redeemClaimAction(lookedUp.code, password);
    setRedeemLoading(false);
    if (res.success) {
      setLookedUp({ ...lookedUp, redeemed: true, redeemedAt: new Date().toISOString() });
      setRedeemMsg("✓ Marked as redeemed.");
    } else {
      setRedeemMsg("✗ " + res.error);
    }
  };

  const handleLoadAll = async () => {
    setAllLoading(true);
    const res = await getAllClaimsAction(password);
    setAllLoading(false);
    if (res.success) setAllClaims(res.claims);
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

  // ── Auth wall ──
  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080808",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: mono, padding: 24,
      }}>
        <div style={{
          background: "#111", border: "1px solid #222",
          borderRadius: 16, padding: "36px 32px", maxWidth: 360, width: "100%",
        }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, marginBottom: 28, borderRadius: 1 }} />
          <div style={{ fontSize: 8, color: ACCENT, letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>Bonsai Cultivation</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", fontFamily: "'Cormorant Garamond', serif", marginBottom: 24 }}>
            Claims Admin
          </div>
          <form onSubmit={handleAuth}>
            <label style={{ fontSize: 8, color: "#666", letterSpacing: 2, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a",
                borderRadius: 8, padding: "10px 13px", color: "#e0e0e0",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: mono,
              }}
              autoFocus
            />
            {authError && <div style={{ color: "#ef5350", fontSize: 10, marginTop: 8 }}>{authError}</div>}
            <button type="submit" style={{
              marginTop: 16, width: "100%", padding: "11px",
              background: ACCENT, color: "#0a1a04",
              border: "none", borderRadius: 8, fontWeight: 700,
              fontSize: 11, cursor: "pointer", fontFamily: mono, letterSpacing: 1.5,
            }}>
              Enter →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main admin UI ──
  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      fontFamily: mono, padding: "40px 20px", color: "#e0e0e0",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, marginBottom: 32, borderRadius: 1 }} />

        <div style={{ fontSize: 8, color: ACCENT, letterSpacing: 3, marginBottom: 6, textTransform: "uppercase" }}>Bonsai Cultivation</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#e0e0e0", fontFamily: "'Cormorant Garamond', serif", marginBottom: 36 }}>
          Claims Admin
        </div>

        {/* ── Code Lookup ── */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "24px 24px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 8, color: "#555", letterSpacing: 2.5, marginBottom: 16, textTransform: "uppercase" }}>Look Up a Code</div>
          <form onSubmit={handleLookup} style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="BONSAI-XXXXXX"
              value={lookupCode}
              onChange={e => setLookupCode(e.target.value.toUpperCase())}
              style={{
                flex: 1, background: "#0d0d0d", border: "1px solid #2a2a2a",
                borderRadius: 8, padding: "10px 13px", color: "#e0e0e0",
                fontSize: 14, outline: "none", fontFamily: mono, letterSpacing: 2,
              }}
            />
            <button type="submit" disabled={lookupLoading} style={{
              padding: "10px 20px", background: ACCENT, color: "#0a1a04",
              border: "none", borderRadius: 8, fontWeight: 700,
              fontSize: 11, cursor: "pointer", fontFamily: mono, letterSpacing: 1, flexShrink: 0,
            }}>
              {lookupLoading ? "…" : "Look Up"}
            </button>
          </form>

          {lookupError && (
            <div style={{ marginTop: 14, color: "#ef5350", fontSize: 11 }}>✗ {lookupError}</div>
          )}

          {lookedUp && (
            <div style={{
              marginTop: 20, background: "#0d0d0d", border: `1px solid ${lookedUp.redeemed ? "#333" : `${ACCENT}30`}`,
              borderRadius: 10, padding: "18px 20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: ACCENT, fontFamily: mono }}>{lookedUp.code}</div>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                  padding: "4px 10px", borderRadius: 20,
                  background: lookedUp.redeemed ? "#222" : `${ACCENT}20`,
                  color: lookedUp.redeemed ? "#555" : ACCENT,
                  border: `1px solid ${lookedUp.redeemed ? "#333" : `${ACCENT}40`}`,
                  textTransform: "uppercase",
                }}>
                  {lookedUp.redeemed ? "Redeemed" : "Valid"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 11, marginBottom: 14 }}>
                <div><span style={{ color: "#555" }}>Name: </span><span style={{ color: "#ccc" }}>{lookedUp.name}</span></div>
                <div><span style={{ color: "#555" }}>Joints: </span><span style={{ color: "#ccc" }}>{lookedUp.jointCount}</span></div>
                <div><span style={{ color: "#555" }}>Email: </span><span style={{ color: "#ccc" }}>{lookedUp.email}</span></div>
                <div><span style={{ color: "#555" }}>Event: </span><span style={{ color: "#ccc" }}>{lookedUp.gameEvent}</span></div>
                <div><span style={{ color: "#555" }}>Phone: </span><span style={{ color: "#ccc" }}>{lookedUp.phone}</span></div>
                <div><span style={{ color: "#555" }}>Claimed: </span><span style={{ color: "#ccc" }}>{fmt(lookedUp.createdAt)}</span></div>
                {lookedUp.redeemed && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "#555" }}>Redeemed at: </span>
                    <span style={{ color: "#ccc" }}>{fmt(lookedUp.redeemedAt)}</span>
                  </div>
                )}
              </div>

              {!lookedUp.redeemed && (
                <button onClick={handleRedeem} disabled={redeemLoading} style={{
                  padding: "10px 22px",
                  background: `linear-gradient(135deg, #3d6b10, ${ACCENT})`,
                  color: "#0a1a04", border: "none", borderRadius: 8,
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                  fontFamily: mono, letterSpacing: 1.5,
                }}>
                  {redeemLoading ? "Marking…" : `Mark as Redeemed — ${lookedUp.jointCount} Joint${lookedUp.jointCount > 1 ? "s" : ""} →`}
                </button>
              )}
              {redeemMsg && (
                <div style={{ marginTop: 10, fontSize: 11, color: redeemMsg.startsWith("✓") ? ACCENT : "#ef5350" }}>
                  {redeemMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── All Claims ── */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 8, color: "#555", letterSpacing: 2.5, textTransform: "uppercase" }}>All Claims</div>
            <button onClick={handleLoadAll} disabled={allLoading} style={{
              padding: "7px 16px", background: "transparent",
              color: ACCENT, border: `1px solid ${ACCENT}40`,
              borderRadius: 6, fontSize: 9, cursor: "pointer", fontFamily: mono, letterSpacing: 1,
            }}>
              {allLoading ? "Loading…" : allClaims ? "Refresh" : "Load All"}
            </button>
          </div>

          {allClaims === null && (
            <div style={{ color: "#444", fontSize: 11, textAlign: "center", padding: "20px 0" }}>Click "Load All" to view every claim.</div>
          )}

          {allClaims && allClaims.length === 0 && (
            <div style={{ color: "#444", fontSize: 11, textAlign: "center", padding: "20px 0" }}>No claims yet.</div>
          )}

          {allClaims && allClaims.length > 0 && (
            <>
              <div style={{ marginBottom: 12, fontSize: 10, color: "#555" }}>
                {allClaims.length} total · {allClaims.filter(c => c.redeemed).length} redeemed · {allClaims.filter(c => !c.redeemed).length} pending
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allClaims.map(c => (
                  <div key={c.code} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#0d0d0d", borderRadius: 8,
                    border: `1px solid ${c.redeemed ? "#1a1a1a" : "#252525"}`,
                    padding: "10px 14px", flexWrap: "wrap",
                  }}>
                    <div style={{ fontWeight: 700, letterSpacing: 2, color: c.redeemed ? "#444" : ACCENT, fontSize: 12, minWidth: 130 }}>{c.code}</div>
                    <div style={{ flex: 1, fontSize: 11, color: c.redeemed ? "#555" : "#bbb", minWidth: 120 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{c.jointCount}J · {c.gameEvent}</div>
                    <div style={{
                      fontSize: 8, fontWeight: 700, padding: "3px 8px", borderRadius: 12,
                      background: c.redeemed ? "#1a1a1a" : `${ACCENT}15`,
                      color: c.redeemed ? "#444" : ACCENT,
                      border: `1px solid ${c.redeemed ? "#222" : `${ACCENT}30`}`,
                      letterSpacing: 1, textTransform: "uppercase",
                    }}>
                      {c.redeemed ? "Redeemed" : "Valid"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
