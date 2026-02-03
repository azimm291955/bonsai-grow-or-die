# MEMORY.md - Long-Term Memory

## About Aaron
- **Full Name:** Aaron C. Zimmerman (use middle initial in formal contexts)
- **Email:** aaron.zimmerman@bonsaicultivation.com
- **Role:** Chief Financial Officer at Bonsai Cultivation
- **Location:** Denver, Colorado
- **Timezone:** Mountain Standard Time (MST/MDT)
- **Focus:** Maximize cannabis production through data analysis

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

### What's Next
- Build analysis scripts to aggregate and interpret cultivation data
- Generate automated reports (weekly/monthly)
- Email insights to Aaron
- Eventually: predictive analytics, optimization recommendations

---

*Updated: 2026-02-02*
