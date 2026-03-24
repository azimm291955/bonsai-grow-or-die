# memory/cultivation.md — Cultivation Domain Knowledge
*Load this file when: analyzing production data, discussing metrics, comparing benchmarks, working with Sheets data*

---

## Bonsai Cultivation Rooms
- Room 1, Room 2, Room 3, Room 4, Room 5, Room 6, Room LED, Room R&D

Used across production reports and Yieldbook. May expand in future.

---

## Primary Success Metric: Grams per Square Foot
**g/sq ft is the BEST metric of success in a cultivation facility.**

- Measures dried yield against flowering canopy square footage
- Constant denominator (canopy size stays the same) — easy comparison over time
- Industry standard for benchmarking

**Formula:** `Total dried yield (grams) ÷ Flowering canopy square footage = g/sq ft`

⚠️ **UNRESOLVED:** What counts as "yield" in this metric?
- Industry says "dry flower" or "primary and secondary bud"
- Unclear if this includes Flower only, Flower + Smalls, or all yield including trim
- Bonsai tracks all 3 separately (Flower, Smalls, Trim)
- **Resolve before benchmarking against industry standards**

### Industry Benchmarks
| Tier | g/sq ft | lbs/sq ft |
|------|---------|-----------|
| Startups/Basic | 35 | 0.077 |
| Established | 50–70 | 0.110–0.154 |
| Elite | 100+ | 0.220+ |
| Industry average | ~39.5 | ~0.087 |

**Standard conversion:** Always divide grams by 453 to get lbs. Used everywhere.

**Sources:** Greenhouse Grower (Ryan Douglas, Dec 2022), Next Big Crop (Jan 2025), Cannabis Business Times

---

## Other Metrics Tracked
- **Grams per watt** — lighting efficiency
- **Grams per kWh** — total energy consumption
- **Wet to dry ratio** — typically 20–25%
- **GWBP** — tracked in Harvest Sheet (Grams per... verify definition)
- **Conversion Rate** — tracked in Trimmer Tracker
- **BD count** — tracked per trimmer

---

## Process Changes Log

### Trimming Efficiency Push (2026-02-10)
- Efficiency push started Tuesday 2026-02-10
- Expected impact: increase in smalls production
- **Use as benchmark date** when comparing pre/post smalls data

---

## Yieldbook Data Formula
`Dry Equivalent LBS = Buds + (Frozen LBS × 15%)`

Weekly goal: **250 lbs/week**
Week 0 (first week of 2026): 100 lbs (partial week — 2 days × 50)
Cumulative goal: `100 + (week_number × 250)`
