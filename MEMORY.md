# MEMORY.md - Long-Term Memory

## 🔒 SECURITY & CONFIDENTIALITY (2026-02-04)

**CRITICAL DIRECTIVE FROM AARON:**
- **Bonsai Production Data App is PRIVATE** - GitHub repo set to private
- **DO NOT share app details publicly** - No discussions about inner workings, architecture, or features
- **PROTECT THE DATA** - Never share, reference, or discuss actual cultivation data externally
- **Especially on Moltbook** - Do not post about Bonsai data, production numbers, or app specifics
- **What's okay to discuss:** General cultivation concepts, industry benchmarks, learning from other agents
- **What's NOT okay:** Any specifics about Bonsai Cultivation's operations, data, or internal systems

**Repository:**
- **GitHub:** azimm291955/bonsai-production-data (PRIVATE)
- **Vercel:** https://bonsai-production-data.vercel.app/ (⚠️ CURRENTLY PUBLIC - need to add password protection later)

## About Aaron
- **Full Name:** Aaron C. Zimmerman (use middle initial in formal contexts)
- **Primary Email:** aaron.zimmerman@bonsaicultivation.com ⚠️ MOST IMPORTANT - watch for emails from this address
- **Role:** Chief Financial Officer at Bonsai Cultivation
- **Location:** Denver, Colorado
- **Timezone:** Mountain Standard Time (MST/MDT)
- **Focus:** Maximize cannabis production through data analysis

## Cannabis Cultivation Metrics (Industry Knowledge)

### Primary Success Metric
**Grams per square foot (g/sq ft) is the BEST metric of success in a cultivation facility.**

**Why this metric:**
- Measures dried yield against flowering canopy square footage
- Constant denominator (canopy size stays the same) allows easy comparison
- Industry standard for benchmarking performance

**Formula:**
```
Total dried yield (grams) ÷ Flowering canopy square footage = Grams per square foot
```

⚠️ **UNRESOLVED:** What counts as "yield" in this metric?
- Industry sources say "dry flower" or "primary and secondary bud"
- Unclear if this includes: Flower only? Flower + Smalls? All yield including trim?
- Bonsai Cultivation tracks all 3 separately (Flower, Smalls, Trim)
- **Need to resolve before benchmarking against industry standards**

**Industry Benchmarks:**
- **Startups/Basic:** 35 g/sq ft per harvest
- **Established operations:** 50-70 g/sq ft per harvest
- **Elite performers:** 100+ g/sq ft per harvest
- **Industry average:** ~39.5 g/sq ft

**Conversion to pounds:**
- 35 g/sq ft = 0.077 lbs/sq ft
- 50 g/sq ft = 0.110 lbs/sq ft
- 70 g/sq ft = 0.154 lbs/sq ft
- 100 g/sq ft = 0.220 lbs/sq ft

**Sources:** Greenhouse Grower (Ryan Douglas, Dec 2022), Next Big Crop (Jan 2025), Cannabis Business Times

**Other metrics tracked:**
- Grams per watt (lighting efficiency)
- Grams per kWh (total energy consumption)
- Wet to dry ratio (typically 20-25%)

## Gmail + Sheets Integration (Completed 2026-02-02)

### Bot Account
- **Email:** bonsaiburner420bot@gmail.com
- **Purpose:** Read shared Google Sheets, send analysis reports
- **Credentials stored:** `.credentials/gmail-credentials.json` (app password: tiak hlhy fvzw btmp)
- **OAuth token:** `.credentials/sheets-token.pickle` (Google Sheets read-only access)

### Integration Location
- **Skill path:** `/root/.openclaw/workspace/gmail-sheets-integration/`
- **Key scripts:**
  - `send_email.py` - Send reports via Gmail (tested, working)
  - `read_gmail.py` - Read Gmail inbox via IMAP (tested, working)
  - `read_sheets.py` - Read Google Sheets data (tested, working)
- **Status:** ✅ Fully operational

### Shared Cultivation Spreadsheets
1. **Trimmer_Tracker** - ID: `1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM`
2. **Harvest_Sheet** - ID: `1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw`
3. **Flower_Projections** - ID: `1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw`

Contains: flower weights, trim data, harvest tracking, METRC compliance tags, trimmer productivity, room production forecasts. Data spans 2023-2025, tens of thousands of rows.

### Data Analysis Capabilities
Can analyze:
- Weekly/monthly production summaries
- Trimmer productivity and efficiency
- Batch performance comparisons
- Year-over-year trends (2023 vs 2024 vs 2025)
- Labor analysis (hours vs output)
- Yield projections and capacity planning

### Current Project: Weekly Production Chart Automation (2026-02-04)

**Goal:** Automate the "Bonsai Prod Chart" report - weekly flower production for last 6 Mondays.

**Data Sources:**
- Flower_Projections spreadsheet → Trimmed_Weights + 2025_Harvest_Sheet tabs
- 62K+ trimmed weight records, 38K+ harvest records

**Formula:**
```
Dry Equivalent LBS = (Trimmed Weight grams / 453) + (Frozen Weight grams / 453) × 15%
```

**Script Location:** `/root/.openclaw/workspace/gmail-sheets-integration/scripts/calculate_weekly_production.py`

**Status:** 50% complete
- ✅ Successfully calculates 3/6 weeks perfectly (12/22, 12/29, 1/26)
- ⚠️ Off by 0.4-2.2 lbs on weeks 1/5, 1/12, 1/19 (need to refine frozen weight matching)
- ⏳ Next: Fix calculation discrepancies, add chart generation, create email format

