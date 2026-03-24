#!/usr/bin/env python3
"""
Download all images (attachments and inline) from a specific Gmail email.
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

def download_images_by_subject(subject_keyword, output_dir="downloads"):
    """
    Download all images from emails matching a subject keyword
    Includes both attachments and inline images.
    
    Args:
        subject_keyword: Keyword to search in email subject
        output_dir: Directory to save images
    
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
                    
                    image_count = 0
                    
                    # Look for all parts
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        
                        # Check if this is an image
                        if content_type.startswith('image/'):
                            image_count += 1
                            
                            # Try to get filename
                            filename = part.get_filename()
                            if filename:
                                # Decode filename if needed
                                decoded_filename = decode_email_subject(filename)
                            else:
                                # Generate filename for inline images
                                content_id = part.get('Content-ID', '')
                                if content_id:
                                    # Clean up content ID
                                    content_id = content_id.strip('<>')
                                    decoded_filename = f"inline_{content_id.replace('@', '_')}.png"
                                else:
                                    # Use counter
                                    ext = content_type.split('/')[1]
                                    decoded_filename = f"image_{image_count}.{ext}"
                            
                            filepath = output_path / decoded_filename
                            
                            # Save image
                            try:
                                with open(filepath, "wb") as f:
                                    f.write(part.get_payload(decode=True))
                                
                                print(f"📎 Downloaded: {decoded_filename} ({content_type})")
                                downloaded_files.append(str(filepath))
                            except Exception as e:
                                print(f"❌ Error saving {decoded_filename}: {e}")
                    
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
        print("Usage: python3 download_all_images.py <subject_keyword>")
        sys.exit(1)
    
    subject_keyword = sys.argv[1]
    
    print(f"🌱 Searching for emails with subject containing: '{subject_keyword}'\n")
    
    files = download_images_by_subject(subject_keyword)
    
    if files:
        print(f"\n✅ Downloaded {len(files)} image(s):")
        for f in files:
            print(f"   - {f}")
    else:
        print("\n❌ No images found")
