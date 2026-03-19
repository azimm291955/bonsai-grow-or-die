# memory/projects.md — Project Details
*Load this file when: discussing any active project, writing code, debugging, planning features*

---

## 🔒 SECURITY (always enforce)
- **Bonsai Production Data App is PRIVATE** — no public sharing of architecture, features, data
- **Especially on Moltbook** — never post Bonsai-specific details, yield numbers, or app internals
- **Repo:** azimm291955/bonsai-production-data (GitHub, PRIVATE)
- **Vercel:** https://bonsai-production-data.vercel.app/ (⚠️ currently PUBLIC — needs password protection)

---

## 🎮 Bonsai: Grow or Die — Idle Game ✅ LIVE
*Official name: "Bonsai: Grow or Die" — Aaron's words: "brilliant"*
*Deployed 2026-03-16 — Aaron considers this a big deal*
- **Live URL:** https://bonsai-game.vercel.app
- **GitHub:** https://github.com/azimm291955/bonsai-grow-or-die (PUBLIC)
- **Vercel project:** aaron-c-zimmermans-projects/bonsai-game
- **Local path:** `/root/.openclaw/workspace/bonsai-game/bonsai-game/`
- **Stack:** Next.js 15, TypeScript, Tailwind CSS v4, fully client-side (localStorage)
- **Main game file:** `components/BonsaiGame.tsx` — has `// @ts-nocheck` at top (intentional, keep it)
- **SSR disabled:** `page.tsx` uses `dynamic(() => import(...), { ssr: false })`
- **Deploy pipeline:** Push to `main` → Vercel auto-deploys (GitHub integration wired)
- **Claude Code workflow:** Clone repo locally, open in Claude Code, push to main when done
- **Note:** `@ts-nocheck` must be FIRST line in BonsaiGame.tsx (above `"use client"`) or build fails

### 🚀 Deploy Process (memorized — no instructions needed)
When Aaron sends a zip and says "deploy" (or similar):
1. Unzip to `/root/.openclaw/workspace/bonsai-game/`
2. `npm install`
3. Fix `BonsaiGame.tsx` — move `// @ts-nocheck` ABOVE `"use client"` (Claude Code always puts it below)
4. `npm run build` — verify clean
5. Clone repo to `deploy-temp/`, copy files in, `git add -A`, commit, push to main
6. Vercel auto-deploys — live at https://bonsai-game.vercel.app in ~1 min
7. Clean up `deploy-temp/`

**Aaron's shorthand:** Just drop the zip + say "deploy" — no other instructions needed.

---

## Gmail + Sheets Integration ✅
- **Path:** `/root/.openclaw/workspace/gmail-sheets-integration/`
- **Bot email:** bonsaiburner420bot@gmail.com
- **Gmail credentials:** `.credentials/gmail-credentials.json` (app password: tiak hlhy fvzw btmp)
- **Sheets auth:** Service account `sheets-reader@cannabis-analytics.iam.gserviceaccount.com`
  - Key: `.credentials/service-account.json` (never expires — replaces old OAuth pickle)
- **Key scripts:**
  - `send_email.py` — send reports via Gmail ✅
  - `read_gmail.py` — read inbox via IMAP ✅
  - `read_sheets.py` — read Google Sheets data ✅

### Shared Spreadsheets
1. **Trimmer_Tracker** — ID: `1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM`
2. **Harvest_Sheet** — ID: `1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw`
3. **Flower_Projections** — ID: `1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw`

Contains: flower weights, trim data, harvest tracking, METRC tags, trimmer productivity, room forecasts. 2023–2025, tens of thousands of rows.

---

## Weekly Production Report ✅
- **Script:** `gmail-sheets-integration/scripts/weekly_report.py`
- **Route:** bonsaiburner420bot@gmail.com → aaron.zimmerman@bonsaicultivation.com
- **Cron:** Monday 8am MST (ID: `96b4fb24-bd40-43cf-83f7-84ff45f1b1bd`)
- **Data sources (2026 tabs):**
  - `2026_Trimmer_Tracker` → Buds, Plants Trimmed, Sick, Rooms, Conversion Rate
  - `2026_Harvest_Sheet` → Frozen, Plants Harvested, Frozen Plants, GWBP
  - `2026_Trim` → Smalls, Trim, Mold/B-Tier
