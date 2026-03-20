"use client";

import { useState, useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";
import { formatCash, formatDate, getAMR, getQuarter, getAverageOverheadPerRoom,
  getYieldMultiplierForRoom, getPriceMultiplierForRoom, getPrerollPriceForRoom, msToGameDate } from "@/lib/helpers";
import { EXCISE_TAX_RATE, BROKER_FEE_RATE, BASE_YIELD_PER_HARVEST, MS_PER_GAME_DAY } from "@/lib/constants";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PnLTab() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  // Compute current game date
  const totalRealMs = Date.now() - state.gameStartRealMs;
  const totalGameDays = (totalRealMs / MS_PER_GAME_DAY) + (state.bonusGameDays || 0);
  const gd = msToGameDate(totalGameDays * MS_PER_GAME_DAY);
  const currentYear = gd.year;

  const allYears = useMemo(() => {
    const ys = new Set(state.monthlyPnL.map(e => e.year));
    return Array.from(ys).sort((a, b) => b - a);
  }, [state.monthlyPnL]);

  // FIX: Real useState (was broken `const [x,y] = [val, null]` in original)
  const [pnlViewYear, setPnlViewYear] = useState<number | "cumulative">(currentYear);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const activeRoomCount = state.rooms.filter(r => r.unlocked).length;
  const overhead = getAverageOverheadPerRoom(gd.year, state.upgrades, state.rooms);

  // Build per-year data
  const yearlyData = useMemo(() => {
    const map: Record<number, {
      harvestRevenue: number; preroll: number; revenue: number;
      overhead: number; net: number; months: number; cashEnd: number;
      monthlyRows: typeof state.monthlyPnL;
    }> = {};
    for (const entry of state.monthlyPnL) {
      if (!map[entry.year]) {
        map[entry.year] = { harvestRevenue: 0, preroll: 0, revenue: 0, overhead: 0, net: 0, months: 0, cashEnd: 0, monthlyRows: [] };
      }
      const y = map[entry.year];
      y.harvestRevenue += entry.harvestRevenue || 0;
      y.preroll += entry.preroll || 0;
      y.revenue += (entry.harvestRevenue || 0) + (entry.preroll || 0);
      y.overhead += entry.overhead || 0;
      y.net += entry.net || 0;
      y.months += 1;
      y.cashEnd = entry.cash || entry.cashEnd || 0;
      y.monthlyRows.push(entry);
    }
    return map;
  }, [state.monthlyPnL]);

  // Cumulative totals
  const cumulative = useMemo(() => ({
    harvestRevenue: state.totalWholesaleRevenue || 0,
    preroll: state.totalPrerollRevenue || 0,
    revenue: state.totalRevenue || 0,
    overhead: state.totalCosts || 0,
    net: state.totalRevenue - state.totalCosts,
    lbsProduced: state.totalLbsProduced || 0,
  }), [state.totalWholesaleRevenue, state.totalPrerollRevenue, state.totalRevenue, state.totalCosts, state.totalLbsProduced]);

  // Selected year data
  const selectedData = pnlViewYear === "cumulative"
    ? null
    : (yearlyData[pnlViewYear] || { harvestRevenue: 0, preroll: 0, revenue: 0, overhead: 0, net: 0, months: 0, cashEnd: state.cash, monthlyRows: [] });

  // Reference flower room for yield projections
  const refFlower = state.rooms.find(r => r.unlocked && r.type === "flower");
  const yieldLbs = refFlower ? Math.round(BASE_YIELD_PER_HARVEST * getYieldMultiplierForRoom(state.upgrades, refFlower.index)) : BASE_YIELD_PER_HARVEST;
  const sellPrice = refFlower ? Math.round(getAMR(gd.year, getQuarter(gd.month)) * getPriceMultiplierForRoom(state.upgrades, refFlower.index)) : Math.round(getAMR(gd.year, getQuarter(gd.month)));
  // Net instant payout: gross - broker - excise. Pre-roll from trim is added.
  const grossPerHarvest = yieldLbs * sellPrice;
  const brokerPerHarvest = Math.round(grossPerHarvest * BROKER_FEE_RATE);
  const excisePerHarvest = Math.round(grossPerHarvest * EXCISE_TAX_RATE);
  const trimLbs = Math.round(yieldLbs * 0.33);
  const prerollPrice = refFlower ? getPrerollPriceForRoom(state.upgrades, refFlower.index) : 0;
  const prerollPerHarvest = trimLbs * prerollPrice;
  const wholesaleNet = Math.round((grossPerHarvest - brokerPerHarvest - excisePerHarvest) * (1 - state.vcRevenuePenalty));
  const prerollNet = Math.round(prerollPerHarvest * (1 - state.vcRevenuePenalty));
  const netPerHarvest = wholesaleNet + prerollNet;

  const LedgerRow = ({
    label, amount, indent = false, bold = false, color, dashed = false,
  }: {
    label: string; amount: number | string; indent?: boolean; bold?: boolean; color?: string; dashed?: boolean;
  }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: `${bold ? 6 : 3}px 0`,
      paddingLeft: indent ? 16 : 0,
      borderTop: dashed ? "1px dashed rgba(255,255,255,0.06)" : undefined,
    }}>
      <span style={{ fontSize: bold ? 13 : 12, color: bold ? "#ccc" : "#888", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{
        fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 500,
        color: color || (typeof amount === "number" ? (amount > 0 ? "#8BC34A" : amount < 0 ? "#ef5350" : "#666") : "#ccc"),
        fontFamily: "var(--font-mono)",
      }}>
        {typeof amount === "string" ? amount : formatCash(amount)}
      </span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#ccc", letterSpacing: 1 }}>INCOME STATEMENT</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>Bonsai Cultivation · {formatDate(gd)}</div>
        </div>
        <div style={{ fontSize: 10, color: "#555", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
          FY {currentYear}
        </div>
      </div>

      {/* Two-column layout: Year selector + Cumulative */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* LEFT: Year selector & breakdown */}
        <div style={{ flex: "1 1 260px" }}>
          {/* Year dropdown */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 4 }}>
              VIEW YEAR
            </label>
            <select
              value={pnlViewYear}
              onChange={e => setPnlViewYear(e.target.value === "cumulative" ? "cumulative" : Number(e.target.value))}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#ccc", fontSize: 13, padding: "6px 10px", cursor: "pointer",
              }}
            >
              {allYears.map(y => (
                <option key={y} value={y} style={{ background: "#1a1a1a" }}>FY {y}{y === currentYear ? " (current)" : ""}</option>
              ))}
              <option value="cumulative" style={{ background: "#1a1a1a" }}>All Time (Cumulative)</option>
            </select>
          </div>

          {/* Income statement for selected year */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "14px 14px", marginBottom: 12 }}>
            {pnlViewYear === "cumulative" ? (
              <>
                <div style={{ fontSize: 10, color: "#8BC34A", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>ALL TIME REVENUE</div>
                <LedgerRow label="Wholesale Flower (Total)" amount={cumulative.harvestRevenue} indent />
                <LedgerRow label="Pre-Roll Sales (Total)" amount={cumulative.preroll} indent />
                {state.vcTaken && <LedgerRow label="VC Revenue Penalty (−15%)" amount={`applied`} indent color="#ef5350" />}
                <div style={{ borderTop: "1px solid rgba(139,195,74,0.2)", marginTop: 6, paddingTop: 6 }}>
                  <LedgerRow label="Total Revenue" amount={cumulative.revenue} bold color="#8BC34A" />
                </div>
                <div style={{ fontSize: 10, color: "#ef5350", fontWeight: 700, letterSpacing: 2, marginTop: 14, marginBottom: 8 }}>ALL TIME EXPENSES</div>
                <LedgerRow label="Total Overhead Paid" amount={-cumulative.overhead} indent />
                <LedgerRow label="Room Purchases" amount={-(state.totalSpentOnRooms || 0)} indent />
                <LedgerRow label="Upgrades Purchased" amount={-(state.totalSpentOnUpgrades || 0)} indent />
                <div style={{ borderTop: "1px solid rgba(239,83,80,0.2)", marginTop: 6, paddingTop: 6 }}>
                  <LedgerRow label="Net Cash Position" amount={cumulative.net} bold color={cumulative.net >= 0 ? "#8BC34A" : "#ef5350"} />
                </div>
              </>
            ) : selectedData ? (
              <>
                <div style={{ fontSize: 10, color: "#8BC34A", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>FY {pnlViewYear} REVENUE</div>
                <LedgerRow label="Wholesale Flower" amount={selectedData.harvestRevenue} indent />
                <LedgerRow label="Pre-Roll Sales" amount={selectedData.preroll} indent />
                <div style={{ borderTop: "1px solid rgba(139,195,74,0.2)", marginTop: 6, paddingTop: 6 }}>
                  <LedgerRow label="Total Revenue" amount={selectedData.revenue} bold color="#8BC34A" />
                </div>
                <div style={{ fontSize: 10, color: "#ef5350", fontWeight: 700, letterSpacing: 2, marginTop: 14, marginBottom: 8 }}>FY {pnlViewYear} EXPENSES</div>
                <LedgerRow label={`Facility Overhead (${activeRoomCount} rooms)`} amount={-selectedData.overhead} indent />
                <div style={{ borderTop: "1px solid rgba(239,83,80,0.2)", marginTop: 6, paddingTop: 6 }}>
                  <LedgerRow label="Net Income" amount={selectedData.net} bold color={selectedData.net >= 0 ? "#8BC34A" : "#ef5350"} />
                </div>
                <LedgerRow label="Cash End of Year" amount={selectedData.cashEnd} color="#FFB74D" />

                {/* Monthly breakdown table */}
                {selectedData.monthlyRows.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => setExpandedSection(expandedSection === "monthly" ? null : "monthly")}
                      style={{ background: "none", border: "none", color: "#555", fontSize: 10, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.1)" }}
                    >
                      {expandedSection === "monthly" ? "▾" : "▸"} Monthly breakdown
                    </button>
                    {expandedSection === "monthly" && (
                      <div style={{ marginTop: 8, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                          <thead>
                            <tr style={{ color: "#555" }}>
                              <th style={{ textAlign: "left", padding: "3px 0", fontWeight: 700 }}>Month</th>
                              <th style={{ textAlign: "right", padding: "3px 4px", fontWeight: 700 }}>Rev</th>
                              <th style={{ textAlign: "right", padding: "3px 4px", fontWeight: 700 }}>OH</th>
                              <th style={{ textAlign: "right", padding: "3px 0", fontWeight: 700 }}>Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedData.monthlyRows.map((row, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "3px 0", color: "#888" }}>{MONTH_NAMES[row.month - 1]}</td>
                                <td style={{ textAlign: "right", padding: "3px 4px", color: "#8BC34A", fontFamily: "var(--font-mono)" }}>
                                  {formatCash((row.harvestRevenue || 0) + (row.preroll || 0))}
                                </td>
                                <td style={{ textAlign: "right", padding: "3px 4px", color: "#ef5350", fontFamily: "var(--font-mono)" }}>
                                  {formatCash(-row.overhead)}
                                </td>
                                <td style={{ textAlign: "right", padding: "3px 0", color: row.net >= 0 ? "#8BC34A" : "#ef5350", fontFamily: "var(--font-mono)" }}>
                                  {formatCash(row.net)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 20 }}>No data for this year yet.</div>
            )}
          </div>

          {/* Per-harvest projection */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#FFB74D", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>PER HARVEST PROJECTION</div>
            <LedgerRow label={`Wholesale (${yieldLbs} lbs × $${sellPrice}/lb)`} amount={grossPerHarvest} indent />
            <LedgerRow label={`Broker Fee (${Math.round(BROKER_FEE_RATE * 100)}%)`} amount={-brokerPerHarvest} indent />
            <LedgerRow label={`Excise Tax (${Math.round(EXCISE_TAX_RATE * 100)}%)`} amount={-excisePerHarvest} indent />
            {prerollNet > 0 && <LedgerRow label={`Pre-Roll (${trimLbs} lbs trim × $${prerollPrice})`} amount={prerollNet} indent color="#CE93D8" />}
            {state.vcRevenuePenalty > 0 && <LedgerRow label="VC Penalty (−15%)" amount={-Math.round((grossPerHarvest - brokerPerHarvest - excisePerHarvest + prerollPerHarvest) * state.vcRevenuePenalty)} indent color="#ef5350" />}
            <div style={{ borderTop: "1px solid rgba(255,183,77,0.2)", marginTop: 6, paddingTop: 6 }}>
              <LedgerRow label="Net Payout" amount={netPerHarvest} bold color="#FFB74D" />
            </div>
          </div>
        </div>

        {/* RIGHT: Cumulative lifetime stats (always visible) */}
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ background: "rgba(255,183,77,0.04)", borderRadius: 12, border: "1px solid rgba(255,183,77,0.1)", padding: "14px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#FFB74D", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>LIFETIME TOTALS</div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: "#666" }}>Total Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#8BC34A", marginTop: 2, fontFamily: "var(--font-mono)" }}>{formatCash(cumulative.revenue)}</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#555" }}>Wholesale</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#8BC34A", fontFamily: "var(--font-mono)" }}>{formatCash(cumulative.harvestRevenue)}</div>
              </div>
              {cumulative.preroll > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: "#555" }}>Pre-Roll</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#CE93D8", fontFamily: "var(--font-mono)" }}>{formatCash(cumulative.preroll)}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#666" }}>Total Overhead Paid</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ef5350", marginTop: 2, fontFamily: "var(--font-mono)" }}>{formatCash(-cumulative.overhead)}</div>
            </div>
            <div style={{ marginBottom: 8, borderTop: "1px solid rgba(255,183,77,0.1)", paddingTop: 8 }}>
              <div style={{ fontSize: 10, color: "#666" }}>Net Position</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: cumulative.net >= 0 ? "#8BC34A" : "#ef5350", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                {formatCash(cumulative.net)}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#666" }}>Lbs Produced</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#CE93D8", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                {(cumulative.lbsProduced).toLocaleString()} lbs
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#666" }}>Cash on Hand</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FFB74D", marginTop: 2, fontFamily: "var(--font-mono)" }}>{formatCash(state.cash)}</div>
            </div>
          </div>

          {/* Overhead breakdown */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#ef5350", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>MONTHLY OH / ROOM</div>
            {[
              { label: "Rent", value: overhead.rent },
              { label: "Electricity", value: overhead.electricity },
              { label: "Labor", value: overhead.labor },
              { label: "Nutrients & CO₂", value: overhead.nutrients },
              { label: "License & Compliance", value: overhead.license },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
                <span style={{ fontSize: 11, color: "#888", fontFamily: "var(--font-mono)" }}>{formatCash(value)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(239,83,80,0.2)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#ccc", fontWeight: 700 }}>Total / Room</span>
              <span style={{ fontSize: 13, color: "#ef5350", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{formatCash(overhead.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini chart — last 12 months */}
      {state.monthlyPnL.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", marginTop: 12 }}>
          <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>LAST 12 MONTHS</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
            {state.monthlyPnL.slice(-12).map((m, i) => {
              const rev = (m.harvestRevenue || 0) + (m.preroll || 0);
              const chartMax = Math.max(...state.monthlyPnL.slice(-12).map(x => Math.max(x.overhead, (x.harvestRevenue || 0) + (x.preroll || 0))), 1);
              const revH = Math.max(2, (rev / chartMax) * 56);
              const ohH = Math.max(2, (m.overhead / chartMax) * 56);
              return (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, justifyContent: "center" }} title={`${MONTH_NAMES[m.month - 1]} ${m.year}\nRev: ${formatCash(rev)}\nOH: ${formatCash(m.overhead)}`}>
                  <div style={{ width: "45%", height: revH, background: "rgba(139,195,74,0.6)", borderRadius: "2px 2px 0 0" }} />
                  <div style={{ width: "45%", height: ohH, background: "rgba(239,83,80,0.5)", borderRadius: "2px 2px 0 0" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, background: "rgba(139,195,74,0.6)", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: "#555" }}>Revenue</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, background: "rgba(239,83,80,0.5)", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: "#555" }}>Overhead</span>
            </div>
          </div>
        </div>
      )}
      {/* ── HARVEST LOG ── */}
      {state.harvestLog && state.harvestLog.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", marginTop: 12 }}>
          <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
            HARVEST RECEIPTS ({state.harvestLog.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...state.harvestLog].reverse().map((entry, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "8px 10px",
                background: "rgba(139,195,74,0.04)",
                border: "1px solid rgba(139,195,74,0.1)",
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 9, color: "#8BC34A", fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap", paddingTop: 1, minWidth: 52, fontFamily: "var(--font-mono)" }}>
                  {entry.gameDateLabel}
                </div>
                <div style={{ fontSize: 10, color: "#888", lineHeight: 1.55, flex: 1 }}>
                  {entry.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
