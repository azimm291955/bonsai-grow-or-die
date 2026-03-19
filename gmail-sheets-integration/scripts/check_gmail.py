#!/usr/bin/env python3
"""Check Gmail inbox for latest emails"""

import imaplib
import email
from email.header import decode_header
from pathlib import Path
import sys

# Credentials
EMAIL = "bot@bonsaicultivation.com"
PASSWORD = "kzsz gxfa rjdk rcll"  # App password

def check_inbox(limit=5):
    """Check recent emails"""
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, PASSWORD)
    mail.select("INBOX")
    
    # Search for all emails
    status, messages = mail.search(None, 'ALL')
    email_ids = messages[0].split()
    
    # Get most recent emails
    recent_ids = email_ids[-limit:]
    
    print(f"📧 Recent {limit} emails:\n")
    
    for email_id in reversed(recent_ids):
        status, msg_data = mail.fetch(email_id, "(RFC822)")
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Decode subject
                subject = decode_header(msg["Subject"])[0][0]
                if isinstance(subject, bytes):
                    subject = subject.decode()
                
                from_ = msg.get("From")
                date = msg.get("Date")
                
                print(f"From: {from_}")
                print(f"Date: {date}")
                print(f"Subject: {subject}")
                
                # Check for attachments
                if msg.is_multipart():
                    for part in msg.walk():
                        content_disposition = str(part.get("Content-Disposition"))
                        if "attachment" in content_disposition:
                            filename = part.get_filename()
                            if filename:
                                print(f"  📎 Attachment: {filename}")
                
                print("-" * 70)
    
    mail.close()
    mail.logout()

if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    check_inbox(limit)