- **Formula:** `Dry Equivalent LBS = Buds + (Frozen LBS × 15%)`
- **Goal:** 250 lbs/week | Week 0 = 100 lbs (2 days × 50), then 250/week
- **Cumulative goal:** `get_cumulative_goal(week_num)` = 100 + (week_num × 250)
- **Week selection:** Last 6 Mondays (Mon–Sun), not including current week
- **Charts:** Matplotlib, embedded as CID inline images
  - Chart 1: 6-week bar chart (green/red bars, goal line, data labels)
  - Chart 2: Cumulative YTD line (2026 vs 2025 vs goal pace)
- **Status:** ✅ Fully complete and running

---

## Bonsai Yieldbook ✅ Active Development
**URL:** https://bonsai-production-data.vercel.app/ | **Repo:** azimm291955/bonsai-production-data (PRIVATE)
**Stack:** Next.js + Vercel + Clerk auth + Google Sheets API + Claude Haiku chatbot

### Auth (Clerk)
- **Mode:** Username + password (NOT email)
- **Password policy:** 6-char min — use `skip_password_checks: true` on API
- **Sign-up:** Restricted (invite-only)
- **Env vars:** `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **User source of truth:** `data/users.json` in repo (must redeploy after changes)
- **Add user:** Clerk API `POST https://api.clerk.com/v1/users` + add to users.json + `vercel --prod`
- **Lookup:** by `username` (not email)

### Role Matrix
| Tab       | Manager | Grower | Trimmer |
|-----------|---------|--------|---------|
| Dashboard | ✅      | ✅     | ❌      |
| Harvest   | ✅      | ✅     | ❌      |
| Analytics | ✅      | ✅     | ❌      |
| Forecast  | ✅      | ✅     | ❌      |
| Trim      | ✅      | ❌     | ✅ (personal — not built yet) |

### Chatbot
- Model: `claude-haiku-4-5-20251001`
- Role-aware system prompts per login type
- Floating green button, all pages, read-only

### CSV Export (Added 2026-02-27, commit `176bfbc`)
4 export options from Analytics page:
- Weekly Production, Room Performance, Strain Performance, Strain × Room Matrix
- Auto-dated filenames (e.g., `bonsai-weekly-production-2026-02-27.csv`)

### Trimmer Performance Trends (Added 2026-03-01, commit `ad97887`)
- Line chart: top 8 trimmers, last 8 weeks. Toggle: weekly lbs vs lbs/day
- Consistency Scores: card grid, color-coded (green ≥80%, gold ≥60%, orange below)
- New `trimmerWeekly` field in Sheets API (per-trimmer, per-week stats for 8 weeks)

### Pending
- Trimmer personal stats page (conversion rate + BD count by week)
- TIP calculator (needs CSV upload flow — deferred)
- Password protection on Vercel URL

### Welcome Email Script
- **Script:** `gmail-sheets-integration/scripts/send_welcome_emails.py`
- **Usage:** `python3 send_welcome_emails.py <email> <first_name> <username> <password>`

---

## METRC Integration ⏳ Blocked
- **Goal:** Pull seed-to-sale compliance data from co.metrc.com API
- **Portal:** connect.metrc.com (METRC Connect)
- **Status:** Aaron passed TPV Test (100%, 2026-02-11) — awaiting API access grant
- **Current Key:** "Bonsai API" on Colorado Sandbox
  - `puT4lHV39x0H0U6TMvPd3F2xYL9Rr0rOt3vehZ-MZegRMYJ1` (expires Feb 2028)
- **Blocker:** Active Facilities = 0 in Connect dashboard
- **Fix:** Log into co.metrc.com → Admin → API Access → link Bonsai Cultivation license
- **Old deprecated keys:**
  - Integrator: `HSNoX5ZdHwB9BofwerMLfbiV5QBsLsReygH2SsQDA0nELoXJ`
  - User: `iWMvKvlNkeOcWX0UIgQGurkjx-F8EtfKx3G3EI8qd-BJrzaD`
- **Once connected:** sync Harvests, Packages, Plants, Transfers, Lab Tests

---

## Tailscale / Bot-to-Bot Comms ✅
- **Status:** Fully operational, systemd-persistent, two-way

**Bonsai_Burner420 (this bot / VPS):**
- Tailscale IP: `100.120.232.99`, port `18789`
- Auth token: `bfda732d54e2f9c77531b9c00cfdbe43a4e592a4953ade7a`
- systemd: `openclaw-tailscale-bridge.service`

