#!/usr/bin/env python3
"""
Complete Bonsai Production Chart Script

1. Calculates weekly production from Google Sheets (deduplicates by METRC Tag)
2. Generates chart PNG with red/green bars and 250 lb threshold
3. Sends email to Aaron
4. Logs to Mission Control

FIXED: Now properly deduplicates plants to avoid counting them twice
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import os
import pickle

# Add Mission Control logging
sys.path.insert(0, '/root/.openclaw/workspace/logging')
from mission_control_logger import MissionControlLogger

# Initialize logger
os.environ['CONVEX_HTTP_URL'] = 'https://compassionate-stork-327.convex.site'
logger = MissionControlLogger()

# Google Sheets imports
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Spreadsheet ID
FLOWER_PROJECTIONS_ID = '1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw'

def load_token():
    """Load OAuth token"""
    token_path = Path(__file__).parent.parent.parent / '.credentials' / 'sheets-token.pickle'
    with open(token_path, 'rb') as f:
        return pickle.load(f)

def read_sheet_range(spreadsheet_id, range_name):
    """Read a range from Google Sheets"""
    creds = load_token()
    service = build('sheets', 'v4', credentials=creds)
    
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    return result.get('values', [])

def parse_date(date_str):
    """Parse date from various formats"""
    if not date_str:
        return None
    
    formats = ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except:
            continue
    
    return None

def get_last_6_mondays():
    """Get the last 6 Mondays (not including current week's Monday)"""
    today = datetime.now()
    
    # Find the most recent Monday
    days_since_monday = (today.weekday() - 0) % 7
    last_monday = today - timedelta(days=days_since_monday)
    
    # If today is Monday-Saturday, go back one more week  
    if today.weekday() <= 6:
        last_monday = last_monday - timedelta(weeks=1)
    
    # Get the 6 weeks
    mondays = []
    for i in range(6):
        monday = last_monday - timedelta(weeks=(5-i))
        mondays.append(monday)
    
    return mondays

def calculate_weekly_production(mondays):
    """
    Calculate weekly production for the given Mondays from Google Sheets.
    DEDUPLICATES by METRC Tag# to count each plant only once.
    
    Returns:
        List of dry equivalent LBS values
    """
    print("🌱 Loading data from Google Sheets...\n")
    
    # Load Trimmed_Weights data
    print("📊 Reading Trimmed_Weights tab...")
    trimmed_data = read_sheet_range(FLOWER_PROJECTIONS_ID, 'Trimmed_Weights!A:K')
    trimmed_headers = trimmed_data[0]
    trimmed_rows = trimmed_data[1:]
    
    print(f"   Loaded {len(trimmed_rows):,} rows")
    
    # Find column indices
    metrc_tag_idx = trimmed_headers.index('METRC Tag #') if 'METRC Tag #' in trimmed_headers else None
    weight_idx = trimmed_headers.index('Weight') if 'Weight' in trimmed_headers else None
    trim_date_idx = trimmed_headers.index('Trim Date') if 'Trim Date' in trimmed_headers else None
    sick_idx = None
    for i, h in enumerate(trimmed_headers):
        if 'Sick' in h or 'sick' in h:
            sick_idx = i
            break
    
    # Load 2025_Harvest_Sheet data
    print("📊 Reading 2025_Harvest_Sheet tab...")
    harvest_data = read_sheet_range(FLOWER_PROJECTIONS_ID, '2025_Harvest_Sheet!A:P')
    harvest_headers = harvest_data[0]
    harvest_rows = harvest_data[1:]
    
    print(f"   Loaded {len(harvest_rows):,} rows\n")
    
    # Find harvest column indices
    harvest_date_idx = harvest_headers.index('Date') if 'Date' in harvest_headers else None
    frozen_idx = harvest_headers.index('Frozen Weight') if 'Frozen Weight' in harvest_headers else None
    
    if harvest_date_idx is None:
        raise ValueError("Could not find 'Date' column in 2025_Harvest_Sheet")
    if frozen_idx is None:
        raise ValueError("Could not find 'Frozen Weight' column in 2025_Harvest_Sheet")
    
    # Calculate for each week
    results = []
    
    for monday in mondays:
        sunday = monday + timedelta(days=6)
        
        # Deduplicate by (METRC Tag, Weight) pair - same plant with same weight = one entry
        seen_entries = set()
        trimmed_total = 0
        plant_count = 0
        
        for row in trimmed_rows:
            if len(row) > trim_date_idx:
                trim_date = parse_date(row[trim_date_idx])
                if trim_date and monday <= trim_date <= sunday:
                    # Get METRC tag
                    if len(row) > metrc_tag_idx and row[metrc_tag_idx]:
                        metrc_tag = str(row[metrc_tag_idx]).strip()
                        
                        # Only count valid 24-character tags
                        if len(metrc_tag) == 24:
                            # Check if sick
                            is_sick = False
                            if sick_idx and len(row) > sick_idx:
                                sick_val = str(row[sick_idx]).strip().upper()
                                is_sick = sick_val in ['Y', 'YES']
                            
                            # Get weight
                            if len(row) > weight_idx and row[weight_idx]:
                                try:
                                    weight = float(row[weight_idx])
                                    
                                    # Create unique key for this entry
                                    entry_key = (metrc_tag, weight)
                                    
                                    # Only count if not seen before and not sick
                                    if entry_key not in seen_entries and not is_sick:
                                        seen_entries.add(entry_key)
                                        trimmed_total += weight
                                        plant_count += 1
                                except:
                                    pass
        
        # Calculate frozen weight for the week
        frozen_total = 0
        for row in harvest_rows:
            if len(row) > harvest_date_idx:
                harvest_date = parse_date(row[harvest_date_idx])
                if harvest_date and monday <= harvest_date <= sunday:
                    if len(row) > frozen_idx and row[frozen_idx]:
                        try:
                            frozen = float(row[frozen_idx])
                            frozen_total += frozen
                        except:
                            pass
        
        # Calculate dry equivalent LBS
        # Dry Equivalent LBS = (Trimmed Weight grams / 453) + (Frozen weight grams / 453) × 15%
        trimmed_lbs = trimmed_total / 453.0
        frozen_lbs = (frozen_total / 453.0) * 0.15
        dry_equiv = trimmed_lbs + frozen_lbs
        
        results.append(dry_equiv)
        
        print(f"   {monday.month}/{monday.day} - {sunday.month}/{sunday.day}: {dry_equiv:.2f} lbs ({len(seen_entries)} entries)")
    
    print()
    return results

def calculate_prod_chart_number(monday_date):
    """Calculate the Prod Chart # based on which Monday of the year"""
    jan_1 = datetime(monday_date.year, 1, 1)
    days_to_monday = (7 - jan_1.weekday()) % 7
    if days_to_monday == 0 and jan_1.weekday() != 0:
        days_to_monday = 7
    first_monday = jan_1 + timedelta(days=days_to_monday)
    
    weeks_diff = (monday_date - first_monday).days // 7
    
    return weeks_diff + 1

def create_chart(mondays, dry_equiv_values, output_path):
    """Create the production chart with red/green bars and 250 lb threshold"""
    
    latest_monday = mondays[-1]
    chart_number = calculate_prod_chart_number(latest_monday)
    
    # Create week labels (formatted as dates)
    week_labels = []
    for monday in mondays:
        label = f"{monday.month}/{monday.day}/{monday.year}"
        week_labels.append(label)
    
    # Determine bar colors (red < 250, green >= 250)
    colors = ['#E57373' if val < 250 else '#66BB6A' for val in dry_equiv_values]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Bar chart
    x_pos = range(len(week_labels))
    bars = ax.bar(x_pos, dry_equiv_values, color=colors, alpha=0.9, edgecolor='black', linewidth=1)
    
    # Add value labels on bars
    for i, (bar, value) in enumerate(zip(bars, dry_equiv_values)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 5,
                f'{value:.1f}',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax.set_xticks(x_pos)
    ax.set_xticklabels(week_labels, rotation=0, ha='center', fontsize=10)
    
    # Labels and title
    ax.set_ylabel('Dry Equivalent Production (lbs)', fontsize=12, fontweight='bold')
    ax.set_xlabel('Week', fontsize=12, fontweight='bold')
    ax.set_title('Weekly Flower Production - Last 6 Weeks', fontsize=16, fontweight='bold', pad=20)
    
    # Add horizontal threshold line at 250 lbs
    ax.axhline(y=250, color='black', linestyle='--', linewidth=2, alpha=0.7)
    
    # Grid
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Y-axis range
    max_val = max(dry_equiv_values)
    ax.set_ylim(150, max_val * 1.1)
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Chart saved to: {output_path}")
    print(f"📊 Prod Chart # {chart_number}")
    
    return chart_number

def send_email(to_email, subject, body, attachment_path):
    """Send email with attachment using Gmail"""
    gmail_user = 'bonsaiburner420bot@gmail.com'
    gmail_password = 'tiak hlhy fvzw btmp'
    
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))
    
    with open(attachment_path, 'rb') as f:
        img = MIMEImage(f.read())
        img.add_header('Content-Disposition', 'attachment', filename='Bonsai_Prod_Chart.png')
        msg.attach(img)
    
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.login(gmail_user, gmail_password)
    server.send_message(msg)
    server.quit()
    
    print(f"✅ Email sent to {to_email}")

