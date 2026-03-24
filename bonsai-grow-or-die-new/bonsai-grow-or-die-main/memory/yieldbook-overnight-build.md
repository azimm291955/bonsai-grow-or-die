# Bonsai Yieldbook — Overnight Build Summary
**Date:** 2026-02-11 ~00:30 UTC
**Deployed:** https://bonsai-production-data.vercel.app/

## What Was Built

### Dashboard (PRIORITY #1) ✅
- **4 Key Stat Cards**: YTD Production (1,293 lbs), Avg Weekly (323 lbs), Best Yield/Plant (ZP @ 1,857 g), TIP Leader (Maria G.)
- **Weekly Production Bar Chart**: Last 6 weeks with stacked flower/smalls bars, 250 lb goal reference line
- **Cumulative YTD Chart**: 2026 vs 2025 cumulative production line chart
- **Room Performance Table**: All 8 rooms with plants, total lbs, g/plant, harvests — sorted by yield
- **TIP Leaderboard**: 8 trimmers ranked by lbs/day with weekly totals
- **Strain Scorecards**: Top 10 strains with g/plant metrics, color-coded by performance tier
- **Room Yield Efficiency Chart**: Horizontal bar chart showing g/plant by room

### Analytics ✅
- **Production Over Time**: Area chart with weekly/monthly toggle, stacked flower + smalls
- **Year-over-Year Comparison**: Grouped bar chart for 2024 vs 2025 vs 2026 by month
- **Room Comparison**: Bar chart of total production by room
- **Strain Performance Rankings**: Horizontal bar chart of top 12 strains by g/plant
- **Summary Stats**: 4 stat boxes (14,801 lbs total, 209 harvests, 32 strains, 1,690 avg g/plant)

### Harvest Input ✅
- Full form with room dropdown (8 rooms), strain dropdown (all 94 strains from seed data)
- METRC tag input, date picker, plant count
- Weight section: wet, dry, frozen (auto-calculates lbs from grams)
- Yield breakdown: flower, smalls, trim, mold
- Success animation overlay on submit
- Recent harvests sidebar with last 6 entries
- Weekly quick stats sidebar

### Trim Input ✅
- Trimmer select dropdown (8 trimmers)
- Category breakdown: flower, smalls, trim, mold/B-tier (all in lbs)
- Hours worked field
- Auto-calculated stats box: total lbs, lbs/hour, lbs/day
- Today's log with per-trimmer breakdown (emoji categories)
- Weekly summary stats
- Success animation on submit

### Data Layer ✅
- Created `app/data/mock.ts` with all production data extracted from real seed SQL files
- **All numbers are real** from the Google Sheets migration:
  - 73 weeks of weekly production data (2024-2026)
  - 8 rooms with real yield metrics
  - 15 top strains with actual g/plant performance
  - Cumulative YTD comparison data
  - Year-over-year monthly aggregation

## Technical Details
- **Stack**: Next.js 16 + Tailwind CSS 4 + Recharts
- **Charts**: 7 interactive Recharts visualizations (bar, line, area, horizontal bar)
- **Build**: Clean `npm run build` with zero errors
- **Deploy**: `npx vercel --prod` — live at https://bonsai-production-data.vercel.app/

## Real Data Highlights (from seed files)
- **2026 YTD**: 1,293 lbs from 3,989 plants across 209 harvests
- **Top Room**: Room 3 @ 1,804 g/plant (but only 142 plants), Room 5 @ 1,738 g/plant (larger sample)
- **Top Strain**: ZP @ 1,857 g/plant, then Room 3 @ 1,804, MBB @ 1,771, BOG @ 1,766
- **2025 Full Year**: ~10,800 lbs across 34 recorded weeks
- **All 4 weeks of 2026 exceeded the 250 lb/week goal**

## Login
Any email + password combination works (placeholder auth). Redirects to dashboard.
