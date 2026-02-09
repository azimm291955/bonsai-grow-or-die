#!/usr/bin/env python3
"""
Inspect email structure to find images (attachments or inline).
"""

import imaplib
import email
from email.header import decode_header
import json
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

def inspect_email_by_subject(subject_keyword):
    """
    Inspect email structure for a given subject
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
    
    # Search through emails
    for email_id in reversed(email_ids):  # Most recent first
        status, msg_data = imap.fetch(email_id, "(RFC822)")
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Check if subject matches
                subject = decode_email_subject(msg["Subject"])
                if subject and subject_keyword.lower() in subject.lower():
                    print(f"✅ Found email: '{subject}'")
                    print(f"From: {msg.get('From')}")
                    print(f"Date: {msg.get('Date')}")
                    print(f"\n📋 Email structure:")
                    print(f"Multipart: {msg.is_multipart()}")
                    print(f"Content-Type: {msg.get_content_type()}")
                    print()
                    
                    # Walk through all parts
                    part_num = 0
                    for part in msg.walk():
                        part_num += 1
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition", ""))
                        filename = part.get_filename()
                        
                        print(f"Part {part_num}:")
                        print(f"  Content-Type: {content_type}")
                        print(f"  Content-Disposition: {content_disposition}")
                        print(f"  Filename: {filename}")
                        print(f"  Content-ID: {part.get('Content-ID', 'None')}")
                        
                        # Check for images
                        if content_type.startswith('image/'):
                            print(f"  🖼️  IMAGE FOUND!")
                            
                            # Try to get the payload size
                            try:
                                payload = part.get_payload(decode=True)
                                print(f"  Size: {len(payload)} bytes")
                            except:
                                print(f"  (Could not decode payload)")
                        
                        # Check text content
                        if content_type == 'text/plain' or content_type == 'text/html':
                            try:
                                payload = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                                preview = payload[:200] if len(payload) > 200 else payload
                                print(f"  Preview: {preview}...")
                            except:
                                pass
                        
                        print()
                    
                    # Found the email, stop searching
                    imap.close()
                    imap.logout()
                    return
    
    print("❌ Email not found")
    imap.close()
    imap.logout()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 inspect_email.py <subject_keyword>")
        sys.exit(1)
    
    subject_keyword = sys.argv[1]
    print(f"🌱 Inspecting email with subject containing: '{subject_keyword}'\n")
    inspect_email_by_subject(subject_keyword)
