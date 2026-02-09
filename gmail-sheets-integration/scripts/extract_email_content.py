#!/usr/bin/env python3
"""
Extract full content from an email (including HTML with links).
"""

import imaplib
import email
from email.header import decode_header
import json
from pathlib import Path
import re

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

def extract_content_by_subject(subject_keyword, output_dir="downloads"):
    """
    Extract full email content and save to files
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
                    
                    # Extract text and HTML
                    text_content = None
                    html_content = None
                    
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        
                        if content_type == 'text/plain':
                            try:
                                text_content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            except:
                                pass
                        
                        elif content_type == 'text/html':
                            try:
                                html_content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            except:
                                pass
                    
                    # Save text content
                    if text_content:
                        text_file = output_path / 'email_text.txt'
                        with open(text_file, 'w') as f:
                            f.write(text_content)
                        print(f"📝 Saved text content to: {text_file}")
                    
                    # Save HTML content
                    if html_content:
                        html_file = output_path / 'email.html'
                        with open(html_file, 'w') as f:
                            f.write(html_content)
                        print(f"📄 Saved HTML content to: {html_file}")
                        
                        # Look for image URLs in HTML
                        img_urls = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html_content)
                        if img_urls:
                            print(f"\n🖼️  Found {len(img_urls)} image URL(s) in HTML:")
                            for url in img_urls:
                                print(f"   - {url}")
                    
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
        print("Usage: python3 extract_email_content.py <subject_keyword>")
        sys.exit(1)
    
    subject_keyword = sys.argv[1]
    print(f"🌱 Extracting email content for: '{subject_keyword}'\n")
    extract_content_by_subject(subject_keyword)
