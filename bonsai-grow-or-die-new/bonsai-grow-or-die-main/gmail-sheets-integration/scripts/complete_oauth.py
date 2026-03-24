#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""Complete OAuth flow with authorization code."""
import sys
import pickle
import os
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

# Allow insecure transport for localhost OAuth redirect
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

if len(sys.argv) < 2:
    print("Usage: complete_oauth.py <full_redirect_url>")
    sys.exit(1)

redirect_url = sys.argv[1]

workspace = Path.home() / ".openclaw/workspace"
creds_path = workspace / ".credentials/sheets-oauth-credentials.json"
token_path = workspace / ".credentials/sheets-token.pickle"

# Create flow
flow = InstalledAppFlow.from_client_secrets_file(
    str(creds_path), 
    SCOPES,
    redirect_uri='http://localhost'
)

# Exchange code for token
try:
    flow.fetch_token(authorization_response=redirect_url)
    creds = flow.credentials
    
    # Save token
    token_path.parent.mkdir(parents=True, exist_ok=True)
    with open(token_path, 'wb') as token:
        pickle.dump(creds, token)
    
    print("✅ SUCCESS! OAuth token saved.")
    print(f"Token stored at: {token_path}")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    sys.exit(1)
