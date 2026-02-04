# MEMORY.md - Long-Term Memory

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

### Future Work
- Complete production chart automation
- Build additional analysis scripts (trimmer productivity, strain analysis)
- Generate automated reports (weekly/monthly)
- Email insights to Aaron
- Eventually: predictive analytics, optimization recommendations

---

*Updated: 2026-02-04*
