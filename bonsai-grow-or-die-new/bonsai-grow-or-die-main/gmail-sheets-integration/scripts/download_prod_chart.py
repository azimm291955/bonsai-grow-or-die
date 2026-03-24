#!/usr/bin/env python3
"""Download prod chart attachment from Gmail"""

import imaplib
import email
from email.header import decode_header
from pathlib import Path
import sys

# Credentials
EMAIL = "bot@bonsaicultivation.com"
PASSWORD = "kzsz gxfa rjdk rcll"

def download_attachment():
    """Download prod chart from Gmail"""
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, PASSWORD)
    mail.select("INBOX")
    
    # Search for email with subject containing "Prod Chart"
    status, messages = mail.search(None, '(SUBJECT "Prod Chart")')
    email_ids = messages[0].split()
    
    if not email_ids:
        print("❌ No email found with subject 'Prod Chart'")
        return
    
    # Get most recent matching email
    email_id = email_ids[-1]
    status, msg_data = mail.fetch(email_id, "(RFC822)")
    
    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            
            subject = decode_header(msg["Subject"])[0][0]
            if isinstance(subject, bytes):
                subject = subject.decode()
            
            print(f"📧 Found email: {subject}")
            print(f"From: {msg.get('From')}")
            print(f"Date: {msg.get('Date')}\n")
            
            # Look for attachments
            if msg.is_multipart():
                for part in msg.walk():
                    content_disposition = str(part.get("Content-Disposition"))
                    
                    if "attachment" in content_disposition:
                        filename = part.get_filename()
                        if filename:
                            # Save attachment
                            downloads_dir = Path(__file__).parent.parent / "downloads"
                            downloads_dir.mkdir(exist_ok=True)
                            
                            filepath = downloads_dir / filename
                            
                            with open(filepath, "wb") as f:
                                f.write(part.get_payload(decode=True))
                            
                            print(f"✅ Downloaded: {filename}")
                            print(f"   Saved to: {filepath}")
            else:
                # Not multipart, check body
                print("📄 Email body:")
                body = msg.get_payload(decode=True)
                if body:
                    print(body.decode()[:1000])  # First 1000 chars
    
    mail.close()
    mail.logout()

if __name__ == "__main__":
    download_attachment()
