# Next Steps: Cannabis Data Analysis

## Context (for after a reset)

We've completed the Gmail + Google Sheets integration setup. Everything is working and tested.

## What's Already Done ✅

1. **Gmail sending** - bonsaiburner420bot@gmail.com can send emails
2. **Google Sheets OAuth** - Can read any sheet shared with the bot
3. **Three cultivation spreadsheets** are shared and accessible:
   - Trimmer_Tracker (36K+ rows of flower/trim weights)
   - Harvest_Sheet (38K+ rows of harvest data)
   - Flower_Projections (72K+ rows across multiple tabs)
4. **Integration scripts** are built and working in `gmail-sheets-integration/`

## What Needs to Happen Next

### Phase 1: Build Analysis Script
Create a Python script that:
1. Reads data from the three spreadsheets
2. Aggregates production metrics (total flower weight, batch counts, etc.)
3. Calculates trimmer productivity metrics
4. Compares current period to historical data (2025 vs 2024 vs 2023)
5. Formats results into a readable report

### Phase 2: Generate First Report
- Run the analysis on recent data (e.g., January 2025 or last 30 days)
- Create a formatted report with key insights
- Email it to aaron.zimmerman@bonsaicultivation.com

### Phase 3: Automation (Future)
- Set up weekly/monthly automated reports via cron
- Add more sophisticated analytics (predictive models, efficiency trends)
- Create visualization dashboards (optional)

## Quick Start Prompt for Next Session

**Copy-paste this after /reset:**

```
I'm ready to continue the cannabis data analysis project. We've completed the Gmail + Google Sheets integration setup. The integration is working (tested), and I have access to three cultivation spreadsheets with production data.

Next step: Build an analysis script that reads the sheets, calculates production metrics, and emails a report to Aaron. 

The three spreadsheets are:
1. Trimmer_Tracker (ID: 1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM)
2. Harvest_Sheet (ID: 1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw)
3. Flower_Projections (ID: 1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw)

What type of report should we generate first? Or should I create a comprehensive monthly production summary?
```

## Technical Reference

### Reading Sheets
```bash
/root/.openclaw/workspace/gmail-sheets-integration/scripts/read_sheets.py metadata "<SHEET_ID>"
/root/.openclaw/workspace/gmail-sheets-integration/scripts/read_sheets.py read "<SHEET_ID>" "SheetName!A1:Z1000"
```

### Sending Email
```bash
/root/.openclaw/workspace/gmail-sheets-integration/scripts/send_email.py "aaron.zimmerman@bonsaicultivation.com" "Subject" "Body text" "Optional HTML body"
```

### Spreadsheet IDs
- Trimmer_Tracker: `1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM`
- Harvest_Sheet: `1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw`
- Flower_Projections: `1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw`

---

All credential and OAuth token files are in `.credentials/` and working.
