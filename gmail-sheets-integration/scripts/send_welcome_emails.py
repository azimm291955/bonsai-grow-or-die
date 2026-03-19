#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""
Send Bonsai Yieldbook welcome emails to new users.
Themed to match the app's dark green aesthetic.
"""
import smtplib
import json
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

CRED_PATH = Path.home() / ".openclaw/workspace/.credentials/gmail-credentials.json"
APP_URL = "https://bonsai-production-data.vercel.app"

def load_credentials():
    with open(CRED_PATH) as f:
        return json.load(f)

def build_html(first_name, username, password, role="Grower"):
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0f0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:28px;padding-right:10px;">🌿</td>
                  <td style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Bonsai <span style="color:#22c55e;">Yieldbook</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#111a11;border:1px solid #1f2d1f;border-radius:12px;padding:40px 36px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;">Welcome, {first_name}! 🌱</p>
              <p style="margin:0 0 16px;font-size:15px;color:#86a086;line-height:1.6;">
                Your Bonsai Yieldbook account is ready. You now have access to live production data, harvest tracking, and analytics for Bonsai Cultivation.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#a8c8a8;line-height:1.7;background-color:#0d1a0f;border-left:3px solid #22c55e;padding:14px 16px;border-radius:0 6px 6px 0;">
                🙏 <strong style="color:#ffffff;">This is a first draft — and we need your help.</strong> We're building this app to actually be useful for <em>you</em>, and that means we need your honest feedback. What's confusing? What's missing? What would make your day easier? Please reach out to Aaron directly with anything — no matter how small. Your input is genuinely shaping what this becomes.
              </p>

              <!-- Divider -->
              <div style="height:1px;background-color:#1f2d1f;margin-bottom:28px;"></div>

              <!-- Credentials Box -->
              <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#22c55e;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d160d;border:1px solid #1f3a1f;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #1f3a1f;">
                    <span style="font-size:12px;color:#86a086;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">Username</span>
                    <span style="font-size:16px;font-weight:600;color:#ffffff;font-family:'Courier New',monospace;">{username}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="font-size:12px;color:#86a086;text-transform:uppercase;letter-spacing:0.8px;display:block;margin-bottom:4px;">Password</span>
                    <span style="font-size:16px;font-weight:600;color:#ffffff;font-family:'Courier New',monospace;">{password}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{APP_URL}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;">
                      Sign In to Yieldbook →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background-color:#1f2d1f;margin-bottom:24px;"></div>

              <!-- AI Feature Callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1a0f;border:1px solid #1a3a22;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">🤖 Built-in AI Assistant</p>
                    <p style="margin:0;font-size:14px;color:#86a086;line-height:1.6;">
                      Yieldbook includes an <strong style="color:#aaccaa;">AI-powered chat assistant</strong> — look for the green button in the corner once you're logged in. Ask it questions about the data, production trends, or anything cultivation-related. <strong style="color:#aaccaa;">This is an early draft</strong> — Aaron is actively looking for your feedback on how to make it more useful. Tell him what's working, what's missing, and what you'd want it to do.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Notes -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#86a086;text-transform:uppercase;letter-spacing:0.8px;">A few notes</p>
              <ul style="margin:0 0 0 0;padding:0;list-style:none;">
                <li style="font-size:14px;color:#6b8a6b;padding:5px 0;padding-left:20px;position:relative;">
                  <span style="color:#22c55e;position:absolute;left:0;">›</span> Log in with your <strong style="color:#aaccaa;">username</strong>, not your email address
                </li>
                <li style="font-size:14px;color:#6b8a6b;padding:5px 0;padding-left:20px;position:relative;">
                  <span style="color:#22c55e;position:absolute;left:0;">›</span> All data is live and updated from production sheets
                </li>

              </ul>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3d5c3d;">Bonsai Cultivation · Denver, Colorado</p>
              <p style="margin:4px 0 0;font-size:12px;color:#2a3d2a;">This email was sent by the Bonsai Yieldbook system.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def build_text(first_name, username, password):
    return f"""Welcome to Bonsai Yieldbook, {first_name}!

Your account is ready. Log in at:
{APP_URL}

--- YOUR CREDENTIALS ---
Username: {username}
Password: {password}

Note: Log in with your USERNAME, not your email address.

Questions? Reach out to Aaron directly.

---
Bonsai Cultivation · Denver, Colorado
"""

def send_welcome(to_email, first_name, username, password):
    creds = load_credentials()
    from_email = creds["email"]
    app_password = creds["app_password"].replace(" ", "")

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Bonsai Yieldbook <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = f"Welcome to Bonsai Yieldbook, {first_name}! 🌿"

    msg.attach(MIMEText(build_text(first_name, username, password), "plain"))
    msg.attach(MIMEText(build_html(first_name, username, password), "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(from_email, app_password)
            server.send_message(msg)
        print(f"  ✅ Sent → {to_email}")
        return True
    except Exception as e:
        print(f"  ❌ Failed → {to_email}: {e}")
        return False


if __name__ == "__main__":
    # Usage: script.py <to_email> <first_name> <username> <password>
    if len(sys.argv) == 5:
        _, email, fname, uname, pwd = sys.argv
        send_welcome(email, fname, uname, pwd)
    else:
        print("Usage: send_welcome_emails.py <email> <first_name> <username> <password>")
        sys.exit(1)
