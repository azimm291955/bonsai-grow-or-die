---
name: gmail-sheets-integration
description: Read Google Sheets data and send email reports via Gmail. Use when analyzing cultivation data from shared Google Sheets and sending analysis reports via email. Supports read-only Sheets access and Gmail SMTP sending with App Password authentication.
---

# Gmail + Google Sheets Integration

This skill enables reading data from Google Sheets (with viewer access) and sending email reports via Gmail using App Password authentication.

## Prerequisites

1. **Gmail account credentials** stored at `.credentials/gmail-credentials.json` with:
   - `email`: Gmail address
   - `app_password`: 16-character App Password
   
2. **Google Sheets OAuth credentials** (one-time setup required):
   - Create OAuth credentials in Google Cloud Console
   - Save as `.credentials/sheets-oauth-credentials.json`

3. **Python dependencies** installed:
   ```bash
   pip3 install -r scripts/requirements.txt
   ```

## OAuth Setup for Google Sheets (First-Time Only)

### Step 1: Create OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Enable **Google Sheets API**
4. Navigate to "APIs & Services" → "Credentials"
5. Create "OAuth client ID" → Choose "Desktop app"
6. Download the JSON file
7. Save as `.credentials/sheets-oauth-credentials.json`

### Step 2: Run Initial OAuth Flow

The first time you run `read_sheets.py`, it will:
- Open a browser for OAuth consent
- Save the token to `.credentials/sheets-token.pickle`
- Reuse the token for future requests

## Using the Scripts

### Send Email via Gmail

```bash
./scripts/send_email.py <to_email> <subject> <body_text> [body_html]
```

**Example:**
```bash
./scripts/send_email.py "aaron@facility.com" "Weekly Report" "Data analysis attached"
```

**From Python:**
```python
from scripts.send_email import send_email

result = send_email(
    to_email="aaron@facility.com",
    subject="Cannabis Growth Analysis",
    body_text="Plain text version",
    body_html="<h1>HTML version</h1>"
)
```

### Read Google Sheets Data

**Get sheet metadata (list all tabs):**
```bash
./scripts/read_sheets.py metadata <spreadsheet_id>
```

**Read specific range:**
```bash
./scripts/read_sheets.py read <spreadsheet_id> "Sheet1!A1:Z100"
```

**Extract spreadsheet ID from URL:**
- URL: `https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit`
- ID: `1ABC...XYZ`

**From Python:**
```python
from scripts.read_sheets import read_sheet, get_sheet_metadata

# Get metadata
metadata = get_sheet_metadata("1ABC...XYZ")
print(f"Sheets: {[s['title'] for s in metadata['sheets']]}")

# Read data
result = read_sheet("1ABC...XYZ", "Data!A1:Z1000")
data = result['data']  # List of rows (each row is a list)
```

## Workflow: Analyze Sheets → Email Report

### Step 1: Read the Data

```python
from scripts.read_sheets import read_sheet

# Read cultivation data
result = read_sheet(
    spreadsheet_id="YOUR_SHEET_ID",
    range_name="Cultivation!A1:G1000"
)

if result['status'] == 'error':
    print(f"Error: {result['message']}")
    exit(1)

data = result['data']
headers = data[0]
rows = data[1:]
```

### Step 2: Analyze the Data

```python
# Example: Calculate weekly growth metrics
import pandas as pd

df = pd.DataFrame(rows, columns=headers)

# Your analysis logic here
weekly_avg = df['growth_rate'].mean()
top_strains = df.groupby('strain')['yield'].sum().sort_values(ascending=False).head(5)

# Format report
report_text = f"""
Weekly Cannabis Cultivation Report

Average Growth Rate: {weekly_avg:.2f}%

Top 5 Strains by Yield:
{top_strains.to_string()}
"""
```

### Step 3: Send the Report

```python
from scripts.send_email import send_email

result = send_email(
    to_email="aaron@facility.com",
    subject="Weekly Cultivation Report",
    body_text=report_text,
    body_html=f"<pre>{report_text}</pre>"
)

print(f"Email sent: {result['status']}")
```

## Data Analysis Patterns

### Pattern 1: Time-Series Analysis
```python
# Growth over time
df['date'] = pd.to_datetime(df['date'])
weekly_growth = df.groupby(pd.Grouper(key='date', freq='W'))['growth'].mean()
```

### Pattern 2: Strain Comparison
```python
# Compare yield by strain
strain_metrics = df.groupby('strain').agg({
    'yield': 'sum',
    'quality_score': 'mean',
    'growth_days': 'mean'
})
```

### Pattern 3: Resource Efficiency
```python
# Yield per resource input
df['efficiency'] = df['yield'] / (df['water_used'] + df['nutrients_used'])
top_efficient = df.nsmallest(10, 'efficiency')
```

## Security Notes

- **Gmail App Password** is stored locally in `.credentials/gmail-credentials.json`
- **OAuth token** is stored in `.credentials/sheets-token.pickle`
- Both files should NOT be committed to version control
- The Gmail account (`bonsaiburner420bot@gmail.com`) only has viewer access to shared Sheets
- OAuth scope is read-only: `spreadsheets.readonly`

## Troubleshooting

**"Authentication failed":**
- Verify App Password is correct (no spaces)
- Check 2FA is enabled on Gmail account

**"Permission denied" on Sheets:**
- Verify the Sheet is shared with `bonsaiburner420bot@gmail.com`
- Confirm OAuth credentials are valid
- Re-run OAuth flow: delete `.credentials/sheets-token.pickle` and run script again

**"Module not found":**
- Install dependencies: `pip3 install -r scripts/requirements.txt`