if __name__ == "__main__":
    start_time = datetime.now()
    
    try:
        # Log start
        logger.log_analysis("Starting complete production chart process (deduplicated)")
        
        # Get last 6 Mondays
        mondays = get_last_6_mondays()
        
        print(f"📅 Calculating production for weeks:")
        for monday in mondays:
            sunday = monday + timedelta(days=6)
            print(f"   {monday.month}/{monday.day} - {sunday.month}/{sunday.day}")
        print()
        
        # Calculate production from Google Sheets (deduplicated)
        dry_equiv_values = calculate_weekly_production(mondays)
        
        # Generate chart with red/green styling
        output_path = Path(__file__).parent / 'bonsai_prod_chart.png'
        chart_number = create_chart(mondays, dry_equiv_values, output_path)
        
        # Log chart generation
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_analysis(
            f"Generated Prod Chart #{chart_number} from live data (deduplicated)",
            file="bonsai_prod_chart.png",
            duration=duration_ms,
            success=True
        )
        
        # Send email
        to_email = 'aaron.zimmerman@bonsaicultivation.com'
        subject = f"Bonsai Production Chart #{chart_number}"
        
        body = f"""Weekly Production Summary

Prod Chart # {chart_number}

Last 6 Weeks of Production:
"""
        
        for monday, value in zip(mondays, dry_equiv_values):
            sunday = monday + timedelta(days=6)
            week_label = f"{monday.month}/{monday.day}/{monday.year} - {sunday.month}/{sunday.day}"
            status = "✅" if value >= 250 else "⚠️"
            body += f"\n{status} {week_label}: {value:.2f} lbs"
        
        body += "\n\n🌱 Bonsai_Burner420"
        
        send_email(to_email, subject, body, output_path)
        
        # Log email sent
        total_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_email(
            f"Sent Prod Chart #{chart_number} email (deduplicated data)",
            recipient=to_email,
            file="bonsai_prod_chart.png",
            duration=total_duration_ms,
            success=True
        )
        
        print("\n✅ Production chart generated from live data and sent!")
        
    except Exception as e:
        # Log error
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_analysis(
            "Production chart process failed",
            duration=duration_ms,
            success=False,
            errorMessage=str(e)
        )
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
