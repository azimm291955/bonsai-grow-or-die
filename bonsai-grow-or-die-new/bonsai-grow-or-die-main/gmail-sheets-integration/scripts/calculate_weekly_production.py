#!/usr/bin/env python3
"""
Calculate weekly production from Trimmed_Weights and 2025_Harvest_Sheet.

Dry Equivalent LBS = (Trimmed Weight grams / 453) + (Frozen weight grams / 453) * 15%

Weeks are Monday-Sunday, starting on the given Mondays.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add parent directory to path to import read_sheets functions
sys.path.insert(0, str(Path(__file__).parent))

# We'll need to import the Google Sheets reading functionality
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def load_token():
    """Load OAuth token"""
    token_path = Path(__file__).parent.parent.parent / '.credentials' / 'sheets-token.pickle'
    import pickle
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
    
    # Try different formats
    formats = ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except:
            continue
    
    return None

def get_week_range(monday_str):
    """Get the date range for a week starting on the given Monday"""
    monday = datetime.strptime(monday_str, '%m/%d/%Y')
    sunday = monday + timedelta(days=6)
    return monday, sunday

def calculate_weekly_production(spreadsheet_id, weeks):
    """
    Calculate weekly production for the given weeks.
    
    Args:
        spreadsheet_id: Google Sheets ID for Flower_Projections
        weeks: List of Monday dates in format 'MM/DD/YYYY'
    
    Returns:
        Dict with weekly production data
    """
    
    print("🌱 Loading data from Google Sheets...\n")
    
    # Load Trimmed_Weights data (all rows - it's large)
    print("📊 Reading Trimmed_Weights tab...")
    trimmed_data = read_sheet_range(spreadsheet_id, 'Trimmed_Weights!A:O')
    trimmed_headers = trimmed_data[0]
    trimmed_rows = trimmed_data[1:]
    
    print(f"   Loaded {len(trimmed_rows):,} rows")
    print(f"   Headers: {trimmed_headers}")
    
    # Find column indices
    weight_idx = trimmed_headers.index('Weight') if 'Weight' in trimmed_headers else None
    trim_date_idx = trimmed_headers.index('Trim Date') if 'Trim Date' in trimmed_headers else None
    sick_idx = None
    for i, h in enumerate(trimmed_headers):
        if 'Sick' in h or 'sick' in h:
            sick_idx = i
            break
    
    print(f"   Weight column: {weight_idx}, Trim Date column: {trim_date_idx}, Sick column: {sick_idx}\n")
    
    # Load 2025_Harvest_Sheet data
    print("📊 Reading 2025_Harvest_Sheet tab...")
    harvest_data = read_sheet_range(spreadsheet_id, '2025_Harvest_Sheet!A:P')
    harvest_headers = harvest_data[0]
    harvest_rows = harvest_data[1:]
    
    print(f"   Loaded {len(harvest_rows):,} rows")
    print(f"   Headers: {harvest_headers}")
    
    # Find column indices
    frozen_idx = harvest_headers.index('Frozen Weight') if 'Frozen Weight' in harvest_headers else None
    harvest_date_idx = harvest_headers.index('Date') if 'Date' in harvest_headers else None
    metrc_tag_idx = harvest_headers.index('METRC Tag #') if 'METRC Tag #' in harvest_headers else None
    gwbp_idx = harvest_headers.index('GWBP') if 'GWBP' in harvest_headers else None
    
    print(f"   Frozen Weight: {frozen_idx}, Date: {harvest_date_idx}, METRC Tag: {metrc_tag_idx}, GWBP: {gwbp_idx}\n")
    
    # Load 2025_Trim data (Smalls, Trim, Mold)
    print("📊 Reading 2025_Trim tab...")
    trim_data = read_sheet_range(spreadsheet_id, '2025_Trim!A:G')
    trim_headers = trim_data[0]
    trim_rows = trim_data[1:]
    
    print(f"   Loaded {len(trim_rows):,} rows")
    print(f"   Headers: {trim_headers}")
    
    # Find column indices for Smalls, Trim, Mold
    smalls_idx = 1  # Column B: Smalls Weight (g)
    trim_idx = 2    # Column C: Trim Weight (g)
    mold_idx = 3    # Column D: Mold/B Tier (g)
    trim_date_idx_2025 = 5  # Column F: Date
    
    print(f"   Smalls: {smalls_idx}, Trim: {trim_idx}, Mold: {mold_idx}, Date: {trim_date_idx_2025}\n")
    
    # Calculate for each week
    results = {}
    
    for week_start in weeks:
        monday, sunday = get_week_range(week_start)
        # Format: "M/D/Y - M/D" (no leading zeros on end date)
        end_month = str(sunday.month)
        end_day = str(sunday.day)
        week_label = f"{monday.strftime('%-m/%-d/%Y')} - {end_month}/{end_day}"
        
        print(f"📅 Week: {week_label}")
        print(f"   Range: {monday.strftime('%Y-%m-%d')} to {sunday.strftime('%Y-%m-%d')}")
        
        # Sum trimmed weights for this week (excluding sick plants)
        trimmed_total_grams = 0
        trimmed_count = 0
        sick_count = 0
        sick_total_grams = 0
        
        for row in trimmed_rows:
            if len(row) > trim_date_idx and row[trim_date_idx]:
                trim_date = parse_date(row[trim_date_idx])
                if trim_date and monday <= trim_date <= sunday:
                    # Check if plant is sick
                    is_sick = False
                    if sick_idx is not None and len(row) > sick_idx:
                        sick_value = str(row[sick_idx]).strip().upper()
                        if sick_value == 'Y' or sick_value == 'YES':
                            is_sick = True
                    
                    if len(row) > weight_idx and row[weight_idx]:
                        try:
                            weight = float(row[weight_idx])
                            if is_sick:
                                sick_total_grams += weight
                                sick_count += 1
                            else:
                                trimmed_total_grams += weight
                                trimmed_count += 1
                        except ValueError:
                            pass
        
        # Sum frozen weights, count plants harvested, sum GWBP for this week
        frozen_total_grams = 0
        frozen_count = 0
        plants_harvested = 0
        gwbp_total_grams = 0
        
        for row in harvest_rows:
            if len(row) > harvest_date_idx and row[harvest_date_idx]:
                harvest_date = parse_date(row[harvest_date_idx])
                if harvest_date and monday <= harvest_date <= sunday:
                    # Count plants harvested (METRC Tag # must be 24 characters)
                    if len(row) > metrc_tag_idx and row[metrc_tag_idx]:
                        metrc_tag = str(row[metrc_tag_idx]).strip()
                        if len(metrc_tag) == 24:
                            plants_harvested += 1
                    
                    # Sum GWBP (Gross Weight Before Processing)
                    if len(row) > gwbp_idx and row[gwbp_idx]:
                        try:
                            gwbp = float(row[gwbp_idx])
                            gwbp_total_grams += gwbp
                        except ValueError:
                            pass
                    
                    # Sum frozen weights
                    if len(row) > frozen_idx and row[frozen_idx]:
                        try:
                            frozen_weight = float(row[frozen_idx])
                            frozen_total_grams += frozen_weight
                            frozen_count += 1
                        except ValueError:
                            pass
        
        # Sum Smalls, Trim, Mold for this week
        smalls_total_grams = 0
        trim_total_grams = 0
        mold_total_grams = 0
        smalls_count = 0
        trim_count = 0
        mold_count = 0
        
        for row in trim_rows:
            if len(row) > trim_date_idx_2025 and row[trim_date_idx_2025]:
                batch_date = parse_date(row[trim_date_idx_2025])
                if batch_date and monday <= batch_date <= sunday:
                    # Smalls
                    if len(row) > smalls_idx and row[smalls_idx]:
                        try:
                            smalls_weight = float(row[smalls_idx])
                            smalls_total_grams += smalls_weight
                            smalls_count += 1
                        except ValueError:
                            pass
                    
                    # Trim
                    if len(row) > trim_idx and row[trim_idx]:
                        try:
                            trim_weight = float(row[trim_idx])
                            trim_total_grams += trim_weight
                            trim_count += 1
                        except ValueError:
                            pass
                    
                    # Mold
                    if len(row) > mold_idx and row[mold_idx]:
                        try:
                            mold_weight = float(row[mold_idx])
                            mold_total_grams += mold_weight
                            mold_count += 1
                        except ValueError:
                            pass
        
        # Calculate dry equivalent lbs
        trimmed_lbs = trimmed_total_grams / 453.0
        sick_lbs = sick_total_grams / 453.0
        frozen_lbs = frozen_total_grams / 453.0
        smalls_lbs = smalls_total_grams / 453.0
        trim_lbs = trim_total_grams / 453.0
        mold_lbs = mold_total_grams / 453.0
        gwbp_lbs = gwbp_total_grams / 453.0
        dry_equivalent_lbs = trimmed_lbs + (frozen_lbs * 0.15)
        
        results[week_label] = {
            'monday': week_start,
            'trimmed_grams': trimmed_total_grams,
            'trimmed_lbs': trimmed_lbs,
            'trimmed_count': trimmed_count,
            'sick_grams': sick_total_grams,
            'sick_lbs': sick_lbs,
            'sick_count': sick_count,
            'frozen_grams': frozen_total_grams,
            'frozen_lbs': frozen_lbs,
            'frozen_count': frozen_count,
            'smalls_grams': smalls_total_grams,
            'smalls_lbs': smalls_lbs,
            'smalls_count': smalls_count,
            'trim_grams': trim_total_grams,
            'trim_lbs': trim_lbs,
            'trim_count': trim_count,
            'mold_grams': mold_total_grams,
            'mold_lbs': mold_lbs,
            'mold_count': mold_count,
            'plants_harvested': plants_harvested,
            'gwbp_grams': gwbp_total_grams,
            'gwbp_lbs': gwbp_lbs,
            'dry_equivalent_lbs': dry_equivalent_lbs
        }
        
        print(f"   Plants Harvested: {plants_harvested}")
        print(f"   GWBP:           {gwbp_total_grams:,.1f}g ({gwbp_lbs:.2f} lbs)")
        print(f"   Trimmed (Buds): {trimmed_total_grams:,.1f}g ({trimmed_lbs:.2f} lbs) from {trimmed_count} plants")
        if sick_count > 0:
            print(f"   Sick Plants:    {sick_total_grams:,.1f}g ({sick_lbs:.2f} lbs) from {sick_count} plants")
        print(f"   Frozen:         {frozen_total_grams:,.1f}g ({frozen_lbs:.2f} lbs) from {frozen_count} entries")
        print(f"   Smalls:         {smalls_total_grams:,.1f}g ({smalls_lbs:.2f} lbs) from {smalls_count} batches")
        print(f"   Trim:           {trim_total_grams:,.1f}g ({trim_lbs:.2f} lbs) from {trim_count} batches")
        print(f"   Mold:           {mold_total_grams:,.1f}g ({mold_lbs:.2f} lbs) from {mold_count} batches")
        print(f"   ✅ Dry Equivalent: {dry_equivalent_lbs:.2f} lbs")
        print()
    
    return results

if __name__ == "__main__":
    spreadsheet_id = '1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw'
    
    # The 6 weeks (Mondays)
    weeks = [
        '12/22/2025',
        '12/29/2025',
        '1/5/2026',
        '1/12/2026',
        '1/19/2026',
        '1/26/2026'
    ]
    
    # Target values from the chart (Dry Equivalent Lbs)
    targets = {
        '12/22/2025 - 12/28': 205.75,
        '12/29/2025 - 1/4': 242.73,
        '1/5/2026 - 1/11': 272.51,
        '1/12/2026 - 1/18': 289.77,
        '1/19/2026 - 1/25': 307.19,
        '1/26/2026 - 2/1': 255.40
    }
    
    # Target Buds values (for comparison)
    target_buds = {
        '12/22/2025 - 12/28': 203.49,
        '12/29/2025 - 1/4': 230.36,
        '1/5/2026 - 1/11': 257.41,
        '1/12/2026 - 1/18': 282.24,
        '1/19/2026 - 1/25': 307.19,
        '1/26/2026 - 2/1': 255.40
    }
    
    # Target Sick Plants
    target_sick = {
        '12/22/2025 - 12/28': 0,
        '12/29/2025 - 1/4': 0,
        '1/5/2026 - 1/11': 9,
        '1/12/2026 - 1/18': 3,
        '1/19/2026 - 1/25': 1,
        '1/26/2026 - 2/1': 0
    }
    
    # Target Plants Harvested (from template)
    target_plants_harvested = {
        '12/22/2025 - 12/28': 561,
        '12/29/2025 - 1/4': 568,
        '1/5/2026 - 1/11': 792,
        '1/12/2026 - 1/18': 677,
        '1/19/2026 - 1/25': 727,
        '1/26/2026 - 2/1': 658
    }
    
    # Target GWBP LBS (from template)
    target_gwbp_lbs = {
        '12/22/2025 - 12/28': 1903.98,
        '12/29/2025 - 1/4': 2258.58,
        '1/5/2026 - 1/11': 2645.79,
        '1/12/2026 - 1/18': 2595.08,
        '1/19/2026 - 1/25': 2695.41,
        '1/26/2026 - 2/1': 2616.78
    }
    
    results = calculate_weekly_production(spreadsheet_id, weeks)
    
    print("\n" + "="*70)
    print("📊 COMPARISON WITH TARGET VALUES")
    print("="*70 + "\n")
    
    for week_label, data in results.items():
        # Plants Harvested comparison
        target_plants = target_plants_harvested.get(week_label, 0)
        calculated_plants = data['plants_harvested']
        plants_match = "✅" if calculated_plants == target_plants else f"❌ ({calculated_plants} vs {target_plants})"
        
        # GWBP LBS comparison
        target_gwbp = target_gwbp_lbs.get(week_label, 0)
        calculated_gwbp = data['gwbp_lbs']
        gwbp_diff = calculated_gwbp - target_gwbp
        gwbp_match = "✅" if abs(gwbp_diff) < 0.01 else f"❌ {gwbp_diff:+.2f}"
        
        # Buds comparison
        target_bud = target_buds.get(week_label, 0)
        calculated_buds = data['trimmed_lbs']
        buds_diff = calculated_buds - target_bud
        buds_match = "✅" if abs(buds_diff) < 0.01 else f"❌ {buds_diff:+.2f}"
        
        # Sick plants comparison
        target_sick_count = target_sick.get(week_label, 0)
        calculated_sick = data['sick_count']
        sick_match = "✅" if calculated_sick == target_sick_count else f"❌ ({calculated_sick} vs {target_sick_count})"
        
        # Dry Equivalent comparison
        target = targets.get(week_label, 0)
        calculated = data['dry_equivalent_lbs']
        diff = calculated - target
        match = "✅ MATCH!" if abs(diff) < 0.01 else f"❌ Off by {diff:+.2f} lbs"
        
        print(f"{week_label}:")
        print(f"  Plants Harv:   Target: {target_plants} | Calc: {calculated_plants} | {plants_match}")
        print(f"  GWBP LBS:      Target: {target_gwbp:.2f} | Calc: {calculated_gwbp:.2f} | {gwbp_match}")
        print(f"  Buds:          Target: {target_bud:.2f} | Calc: {calculated_buds:.2f} | {buds_match}")
        print(f"  Sick Plants:   Target: {target_sick_count} | Calc: {calculated_sick} | {sick_match}")
        print(f"  Dry Equiv:     Target: {target:.2f} | Calc: {calculated:.2f} | {match}")
        print()