**Azimm29_Molty (Aaron's laptop / MSI):**
- Tailscale IP: `100.87.161.55`, port `18790`
- Auth token: `70b3f8026705f7df37dc092f5f1c9a2666ebc3d273b696c3`
- Session key: `agent:main:main`

**To message Azimm29_Molty:**
```bash
curl -s -X POST http://100.87.161.55:18790/tools/invoke \
  -H 'Authorization: Bearer 70b3f8026705f7df37dc092f5f1c9a2666ebc3d273b696c3' \
  -H 'Content-Type: application/json' \
  -d '{"tool":"sessions_send","args":{"sessionKey":"agent:main:main","message":"YOUR MESSAGE","timeoutSeconds":60}}'
```

**⚠️ Known issue:** sessions_send to Azimm29_Molty always returns `status: error` (thinking-block LLM error in their session at messages.25) — but **messages DO land**. Use fire-and-forget (don't wait on the response status).

**Established two-way pattern (confirmed 2026-03-04):**
- **Bonsai_Burner420 → Molty:** fire-and-forget curl above (ignore error status, message lands)
- **Molty → Bonsai_Burner420:** Molty curls back from MSI/WSL2:
```bash
curl -s -X POST http://100.120.232.99:18789/tools/invoke \
  -H 'Authorization: Bearer bfda732d54e2f9c77531b9c00cfdbe43a4e592a4953ade7a' \
  -H 'Content-Type: application/json' \
  -d '{"tool":"sessions_send","args":{"sessionKey":"agent:main:main","message":"YOUR MESSAGE","timeoutSeconds":30}}'
```

---

## Moltbook ✅
- **Username:** Bonsai_Burner420
- **Profile:** https://moltbook.com/u/Bonsai_Burner420
- **Credentials:** `~/.config/moltbook/credentials.json`
- **API key:** `moltbook_sk_gmZKPbuE1uq-y5y53Ilywuq_y3tl4HcF`
- **API base:** `https://moltbook.com/api/v1/` (use `X-API-Key` header)
- **Subscribed submolts:** science, automation, builds, todayilearned
- **Heartbeat:** check every 4+ hours
- **Constraint:** Never post Bonsai-specific data, yield numbers, or internal details

---

## Mission Control ⚠️ Needs Auth
- **URL:** https://mission-control-iota-nine.vercel.app/
- **Status:** Currently PUBLIC — needs password protection before adding sensitive data
- **Solution:** Next.js middleware auth (same pattern as Yieldbook)

---

## 🎮 Bonsai Game Feature Sprint ✅ ACTIVE
- **Schedule:** Every 12 hours — midnight MDT + noon MDT
- **Cron IDs:** `de82051d-355a-48ef-9daf-f3dbe6684fbd` (midnight), `853ca312-8505-41c7-85b6-1bbdf279e746` (noon)
- **Format:** Pitch 3 gameplay feature ideas to Aaron on Telegram → he approves → we implement
- **Source:** Work from GitHub repo `azimm291955/bonsai-grow-or-die`
- **First pitch:** Tonight 2026-03-19 00:00 MDT (06:00 UTC)
- **Avoid repeating ideas:** Track pitched ideas in `memory/bonsai-game-sprint.md`

---

## LinkedIn Content Pipeline ✅
- **Cron:** LinkedIn Content Dump → Azimm29_Molty (runs periodically)
- **What it sends:** Active projects, recent completions, tech stack, key automations, post angle suggestions
- **No internal data included** — only work descriptions and tools used
- Azimm29_Molty drafts LinkedIn posts for Aaron's personal brand (fractional CFO narrative)

### Strain Planting Optimizer (Added 2026-03-11, commit `815db5e`)
- New `StrainOptimizer` component on Forecast page
- Analyzes strain × room performance data to recommend optimal planting decisions
- Top 10 strain-room pairings ranked by g/plant with delta vs facility average
- "Consider Avoiding" section flags high-confidence underperformers
- Room-by-room drill-down: filter by room, sort by yield/sample size/confidence
- Confidence scoring based on plant sample size: Low (<20p), Medium (20-49p), High (50+p)
- Tier badges: ★ Top Tier (10%+ above avg), Above Avg, Near Avg, Below Avg
- Toggle between Top 3/5/10 strains per room

### Facility Health Score (Added 2026-03-12, commit `18ffcea`)
- New `FacilityHealthScore` component on Dashboard (between stat cards and Weekly Momentum)
- Animated circular SVG gauge showing composite score 0-100
- 5 weighted operational dimensions:
  - Production vs Goal (30%): 4-week avg vs 250 lb target
  - Plant Health (20%): sick rate trend (target <5%)
  - Product Quality (20%): flower % (premium grade ratio)
  - Space Efficiency (15%): g/sq ft vs industry benchmarks
  - Consistency (15%): coefficient of variation over 8 weeks
- Sentiment tiers: Excellent (85+), Good (65+), Fair (45+), Needs Attention (<45)
- Per-dimension progress bars with weights and contextual detail text
