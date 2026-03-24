#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""
One-time OAuth setup for Google Sheets API.
Generates an authorization URL that the user must visit.
"""
import json
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def setup_oauth():
    """Run OAuth flow and save credentials."""
    workspace = Path.home() / ".openclaw/workspace"
    creds_path = workspace / ".credentials/sheets-oauth-credentials.json"
    token_path = workspace / ".credentials/sheets-token.pickle"
    
    if not creds_path.exists():
        print(f"ERROR: OAuth credentials not found at {creds_path}")
        return
    
    # Create flow
    flow = InstalledAppFlow.from_client_secrets_file(
        str(creds_path), 
        SCOPES,
        redirect_uri='http://localhost'
    )
    
    # Generate authorization URL
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    print("\n" + "="*70)
    print("GOOGLE OAUTH AUTHORIZATION REQUIRED")
    print("="*70)
    print("\n1. Open this URL in your browser:")
    print(f"\n{auth_url}\n")
    print("2. Log in as: bot@bonsaicultivation.com")
    print("3. Grant permission to read Google Sheets")
    print("4. After approval, you'll be redirected to a URL like:")
    print("   http://localhost/?code=4/0A...")
    print("\n5. Copy the ENTIRE redirected URL and paste it below:")
    print("="*70 + "\n")
    
    redirect_response = input("Paste the full redirect URL here: ").strip()
    
    # Extract code and complete flow
    try:
        flow.fetch_token(authorization_response=redirect_response)
        creds = flow.credentials
        
        # Save token
        import pickle
        token_path.parent.mkdir(parents=True, exist_ok=True)
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
        
        print("\n✅ SUCCESS! OAuth token saved.")
        print(f"Token stored at: {token_path}")
        print("\nYou can now use read_sheets.py to access Google Sheets!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nMake sure you copied the ENTIRE redirect URL including http://localhost/?code=...")

if __name__ == "__main__":
    setup_oauth()
