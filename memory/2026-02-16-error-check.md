# 2026-02-16 — Error Check Report Built

## Daily Error Check Script
- **Script:** `/root/.openclaw/workspace/gmail-sheets-integration/scripts/error_check.py`
- **Purpose:** Validate Google Sheets data for human entry errors
- **Schedule requested:** Daily at 5pm MST (cron not yet created)
- **Sends from:** bonsaiburner420bot@gmail.com → aaron.zimmerman@bonsaicultivation.com

## Checks Implemented
1. **Range validation:** Flag healthy plants >500g, flag all negative weights
2. **Duplicate detection:** METRC tag duplicates on both Trimmer Tracker and Harvest Sheet
3. **Cross-sheet consistency:** NOT implemented (Aaron said too complex for v1 — frozen plants don't appear on trimmer tracker, "no tag" plants need human discretion)
4. **Outlier detection:** Plants >2σ from batch mean (by batch on Trimmer Tracker, by strain+room on Harvest Sheet)
5. **Trimmer inflation detection:** Two checks — (a) >15% of a trimmer's plants are high outliers, (b) trimmer avg >2σ above team avg
6. **Missing data:** Flag plants with weight but no trim date
7. **Format validation:** Non-numeric values in weight columns, unrecognizable date formats

## First Test Run Results (2026-02-16)
- **Total issues:** 683
- **CRITICAL:** 0 (no duplicates, no negatives)
- **WARNING:** 1 (Row 7576: weight value "17 1" — likely typo for 171)
- **INFO:** 682 (statistical outliers — expected ~5% at 2σ threshold)
- **No trimmer inflation flags** — all trimmers within normal range
- **No plants >500g healthy**

## Final Configuration
- **Threshold:** 4σ (started at 2σ → 682 flags, 3σ → 71 flags, 4σ → 6-7 flags)
- **Batch mismatch:** Limited to last 6 weeks (Aaron cleaned up historical mismatches manually)
- **Harvest sheet:** Only checks GWBP, not GWP
- **500g auto-flag:** Any healthy plant >500g
- **Cron job:** Daily 5pm MST — ID: `7390fc7f-0d9b-4246-899a-35c5e25cc0a7`
- **First report sent:** 2026-02-16, 6 issues (0 critical, 3 trimmer outliers, 3 harvest outliers, 0 batch mismatches)
- Aaron mentioned a prior "trimmer inflation" analysis — NOT found in memory. May predate this agent.

## Data Sources
- `2026_Flower_Weights` tab from Trimmer_Tracker spreadsheet (ID: `1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM`)
- `Harvest_Weight_2026` tab from Harvest_Sheet spreadsheet (ID: `1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw`)
