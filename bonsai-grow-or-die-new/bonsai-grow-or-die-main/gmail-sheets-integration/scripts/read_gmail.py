#!/usr/bin/env python3
"""
Read Gmail inbox using IMAP.
Uses app password from .credentials/gmail-credentials.json
"""

import imaplib
import email
from email.header import decode_header
import json
from pathlib import Path
from datetime import datetime

def load_credentials():
    """Load Gmail credentials from .credentials folder"""
    creds_path = Path(__file__).parent.parent.parent / '.credentials' / 'gmail-credentials.json'
    with open(creds_path, 'r') as f:
        return json.load(f)

def decode_email_subject(subject):
    """Decode email subject if it's encoded"""
    if subject is None:
        return ""
    decoded_parts = decode_header(subject)
    decoded_subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            decoded_subject += part.decode(encoding or 'utf-8', errors='ignore')
        else:
            decoded_subject += part
    return decoded_subject

def get_email_body(msg):
    """Extract email body from message"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            
            # Get text/plain parts
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        # Not multipart
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            pass
    
    return body

def read_inbox(limit=10, unread_only=True):
    """
    Read emails from Gmail inbox
    
    Args:
        limit: Maximum number of emails to fetch
        unread_only: If True, only fetch unread emails
    
    Returns:
        List of email dictionaries
    """
    creds = load_credentials()
    
    # Connect to Gmail via IMAP
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(creds['email'], creds['app_password'])
    
    # Select inbox
    imap.select("INBOX")
    
    # Search for emails
    search_criteria = "UNSEEN" if unread_only else "ALL"
    status, messages = imap.search(None, search_criteria)
    
    email_ids = messages[0].split()
    email_list = []
    
    # Fetch most recent emails up to limit
    for email_id in reversed(email_ids[-limit:]):
        status, msg_data = imap.fetch(email_id, "(RFC822)")
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Extract email details
                subject = decode_email_subject(msg["Subject"])
                from_addr = msg.get("From")
                date_str = msg.get("Date")
                body = get_email_body(msg)
                
                email_list.append({
                    "id": email_id.decode(),
                    "subject": subject,
                    "from": from_addr,
                    "date": date_str,
                    "body": body[:500] + "..." if len(body) > 500 else body  # Truncate long bodies
                })
    
    imap.close()
    imap.logout()
    
    return email_list

def mark_as_read(email_ids):
    """Mark specific emails as read"""
    creds = load_credentials()
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(creds['email'], creds['app_password'])
    imap.select("INBOX")
    
    for email_id in email_ids:
        imap.store(email_id, '+FLAGS', '\\Seen')
    
    imap.close()
    imap.logout()

if __name__ == "__main__":
    print("🌱 Bonsai_Burner420 checking Gmail inbox...\n")
    
    # Check for unread emails
    unread = read_inbox(limit=20, unread_only=True)
    
    if not unread:
        print("✅ No unread emails")
    else:
        print(f"📧 Found {len(unread)} unread email(s):\n")
        for i, email_data in enumerate(unread, 1):
            print(f"{i}. From: {email_data['from']}")
            print(f"   Subject: {email_data['subject']}")
            print(f"   Date: {email_data['date']}")
            print(f"   Body preview: {email_data['body'][:150]}...")
            print()
    
    # Also show 5 most recent (read or unread)
    print("\n📬 Last 5 emails (all):")
    recent = read_inbox(limit=5, unread_only=False)
    for i, email_data in enumerate(recent, 1):
        print(f"{i}. {email_data['subject']} (from {email_data['from']})")
