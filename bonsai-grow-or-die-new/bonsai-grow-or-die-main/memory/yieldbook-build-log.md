# Bonsai Yieldbook — Phase 1 Build Log

**Date:** 2026-02-10
**Repo:** /root/.openclaw/workspace/bonsai-production-data
**Commit:** Phase 1 foundation (local only, not pushed)

## What Was Built

### 1. Branding & Design System
- Pulled colors from bonsaicultivation.com: green `#166533`, gold `#B1781E`, dark theme
- Fonts: Open Sans (body) + Montserrat (headings) — matching their site
- Downloaded logos: white logo (webp), full-color logo (png), icon (png)
- Tailwind theme with custom `bonsai-*` color tokens
- Gradient text utilities, glow effects, custom scrollbar

### 2. PWA Configuration
- `/public/manifest.json` — installable on mobile, standalone display
- `/public/sw.js` — service worker with cache-first for navigation
- Apple Web App meta tags for iOS install
- Theme color set to dark (#0a0a0a)

### 3. Pages Built
- **Login** (`/`) — Beautiful branded login with gradient background, Bonsai logo, "Yieldbook" subtitle. Placeholder auth stores to localStorage.
- **Dashboard** (`/dashboard`) — 4 stat cards (Weekly Production, Active Rooms, Strain Count, TIP Leader), Room Performance table with health bars, TIP Leaderboard with ranked trimmers, Strain Scorecards placeholder
- **Harvest Input** (`/harvest`) — Full form: room selector (8 rooms), strain selector, harvest date, plant count, METRC tag, wet/dry weights, yield breakdown (flower/smalls/trim/mold)
- **Trim Input** (`/trim`) — Trimmer name, date, lbs trimmed, hours worked. Side panel shows today's log with team totals.
- **Analytics** (`/analytics`) — 4 placeholder chart cards for future: Weekly Production Trend, Room Yield Comparison, Strain Performance, Trimmer Efficiency

### 4. Navigation
- **Mobile:** Fixed bottom nav bar with icons (Dashboard, Harvest, Trim, Analytics)
- **Desktop:** Sidebar with logo, nav items, user profile section, sign out
- Auth guard redirects to login if not authenticated

### 5. Database Schema (`supabase/schema.sql`)
- **13 tables:** profiles, rooms, strains, harvests, yields, plants, trimmer_production, environment_readings, feed_data, weekly_production
- **Enums:** user_role (admin/grower/trimmer/harvest_manager/trim_manager), plant_stage, room_type
- **Computed columns:** total_dry_equivalent_lbs, lbs_per_hour
- **RLS policies:** Trimmers only see their own data, managers/admins see all, everyone reads rooms/strains
- **8 default rooms** seeded (Room 1-6, Room LED, Room R&D)
- Updated_at triggers on key tables

### 6. Data Migration Script (`scripts/migrate-sheets-data.py`)
- Reads from all 3 Google Sheets via service account
- Extracts: harvests, strains, trimmer production, yield breakdowns, weekly aggregations
- Outputs SQL insert files to `supabase/seed-data/`
- Handles date parsing (multiple formats), safe number conversion
- Dry-run mode (default) and future Supabase push mode

## Tech Stack
- Next.js 16.1.6 + React 19
- Tailwind CSS 4 (inline theme)
- TypeScript
- Supabase PostgreSQL (schema only — no cloud connection yet)

## What's NOT Done (Phase 2+)
- Supabase cloud connection (no credentials yet)
- Real authentication (currently localStorage placeholder)
- Chart visualizations (Recharts or similar)
- Real-time data from Argus/Aroya APIs
- METRC API integration
- Push notifications
- Data export features
- Running the migration script (needs Sheets API access)

## How to Run
```bash
cd /root/.openclaw/workspace/bonsai-production-data
npm run dev
# Visit http://localhost:3000
# Enter any email/password to access dashboard
```
