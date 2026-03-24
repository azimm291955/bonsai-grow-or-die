#!/usr/bin/env python3
"""Read prod chart email body"""

import imaplib
import email
from email.header import decode_header

# Credentials
EMAIL = "bot@bonsaicultivation.com"
PASSWORD = "kzsz gxfa rjdk rcll"

def read_email():
    """Read prod chart email"""
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, PASSWORD)
    mail.select("INBOX")
    
    # Search for email with subject containing "Prod Chart"
    status, messages = mail.search(None, '(SUBJECT "Prod Chart")')
    email_ids = messages[0].split()
    
    # Get most recent
    email_id = email_ids[-1]
    status, msg_data = mail.fetch(email_id, "(RFC822)")
    
    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            
            subject = decode_header(msg["Subject"])[0][0]
            if isinstance(subject, bytes):
                subject = subject.decode()
            
            print(f"Subject: {subject}")
            print(f"From: {msg.get('From')}")
            print(f"Date: {msg.get('Date')}\n")
            print("="*70)
            print("BODY:")
            print("="*70)
            
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        body = part.get_payload(decode=True)
                        if body:
                            print(body.decode())
                    elif content_type == "text/html" and "attachment" not in content_disposition:
                        body = part.get_payload(decode=True)
                        if body:
                            print("\n[HTML VERSION]")
                            print(body.decode()[:2000])  # First 2000 chars
            else:
                body = msg.get_payload(decode=True)
                if body:
                    print(body.decode())
    
    mail.close()
    mail.logout()

if __name__ == "__main__":
    read_email()
