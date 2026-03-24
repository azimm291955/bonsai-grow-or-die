#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""
Send email via Gmail using App Password.
"""
import smtplib
import json
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

def load_credentials():
    """Load Gmail credentials from workspace."""
    cred_path = Path.home() / ".openclaw/workspace/.credentials/gmail-credentials.json"
    if not cred_path.exists():
        raise FileNotFoundError(f"Credentials not found at {cred_path}")
    
    with open(cred_path) as f:
        return json.load(f)

def send_email(to_email, subject, body_text, body_html=None):
    """
    Send an email via Gmail SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        body_text: Plain text body
        body_html: Optional HTML body
    """
    creds = load_credentials()
    from_email = creds["email"]
    # Remove spaces from app password
    app_password = creds["app_password"].replace(" ", "")
    
    # Create message
    msg = MIMEMultipart("alternative")
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    # Attach text and HTML parts
    part1 = MIMEText(body_text, "plain")
    msg.attach(part1)
    
    if body_html:
        part2 = MIMEText(body_html, "html")
        msg.attach(part2)
    
    # Send via Gmail SMTP
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(from_email, app_password)
            server.send_message(msg)
        return {"status": "success", "message": f"Email sent to {to_email}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: send_email.py <to_email> <subject> <body_text> [body_html]")
        sys.exit(1)
    
    to = sys.argv[1]
    subject = sys.argv[2]
    text = sys.argv[3]
    html = sys.argv[4] if len(sys.argv) > 4 else None
    
    result = send_email(to, subject, text, html)
    print(json.dumps(result, indent=2))
