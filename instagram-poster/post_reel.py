#!/usr/bin/env python3
"""
Instagram Reel Poster (instagrapi version)
Scans Gmail for emails with subject starting "Reel - ",
downloads the video attachment from the oldest unposted email,
and posts it as a Reel to Instagram via instagrapi.

Cron: daily at midnight MST (07:00 UTC)
"""

import imaplib
import email
from email.header import decode_header
import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime, timezone
from instagrapi import Client

# Paths
SCRIPT_DIR = Path(__file__).parent
WORKSPACE = SCRIPT_DIR.parent
CREDS_PATH = WORKSPACE / '.credentials' / 'gmail-credentials.json'
IG_CREDS_PATH = WORKSPACE / '.credentials' / 'instagram-credentials.json'
IG_SESSION_PATH = WORKSPACE / '.credentials' / 'instagram-session.json'
POSTED_LOG = SCRIPT_DIR / 'posted.json'
DOWNLOAD_DIR = SCRIPT_DIR / 'downloads'

# ── Gmail helpers ──────────────────────────────────────────────

def load_gmail_creds():
    with open(CREDS_PATH, 'r') as f:
        return json.load(f)

def decode_subject(subject):
    if subject is None:
        return ""
    decoded_parts = decode_header(subject)
    result = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result += part.decode(encoding or 'utf-8', errors='ignore')
        else:
            result += part
    return result

