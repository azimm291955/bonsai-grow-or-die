#!/usr/bin/env python3
"""
Download attachments from a specific Gmail email.
"""

import imaplib
import email
from email.header import decode_header
import json
import os
from pathlib import Path

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

def download_attachments_by_subject(subject_keyword, output_dir="downloads"):
    """
    Download attachments from emails matching a subject keyword
    
    Args:
        subject_keyword: Keyword to search in email subject
        output_dir: Directory to save attachments
    
    Returns:
        List of downloaded file paths
    """
    creds = load_credentials()
    
    # Connect to Gmail via IMAP
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(creds['email'], creds['app_password'])
    
    # Select inbox
    imap.select("INBOX")
    
    # Search for all emails
    status, messages = imap.search(None, "ALL")
    
    email_ids = messages[0].split()
    downloaded_files = []
    
    # Create output directory
    output_path = Path(__file__).parent.parent / output_dir
    output_path.mkdir(exist_ok=True)
    
    # Search through emails
    for email_id in reversed(email_ids):  # Most recent first
        status, msg_data = imap.fetch(email_id, "(RFC822)")
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Check if subject matches
                subject = decode_email_subject(msg["Subject"])
                if subject and subject_keyword.lower() in subject.lower():
                    print(f"✅ Found matching email: '{subject}'")
                    
                    # Look for attachments
                    for part in msg.walk():
                        content_disposition = part.get("Content-Disposition")
                        
                        if content_disposition and "attachment" in content_disposition:
                            filename = part.get_filename()
                            
                            if filename:
                                # Decode filename if needed
                                decoded_filename = decode_email_subject(filename)
                                filepath = output_path / decoded_filename
                                
                                # Save attachment
                                with open(filepath, "wb") as f:
                                    f.write(part.get_payload(decode=True))
                                
                                print(f"📎 Downloaded: {decoded_filename}")
                                downloaded_files.append(str(filepath))
                    
                    # Found the email, stop searching
                    break
        
        if downloaded_files:
            break
    
    imap.close()
    imap.logout()
    
    return downloaded_files

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 download_attachment.py <subject_keyword>")
        sys.exit(1)
    
    subject_keyword = sys.argv[1]
    
    print(f"🌱 Searching for emails with subject containing: '{subject_keyword}'\n")
    
    files = download_attachments_by_subject(subject_keyword)
    
    if files:
        print(f"\n✅ Downloaded {len(files)} attachment(s):")
        for f in files:
            print(f"   - {f}")
    else:
        print("\n❌ No attachments found")
