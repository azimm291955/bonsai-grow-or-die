#!/usr/bin/env python3
"""
Daily Instagram Idea Generator for @bonsai.cultivation
Rotates through 5 topic categories, researches trends, generates a Reel idea,
and emails it to davgonza123@gmail.com.

Run by OpenClaw cron daily at 8:00 AM MST.
This script is called by the cron agent prompt — it just handles the email send.
The research + content generation happens in the agent task prompt itself.
"""

# This file is a reference/wrapper. The actual content generation is done
# by the OpenClaw agent cron task (see cron job: "Daily Bonsai Instagram Idea").
# The agent generates the content and calls send_email directly.

import sys
sys.path.insert(0, '/root/.openclaw/workspace/gmail-sheets-integration/scripts')
from send_email import send_email
import json

def send_ig_idea(subject: str, body_text: str, body_html: str = None):
    """Send the Instagram idea email."""
    result = send_email("davgonza123@gmail.com", subject, body_text, body_html)
    print(json.dumps(result))
    return result

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: instagram_idea.py <subject> <body_text> [body_html]")
        sys.exit(1)
    subject = sys.argv[1]
    body_text = sys.argv[2]
    body_html = sys.argv[3] if len(sys.argv) > 3 else None
    send_ig_idea(subject, body_text, body_html)