def fetch_reel_emails():
    """
    Fetch all emails with subject starting 'Reel - '.
    Returns list of dicts sorted oldest-first.
    """
    creds = load_gmail_creds()
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(creds['email'], creds['app_password'])
    imap.select("INBOX")

    status, messages = imap.search(None, 'SUBJECT "Reel -"')
    email_ids = messages[0].split()

    reels = []
    for eid in email_ids:
        status, msg_data = imap.fetch(eid, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject = decode_subject(msg["Subject"])

                if not subject.startswith("Reel - "):
                    continue

                has_attachment = False
                attachment_filename = None
                for part in msg.walk():
                    cd = part.get("Content-Disposition")
                    if cd and "attachment" in cd:
                        has_attachment = True
                        attachment_filename = decode_subject(part.get_filename() or "")
                        break

                reels.append({
                    "msg_id": msg["Message-ID"] or eid.decode(),
                    "imap_id": eid.decode(),
                    "subject": subject,
                    "date": msg["Date"],
                    "from": msg.get("From"),
                    "has_attachment": has_attachment,
                    "attachment_filename": attachment_filename,
                })

    imap.close()
    imap.logout()

    reels.sort(key=lambda r: int(r["imap_id"]))
    return reels


def download_attachment(msg_id_imap):
    """Download the first attachment from the email. Returns local file path."""
    DOWNLOAD_DIR.mkdir(exist_ok=True)

    creds = load_gmail_creds()
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(creds['email'], creds['app_password'])
    imap.select("INBOX")

    status, msg_data = imap.fetch(msg_id_imap.encode(), "(RFC822)")
    filepath = None

    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            for part in msg.walk():
                cd = part.get("Content-Disposition")
                if cd and "attachment" in cd:
                    filename = decode_subject(part.get_filename() or "attachment")
                    safe_name = f"{int(time.time())}_{filename}"
                    filepath = DOWNLOAD_DIR / safe_name
                    with open(filepath, "wb") as f:
                        f.write(part.get_payload(decode=True))
                    break
            break

    imap.close()
    imap.logout()
    return filepath


# ── Posted log ─────────────────────────────────────────────────

def load_posted_log():
    if POSTED_LOG.exists():
        with open(POSTED_LOG, 'r') as f:
            return json.load(f)
    return {"posted": []}

def save_posted_log(log):
    with open(POSTED_LOG, 'w') as f:
        json.dump(log, f, indent=2)

def is_posted(msg_id, log):
    return any(p["msg_id"] == msg_id for p in log["posted"])

def mark_posted(msg_id, subject, ig_media_id=None):
    log = load_posted_log()
    log["posted"].append({
        "msg_id": msg_id,
        "subject": subject,
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "ig_media_id": ig_media_id,
    })
    save_posted_log(log)


# ── Instagram (instagrapi) ────────────────────────────────────

def get_ig_client():
    """Login to Instagram, reusing session if available."""
    with open(IG_CREDS_PATH, 'r') as f:
        creds = json.load(f)

    cl = Client()
    cl.delay_range = [1, 3]

    # Try to load existing session
    if IG_SESSION_PATH.exists():
        try:
            cl.load_settings(IG_SESSION_PATH)
            cl.login(creds["username"], creds["password"])
            cl.get_timeline_feed()  # Test the session
            print("✅ Logged in with saved session")
            return cl
        except Exception as e:
            print(f"⚠️  Saved session failed ({e}), doing fresh login...")

    # Fresh login
    cl.login(creds["username"], creds["password"])
    cl.dump_settings(IG_SESSION_PATH)
    print("✅ Fresh login successful, session saved")
    return cl


def upload_reel_to_instagram(video_path, caption):
    """Upload a video as a Reel via instagrapi. Returns media PK."""
    cl = get_ig_client()

    print(f"📤 Uploading Reel...")
    media = cl.clip_upload(
        Path(video_path),
        caption=caption,
    )
    print(f"✅ Published! Media PK: {media.pk}")
    return str(media.pk)


# ── Main pipeline ─────────────────────────────────────────────

def build_caption(subject):
    """Build Instagram caption from email subject."""
    caption = subject.replace("Reel - ", "", 1).strip()
    hashtags = "\n\n#BonsaiCultivation #Cannabis #Denver #Colorado #CannabisGrower #WholesaleCannabis"
    return caption + hashtags


def run(dry_run=False):
    """Main entry point. Find oldest unposted Reel email, download, and post."""
    print(f"{'='*60}")
    print(f"🌱 Bonsai Instagram Reel Poster")
    print(f"   {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}\n")

    log = load_posted_log()
    posted_ids = {p["msg_id"] for p in log["posted"]}
    print(f"📋 Already posted: {len(posted_ids)} reel(s)")

    print("📧 Scanning Gmail for 'Reel - ' emails...")
    reels = fetch_reel_emails()
    print(f"   Found {len(reels)} total reel email(s)")

    unposted = [r for r in reels if r["msg_id"] not in posted_ids]
    print(f"   Unposted: {len(unposted)}")

    if not unposted:
        print("\n✅ All caught up! No new reels to post.")
        return {"status": "no_new_reels"}

    target = unposted[0]
    print(f"\n🎬 Next reel to post:")
    print(f"   Subject: {target['subject']}")
    print(f"   From: {target['from']}")
    print(f"   Date: {target['date']}")
    print(f"   Attachment: {target['attachment_filename']}")

    if not target["has_attachment"]:
        print("⚠️  No attachment found — skipping")
        mark_posted(target["msg_id"], target["subject"], ig_media_id="SKIPPED_NO_ATTACHMENT")
        return {"status": "skipped_no_attachment", "subject": target["subject"]}

    if dry_run:
        print("\n🏃 DRY RUN — would download and post this reel.")
        return {"status": "dry_run", "subject": target["subject"], "unposted_count": len(unposted)}

    print(f"\n📥 Downloading attachment...")
    video_path = download_attachment(target["imap_id"])

    if not video_path or not video_path.exists():
        print("❌ Failed to download attachment")
        return {"status": "download_failed", "subject": target["subject"]}

    print(f"   Saved to: {video_path}")
    print(f"   Size: {os.path.getsize(video_path) / 1024 / 1024:.1f} MB")

    caption = build_caption(target["subject"])
    print(f"\n📝 Caption:\n{caption}\n")

    try:
        media_id = upload_reel_to_instagram(str(video_path), caption)
        mark_posted(target["msg_id"], target["subject"], ig_media_id=media_id)
        print(f"\n🎉 Successfully posted reel!")
        video_path.unlink(missing_ok=True)
        return {
            "status": "posted",
            "subject": target["subject"],
            "ig_media_id": media_id,
        }
    except Exception as e:
        print(f"\n❌ Failed to post: {e}")
        return {"status": "post_failed", "error": str(e)}


if __name__ == "__main__":
    dry_run = "--dry" in sys.argv or "--dry-run" in sys.argv
    result = run(dry_run=dry_run)
    print(f"\n📊 Result: {json.dumps(result, indent=2)}")
