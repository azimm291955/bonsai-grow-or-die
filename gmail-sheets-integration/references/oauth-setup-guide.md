# Google Sheets OAuth Setup Guide

## Step-by-Step Instructions

### 1. Access Google Cloud Console

Go to: https://console.cloud.google.com/

### 2. Create or Select a Project

- Click the project dropdown (top left)
- Click "New Project"
- Name it: `OpenClaw Cannabis Analytics` (or similar)
- Click "Create"
- Wait for project creation, then select it

### 3. Enable Google Sheets API

- In the left sidebar, go to: **APIs & Services** → **Library**
- Search for: `Google Sheets API`
- Click on it
- Click **Enable**
- Wait for activation

### 4. Configure OAuth Consent Screen

- Go to: **APIs & Services** → **OAuth consent screen**
- Choose **External** (unless you have Google Workspace)
- Click "Create"

**Fill in the form:**
- App name: `Bonsai Cannabis Analytics`
- User support email: `bonsaiburner420bot@gmail.com`
- Developer contact: Your email
- Click "Save and Continue"

**Scopes:** Click "Add or Remove Scopes"
- Search for: `spreadsheets.readonly`
- Select: `.../auth/spreadsheets.readonly`
- Click "Update" → "Save and Continue"

**Test users:** Add `bonsaiburner420bot@gmail.com`
- Click "Add Users"
- Enter: `bonsaiburner420bot@gmail.com`
- Click "Add" → "Save and Continue"

**Summary:** Review and click "Back to Dashboard"

### 5. Create OAuth Client ID

- Go to: **APIs & Services** → **Credentials**
- Click: **Create Credentials** → **OAuth client ID**
- Application type: **Desktop app**
- Name: `OpenClaw Sheets Reader`
- Click **Create**

### 6. Download the Credentials

- A dialog appears with Client ID and Client Secret
- Click **Download JSON**
- This downloads a file like: `client_secret_123...json`

### 7. Save to OpenClaw

**Option A - Send file to me:**
Upload the downloaded JSON file

**Option B - Copy-paste contents:**
Open the JSON file in a text editor and paste the contents

I'll save it to: `.credentials/sheets-oauth-credentials.json`

## What Happens Next

1. When I first run the Sheets reader script, it will:
   - Open a browser window
   - Ask you to log in as `bonsaiburner420bot@gmail.com`
   - Show Google's permission screen
   - Ask you to authorize read-only Sheets access

2. After you approve:
   - A token is saved locally
   - Future reads happen automatically (no browser needed)
   - Token auto-refreshes when expired

## Security Notes

- The OAuth app is in "Testing" mode (only test users can use it)
- Only `bonsaiburner420bot@gmail.com` can authenticate
- Scope is read-only: `spreadsheets.readonly`
- No data leaves OpenClaw workspace
