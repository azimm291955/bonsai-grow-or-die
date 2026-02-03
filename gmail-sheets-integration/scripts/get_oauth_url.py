#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""Generate OAuth URL"""
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

workspace = Path.home() / ".openclaw/workspace"
creds_path = workspace / ".credentials/sheets-oauth-credentials.json"

flow = InstalledAppFlow.from_client_secrets_file(
    str(creds_path), 
    SCOPES,
    redirect_uri='http://localhost'
)

auth_url, _ = flow.authorization_url(
    access_type='offline',
    include_granted_scopes='true',
    prompt='consent'
)

print(auth_url)
