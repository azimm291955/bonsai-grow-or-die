#!/root/.openclaw/workspace/gmail-sheets-integration/venv/bin/python3
"""
Read Google Sheets data using Google Sheets API v4.
Requires OAuth setup and token storage.
"""
import json
import sys
import pickle
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Scopes for read-only Sheets access
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def get_credentials():
    """Load or refresh OAuth credentials."""
    workspace = Path.home() / ".openclaw/workspace"
    token_path = workspace / ".credentials/sheets-token.pickle"
    creds_path = workspace / ".credentials/sheets-oauth-credentials.json"
    
    creds = None
    
    # Load existing token if available
    if token_path.exists():
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid credentials, run OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not creds_path.exists():
                raise FileNotFoundError(
                    f"OAuth credentials not found at {creds_path}\n"
                    "Please create OAuth credentials in Google Cloud Console and save as sheets-oauth-credentials.json"
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials for future use
        token_path.parent.mkdir(parents=True, exist_ok=True)
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def read_sheet(spreadsheet_id, range_name):
    """
    Read data from a Google Sheet.
    
    Args:
        spreadsheet_id: The spreadsheet ID (from the URL)
        range_name: A1 notation range (e.g., 'Sheet1!A1:Z100')
    
    Returns:
        dict: Response with values
    """
    try:
        creds = get_credentials()
        service = build('sheets', 'v4', credentials=creds)
        
        # Call the Sheets API
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        
        return {
            "status": "success",
            "row_count": len(values),
            "data": values
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def get_sheet_metadata(spreadsheet_id):
    """Get metadata about a spreadsheet (sheet names, properties)."""
    try:
        creds = get_credentials()
        service = build('sheets', 'v4', credentials=creds)
        
        # Get spreadsheet metadata
        spreadsheet = service.spreadsheets().get(
            spreadsheetId=spreadsheet_id
        ).execute()
        
        sheets = []
        for sheet in spreadsheet.get('sheets', []):
            props = sheet.get('properties', {})
            sheets.append({
                'title': props.get('title'),
                'sheetId': props.get('sheetId'),
                'index': props.get('index'),
                'gridProperties': props.get('gridProperties', {})
            })
        
        return {
            "status": "success",
            "title": spreadsheet.get('properties', {}).get('title'),
            "sheets": sheets
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  read_sheets.py metadata <spreadsheet_id>")
        print("  read_sheets.py read <spreadsheet_id> <range>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "metadata" and len(sys.argv) >= 3:
        spreadsheet_id = sys.argv[2]
        result = get_sheet_metadata(spreadsheet_id)
        print(json.dumps(result, indent=2))
    
    elif command == "read" and len(sys.argv) >= 4:
        spreadsheet_id = sys.argv[2]
        range_name = sys.argv[3]
        result = read_sheet(spreadsheet_id, range_name)
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid command or arguments")
        sys.exit(1)
