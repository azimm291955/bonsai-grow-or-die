# Instagram Reel Poster 🌱

Automated pipeline: Gmail → Instagram Reels for Bonsai Cultivation.

## How It Works

1. Scans Gmail (`bonsaiburner420bot@gmail.com`) for emails with subject starting "Reel - "
2. Picks the **oldest unposted** email (tracked via `posted.json`)
3. Downloads the video attachment
4. Posts it as a Reel to @bonsai.cultivation via Instagram Graph API
5. Logs the post to avoid duplicates
6. Runs daily at midnight MST via cron

## Files

- `post_reel.py` — Main script
- `posted.json` — Log of posted reels (source of truth for dedup)
- `downloads/` — Temp directory for downloaded attachments (cleaned after posting)

## Required Credentials

### Gmail (already configured)
- `~/.openclaw/workspace/.credentials/gmail-credentials.json`

### Instagram (needs setup)
- `~/.openclaw/workspace/.credentials/instagram-credentials.json`

```json
{
  "access_token": "<long-lived-page-access-token>",
  "ig_user_id": "<instagram-business-account-id>",
  "page_id": "<facebook-page-id>"
}
```

## Setup Steps

1. ✅ Facebook Page "Bonsai Cultivation" created
2. ⏳ Link Instagram @bonsai.cultivation to Facebook Page
3. ⏳ Create Meta Developer App
4. ⏳ Generate long-lived access token
5. ⏳ Save credentials to instagram-credentials.json
6. ⏳ Test with `python3 post_reel.py --dry-run`
7. ⏳ Enable cron job

## Usage

```bash
# Dry run (scan emails, show what would be posted)
python3 post_reel.py --dry-run

# Post one reel
python3 post_reel.py
```

## Caption Format

Email subject minus "Reel - " prefix + default hashtags:
- `#BonsaiCultivation #Cannabis #Denver #Colorado #CannabisGrower #WholesaleCannabis`