**Week Selection:** Last 6 Mondays (not including current week's Monday)

See `/root/.openclaw/workspace/memory/2026-02-04.md` for full details.

### Future Work - Near Term
- Complete production chart automation
- Build additional analysis scripts (trimmer productivity, strain analysis)
- Generate automated reports (weekly/monthly)
- Email insights to Aaron

### Future Work - Long Term Vision (2026-02-04)
**Bonsai Production Data Web Application:** (PRIVATE PROJECT)
- **Goal:** Build an online data analysis platform where people input data directly (not via Google Sheets)
- **Features:** Real-time graphs, analytics dashboard, live visualization
- **Tech Stack:** GitHub (private repo) + Vercel deployment
- **Benefits:** 
  - Direct data input to agent (no spreadsheet intermediary)
  - Real-time processing and insights
  - Custom visualizations for cultivation metrics
  - More interactive and responsive than static sheets
- **Status:** Active development - Next.js app initialized, GitHub repo created (private)
- **Repo:** azimm291955/bonsai-production-data (PRIVATE)
- **Security:** All details kept confidential per Aaron's directive

## Moltbook Integration (2026-02-04)

**Registration:**
- **Username:** Bonsai_Burner420
- **Profile:** https://moltbook.com/u/Bonsai_Burner420
- **Description:** Cannabis cultivation data analyst focusing on maximizing production
- **Status:** ✅ CLAIMED and active!
- **Credentials:** Stored in `~/.config/moltbook/credentials.json`
- **Heartbeat:** Configured to check every 4+ hours

**Purpose:**
- Network with other cultivation agents (cannabis, agriculture, hydroponics)
- Connect with data analysis and statistics agents
- **Learn from others** (industry concepts, techniques, best practices)
- Find relevant submolts (communities) once claimed
- **⚠️ CONSTRAINT:** Do NOT share Bonsai-specific data, app details, or internal operations

**Activity:**
- **First Post:** Introduction in m/introductions (https://moltbook.com/post/19e073bb-4f27-40d4-884e-aeb83403ed98)
- **Subscribed submolts:** science, automation, builds, todayilearned
- **Watching for:** Other cultivation/agriculture agents, data analysis agents
- **Note:** No cannabis/cultivation/agriculture submolt exists yet - opportunity to create one later

**Next Steps:**
1. ✅ Aaron verified ownership via Twitter (DONE)
2. ✅ Posted introduction (DONE)
3. Monitor feed during heartbeats for relevant discussions
4. Engage with agents working on similar problems
5. Consider creating m/cultivation or m/agriculture submolt if there's interest
6. Share insights from Bonsai Cultivation data work when relevant

## To-Do List

### 1. Data Analysis (TOP PRIORITY)
- **Weekly Production Chart Automation** (50% complete)
  - Fix calculation discrepancies for weeks 1/5, 1/12, 1/19
  - Add chart generation
  - Create email format
- **Additional Analysis Projects:**
  - Trimmer productivity and efficiency reports
  - Batch performance comparisons
  - Year-over-year trends (2023 vs 2024 vs 2025)
  - Strain analysis
  - Labor analysis (hours vs output)

### 2. Production Data Web Application (PRIVATE)
- **Repo:** azimm291955/bonsai-production-data (GitHub, PRIVATE)
- **Status:** Next.js initialized, Vercel deployed
- **Next Steps:**
  - Build data input forms (replace Google Sheets workflow)
  - Create analytics dashboard
  - Add real-time visualization
- **Vercel Deployment:**
  - URL: https://bonsai-production-data.vercel.app/
  - ⚠️ Currently PUBLIC - needs password protection before adding sensitive data
  - Free solution: Next.js middleware for authentication
- **Security:** All details confidential - no public sharing

#### METRC Integration (Sub-project)
- **Goal:** Pull seed-to-sale compliance data directly from co.metrc.com API
- **Status:** ⏳ Pending - Need vendor/integrator API access
- **Current Keys:**
  - Integrator API Key: `HSNoX5ZdHwB9BofwerMLfbiV5QBsLsReygH2SsQDA0nELoXJ`
  - User API Key: `iWMvKvlNkeOcWX0UIgQGurkjx-F8EtfKx3G3EI8qd-BJrzaD`
- **Authentication Issue:** METRC API requires BOTH keys (integrator + user) to work together
- **Next Steps:**
  1. Verify both keys are valid (may need to register as vendor/integrator with METRC)
  2. Test authentication with facilities endpoint
  3. Once connected, build data sync for:
     - Harvests (harvest tracking, yields)
     - Packages (inventory, weights, lab tests)
     - Plants (plant batches, growth phases)
     - Transfers (sales, deliveries)
     - Lab Tests (compliance testing results)
- **Benefits:** 
  - Real-time compliance data
  - Cross-reference METRC tags with internal tracking
  - Automated reporting for state compliance
  - Link production data to sales/inventory

### 3. Systematic Learning Framework
- Build feedback loops inspired by Moltbook agent "huhu"
- Apply to cultivation operations: measure → learn → improve → repeat
- Track: decisions made, outcomes observed, lessons extracted, patterns recognized
- Goal: Continuous improvement system for production optimization

### Future (Don't Forget)
- **Website Optimization** (Bonsai Cultivation site)
  - Fix "Dagba" → "Dagda" typo
  - Add dispensary locator ("Find Us" feature)
  - Improve SEO (structured data, blog content, backlinks)
  - Test mobile friendliness

---

*Updated: 2026-02-04*
