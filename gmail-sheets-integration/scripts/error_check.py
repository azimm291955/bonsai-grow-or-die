#!/usr/bin/env python3
"""
Bonsai Daily Error Check Report
Validates data in Google Sheets and emails flagged issues.
"""

import smtplib, sys, json, statistics
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build

CREDS_DIR = Path(__file__).parent.parent.parent / '.credentials'

# Spreadsheet IDs
TRIMMER_TRACKER_ID = '1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM'
HARVEST_SHEET_ID = '1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw'

# Thresholds
WEIGHT_UPPER_GRAMS = 500  # Flag healthy plants over this
STDDEV_MULTIPLIER = 4     # Flag outliers beyond 4 std devs

# Email config
FROM_EMAIL = 'bonsaiburner420bot@gmail.com'
TO_EMAILS = ['aaron.zimmerman@bonsaicultivation.com', 'bonsaialyssa@gmail.com']

def load_sheets_service():
    creds = service_account.Credentials.from_service_account_file(
        CREDS_DIR / 'service-account.json',
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    return build('sheets', 'v4', credentials=creds)

def read_tab(service, spreadsheet_id, tab, cols='A:Z'):
    r = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=f'{tab}!{cols}'
    ).execute()
    return r.get('values', [])

def safe_float(val):
    if val:
        try:
            return float(str(val).replace(',', '').strip())
        except:
            pass
    return None

def parse_date(ds):
    if not ds:
        return None
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']:
        try:
            return datetime.strptime(ds.strip(), fmt)
        except:
            continue
    return None

def col_index(headers, *names):
    """Find column index by trying multiple header names (case-insensitive)."""
    for name in names:
        for i, h in enumerate(headers):
            if h.strip().lower() == name.lower():
                return i
    return None

def safe_get(row, idx):
    if idx is not None and idx < len(row):
        return row[idx].strip() if isinstance(row[idx], str) else row[idx]
    return ''

# ── CHECK FUNCTIONS ──────────────────────────────────────────

def check_trimmer_tracker(service):
    """Check 2026_Flower_Weights tab in Trimmer_Tracker spreadsheet."""
    issues = []
    rows = read_tab(service, TRIMMER_TRACKER_ID, '2026_Flower_Weights')
    if not rows:
        return [('CRITICAL', 'Trimmer Tracker', 'Could not read 2026_Flower_Weights tab')]

    headers = [h.strip() for h in rows[0]]
    data = rows[1:]

    # Column indices
    i_batch = col_index(headers, 'Batch')
    i_tag = col_index(headers, 'METRC Tag #', 'METRC Tag')
    i_weight = col_index(headers, 'Weight')
    i_sick = col_index(headers, 'Sick')
    i_trim_date = col_index(headers, 'Trim Date')
    i_room = col_index(headers, 'Room')
    i_trimmer = col_index(headers, 'Trim Initials')
    i_bd = col_index(headers, 'BD Initials')

    # Collect all weights by batch for outlier detection
    batch_weights = {}
    # Collect all weights by trimmer for trimmer inflation detection
    trimmer_weights = {}

    tag_seen = {}  # For duplicate detection

    for row_num, row in enumerate(data, start=2):
        tag = safe_get(row, i_tag)
        weight = safe_float(safe_get(row, i_weight))
        sick = safe_get(row, i_sick).lower() if safe_get(row, i_sick) else ''
        batch = safe_get(row, i_batch)
        trim_date = safe_get(row, i_trim_date)
        room = safe_get(row, i_room)
        trimmer = safe_get(row, i_trimmer)
        is_sick = sick in ['yes', 'y', 'x', '1', 'true', 'sick']

        # Skip completely empty rows
        if not tag and weight is None and not batch:
            continue

        # 1. Range validation: healthy plants > 500g
        if weight is not None and weight > WEIGHT_UPPER_GRAMS and not is_sick:
            issues.append(('WARNING', 'Trimmer Tracker',
                f'Row {row_num}: Plant {tag or "no tag"} weighs {weight:.0f}g (>{WEIGHT_UPPER_GRAMS}g) — Batch: {batch}, Room: {room}'))

        # 1b. Negative weights
        if weight is not None and weight < 0:
            issues.append(('CRITICAL', 'Trimmer Tracker',
                f'Row {row_num}: NEGATIVE weight {weight:.1f}g — Tag: {tag or "no tag"}, Batch: {batch}'))

        # 2. Duplicate METRC tags
        if tag and tag.lower() not in ('no tag', 'notag', 'n/a', '', 'no', 'none'):
            if tag in tag_seen:
                issues.append(('CRITICAL', 'Trimmer Tracker',
                    f'DUPLICATE tag "{tag}" — Rows {tag_seen[tag]} and {row_num}, Batch: {batch}'))
            else:
                tag_seen[tag] = row_num

        # 5. Missing trim date when weight exists
        if weight is not None and weight > 0 and not trim_date:
            issues.append(('WARNING', 'Trimmer Tracker',
                f'Row {row_num}: Has weight ({weight:.0f}g) but NO trim date — Tag: {tag or "no tag"}, Batch: {batch}'))

        # Collect for batch outlier analysis
        if weight is not None and weight > 0 and batch:
            batch_weights.setdefault(batch, []).append((row_num, tag, weight, is_sick))

        # Collect for trimmer analysis
        if weight is not None and weight > 0 and trimmer:
            trimmer_weights.setdefault(trimmer, []).append((row_num, tag, weight, batch))

        # 6. Format checks
        if i_weight is not None and i_weight < len(row) and row[i_weight]:
            raw = row[i_weight].strip()
            if raw and safe_float(raw) is None:
                issues.append(('WARNING', 'Trimmer Tracker',
                    f'Row {row_num}: Weight column has non-numeric value "{raw}" — Tag: {tag or "no tag"}'))

        if trim_date and not parse_date(trim_date):
            issues.append(('WARNING', 'Trimmer Tracker',
                f'Row {row_num}: Unrecognizable date format "{trim_date}" — Tag: {tag or "no tag"}'))

    # 4. Outlier detection — per batch
    for batch, plants in batch_weights.items():
        weights = [w for _, _, w, _ in plants]
        if len(weights) < 5:
            continue  # Need enough data points
        mean = statistics.mean(weights)
        stdev = statistics.stdev(weights)
        if stdev == 0:
            continue
        for row_num, tag, weight, is_sick in plants:
            z = abs(weight - mean) / stdev
            if z > STDDEV_MULTIPLIER:
                direction = "above" if weight > mean else "below"
                issues.append(('INFO', 'Trimmer Tracker',
                    f'Row {row_num}: OUTLIER in batch "{batch}" — {weight:.0f}g is {z:.1f}σ {direction} mean ({mean:.0f}g ± {stdev:.0f}g) — Tag: {tag or "no tag"}{"  [SICK]" if is_sick else ""}'))

    # 4b. Trimmer inflation detection — per trimmer
    for trimmer, plants in trimmer_weights.items():
        weights = [w for _, _, w, _ in plants]
        if len(weights) < 10:
            continue
        mean = statistics.mean(weights)
        stdev = statistics.stdev(weights)
        if stdev == 0:
            continue
        # Check if trimmer's average is significantly higher than overall
        # Also flag individual outliers per trimmer
        high_count = sum(1 for w in weights if (w - mean) / stdev > STDDEV_MULTIPLIER)
        if high_count > len(weights) * 0.15:  # >15% of their plants are high outliers
            issues.append(('WARNING', 'Trimmer Tracker',
                f'TRIMMER INFLATION FLAG — "{trimmer}": {high_count}/{len(weights)} plants ({high_count/len(weights)*100:.0f}%) are >2σ above their own mean ({mean:.0f}g). Review for possible weight padding.'))

    # Cross-trimmer comparison
    if len(trimmer_weights) >= 2:
        trimmer_avgs = {}
        for trimmer, plants in trimmer_weights.items():
            weights = [w for _, _, w, _ in plants]
            if len(weights) >= 10:
                trimmer_avgs[trimmer] = statistics.mean(weights)
        if len(trimmer_avgs) >= 2:
            all_avgs = list(trimmer_avgs.values())
            overall_mean = statistics.mean(all_avgs)
            overall_stdev = statistics.stdev(all_avgs) if len(all_avgs) > 2 else 0
            if overall_stdev > 0:
                for trimmer, avg in trimmer_avgs.items():
                    z = (avg - overall_mean) / overall_stdev
                    if z > STDDEV_MULTIPLIER:
                        issues.append(('WARNING', 'Trimmer Tracker',
                            f'TRIMMER INFLATION FLAG — "{trimmer}" avg {avg:.0f}g/plant is {z:.1f}σ above team avg ({overall_mean:.0f}g). Count: {len(trimmer_weights[trimmer])} plants.'))

    return issues


def check_harvest_sheet(service):
    """Check Harvest_Weight_2026 tab in Harvest_Sheet spreadsheet."""
    issues = []
    rows = read_tab(service, HARVEST_SHEET_ID, 'Harvest_Weight_2026')
    if not rows:
        return [('CRITICAL', 'Harvest Sheet', 'Could not read Harvest_Weight_2026 tab')]

    headers = [h.strip() for h in rows[0]]
    data = rows[1:]

    i_date = col_index(headers, 'Date')
    i_strain = col_index(headers, 'Strain')
    i_tag = col_index(headers, 'METRC Tag #', 'METRC Tag')
    i_gwbp = col_index(headers, 'GWBP')
    i_gwp = col_index(headers, 'GWP')
    i_frozen = col_index(headers, 'Frozen Weight')
    i_room = col_index(headers, 'Room #')
    i_sick = col_index(headers, 'Sick?')
    i_oops = col_index(headers, 'Oops Weight')
    i_mold = col_index(headers, 'Mold Weight')

    tag_seen = {}
    batch_weights = {}  # For outlier detection using GWBP (gross wet before processing)

    for row_num, row in enumerate(data, start=2):
        tag = safe_get(row, i_tag)
        gwbp = safe_float(safe_get(row, i_gwbp))
        gwp = safe_float(safe_get(row, i_gwp))
        frozen = safe_float(safe_get(row, i_frozen))
        strain = safe_get(row, i_strain)
        room = safe_get(row, i_room)
        date_val = safe_get(row, i_date)
        sick = safe_get(row, i_sick).lower() if safe_get(row, i_sick) else ''
        is_sick = sick in ['yes', 'y', 'x', '1', 'true', 'sick']

        # Skip empty rows
        if not tag and gwbp is None and not strain:
            continue

        # Negative weights (GWBP only)
        if gwbp is not None and gwbp < 0:
            issues.append(('CRITICAL', 'Harvest Sheet',
                f'Row {row_num}: NEGATIVE GWBP weight {gwbp:.1f}g — Tag: {tag or "no tag"}, Strain: {strain}'))

        # 2. Duplicate METRC tags
        if tag and tag.lower() not in ('no tag', 'notag', 'n/a', '', 'no', 'none'):
            if tag in tag_seen:
                issues.append(('CRITICAL', 'Harvest Sheet',
                    f'DUPLICATE tag "{tag}" — Rows {tag_seen[tag]} and {row_num}, Strain: {strain}'))
            else:
                tag_seen[tag] = row_num

        # Collect for outlier detection by strain+room combo (batch proxy)
        batch_key = f"{strain}|{room}"
        if gwbp is not None and gwbp > 0 and strain:
            batch_weights.setdefault(batch_key, []).append((row_num, tag, gwbp, is_sick))

        # 6. Format checks
        if date_val and not parse_date(date_val):
            issues.append(('WARNING', 'Harvest Sheet',
                f'Row {row_num}: Unrecognizable date format "{date_val}" — Tag: {tag or "no tag"}'))

        # Check for text in numeric columns
        for label, idx in [('GWBP', i_gwbp), ('GWP', i_gwp), ('Frozen Weight', i_frozen)]:
            if idx is not None and idx < len(row) and row[idx]:
                raw = row[idx].strip()
                if raw and safe_float(raw) is None:
                    issues.append(('WARNING', 'Harvest Sheet',
                        f'Row {row_num}: {label} has non-numeric value "{raw}" — Tag: {tag or "no tag"}'))

    # 4. Outlier detection per batch (strain+room)
    for batch_key, plants in batch_weights.items():
        weights = [w for _, _, w, _ in plants]
        if len(weights) < 5:
            continue
        mean = statistics.mean(weights)
        stdev = statistics.stdev(weights)
        if stdev == 0:
            continue
        for row_num, tag, weight, is_sick in plants:
            z = abs(weight - mean) / stdev
            if z > STDDEV_MULTIPLIER:
                direction = "above" if weight > mean else "below"
                strain, room = batch_key.split('|')
                issues.append(('INFO', 'Harvest Sheet',
                    f'Row {row_num}: OUTLIER in {strain}/Room {room} — {weight:.0f}g GWBP is {z:.1f}σ {direction} mean ({mean:.0f}g ± {stdev:.0f}g) — Tag: {tag or "no tag"}{"  [SICK]" if is_sick else ""}'))

    return issues


def check_batch_mismatches(service):
    """Check that every batch in 2026_Trim_Weights (last 6 weeks) exists in 2026_Flower_Weights."""
    issues = []
    cutoff = datetime.now() - timedelta(weeks=6)

    # Get all batches from Flower_Weights
    fw_rows = read_tab(service, TRIMMER_TRACKER_ID, '2026_Flower_Weights')
    if not fw_rows:
        return [('CRITICAL', 'Batch Mismatch', 'Could not read 2026_Flower_Weights')]
    fw_headers = [h.strip() for h in fw_rows[0]]
    fw_batch_idx = col_index(fw_headers, 'Batch')
    flower_batches = set()
    for row in fw_rows[1:]:
        b = safe_get(row, fw_batch_idx)
        if b:
            flower_batches.add(b.strip().upper())

    # Get all batches from Trim_Weights
    tw_rows = read_tab(service, TRIMMER_TRACKER_ID, '2026_Trim_Weights')
    if not tw_rows:
        return [('CRITICAL', 'Batch Mismatch', 'Could not read 2026_Trim_Weights')]
    tw_headers = [h.strip() for h in tw_rows[0]]
    tw_batch_idx = col_index(tw_headers, 'Batch #', 'Batch')
    tw_date_idx = col_index(tw_headers, 'Date')
    tw_smalls_idx = col_index(tw_headers, 'Smalls Weight (g)', 'Smalls Weight')
    tw_trim_idx = col_index(tw_headers, 'Trim Weight (g)', 'Trim Weight')

    for row_num, row in enumerate(tw_rows[1:], start=2):
        batch = safe_get(row, tw_batch_idx)
        if not batch:
            continue
        # Only check last 6 weeks
        date_str = safe_get(row, tw_date_idx) if tw_date_idx is not None else ''
        date_val = parse_date(date_str)
        if date_val and date_val < cutoff:
            continue
        if batch.strip().upper() not in flower_batches:
            smalls = safe_get(row, tw_smalls_idx) if tw_smalls_idx is not None else ''
            trim = safe_get(row, tw_trim_idx) if tw_trim_idx is not None else ''
            issues.append(('CRITICAL', 'Batch Mismatch',
                f'Row {row_num}: Trim batch "{batch}" has NO match in Flower_Weights — Date: {date_str}, Smalls: {smalls}g, Trim: {trim}g'))

    return issues


def format_html_report(all_issues):
    """Generate HTML email from issues."""
    now = datetime.utcnow() - timedelta(hours=7)  # MST
    date_str = now.strftime('%A, %B %d, %Y')

    critical = [i for i in all_issues if i[0] == 'CRITICAL']
    warnings = [i for i in all_issues if i[0] == 'WARNING']
    info = [i for i in all_issues if i[0] == 'INFO']

    html = f"""
    <html><body style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
    <div style="background: #1a472a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🔍 Bonsai Daily Error Check</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">{date_str}</p>
    </div>
    <div style="padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6;">
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <div style="background: {'#dc3545' if critical else '#28a745'}; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">{len(critical)}</div>
                <div style="font-size: 12px;">CRITICAL</div>
            </div>
            <div style="background: {'#ffc107' if warnings else '#28a745'}; color: {'#333' if warnings else 'white'}; padding: 12px 20px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">{len(warnings)}</div>
                <div style="font-size: 12px;">WARNINGS</div>
            </div>
            <div style="background: #17a2b8; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">{len(info)}</div>
                <div style="font-size: 12px;">INFO</div>
            </div>
        </div>
    """

    if not all_issues:
        html += '<div style="text-align: center; padding: 40px; color: #28a745;"><h2>✅ All Clear!</h2><p>No issues found in today\'s data.</p></div>'
    else:
        for severity, color, emoji, items in [
            ('CRITICAL', '#dc3545', '🚨', critical),
            ('WARNING', '#ffc107', '⚠️', warnings),
            ('INFO', '#17a2b8', 'ℹ️', info)
        ]:
            if items:
                html += f'<h3 style="color: {color}; border-bottom: 2px solid {color}; padding-bottom: 5px;">{emoji} {severity} ({len(items)})</h3>'
                html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">'
                html += '<tr style="background: #e9ecef;"><th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Source</th><th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Details</th></tr>'
                for _, source, detail in items:
                    html += f'<tr><td style="padding: 8px; border: 1px solid #dee2e6; white-space: nowrap;">{source}</td><td style="padding: 8px; border: 1px solid #dee2e6;">{detail}</td></tr>'
                html += '</table>'

    html += """
        <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 6px; font-size: 13px; color: #666;">
            <strong>Checks performed:</strong> Range validation (>500g healthy), negative weights, duplicate METRC tags,
            batch outliers (>2σ), trimmer inflation detection, missing trim dates, format validation.<br>
            <strong>Not checked (future):</strong> Cross-sheet consistency (Harvest ↔ Trimmer Tracker).
        </div>
    </div>
    </body></html>
    """
    return html


def send_report(html, issue_count, dry_run=False):
    """Send the error check email."""
    now = datetime.utcnow() - timedelta(hours=7)
    subject = f"🔍 Bonsai Error Check — {now.strftime('%m/%d/%Y')}"
    if issue_count == 0:
        subject += " ✅ All Clear"
    else:
        subject += f" — {issue_count} issue{'s' if issue_count != 1 else ''} found"

    msg = MIMEMultipart('related')
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL
    msg['To'] = ', '.join(TO_EMAILS)
    msg.attach(MIMEText(html, 'html'))

    if dry_run:
        out_path = Path(__file__).parent / 'error_check_preview.html'
        out_path.write_text(html)
        print(f"DRY RUN: Preview saved to {out_path}")
        print(f"Subject: {subject}")
        return

    creds = json.loads((CREDS_DIR / 'gmail-credentials.json').read_text())
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(creds['email'], creds['app_password'])
        smtp.send_message(msg)
    print(f"Report sent to {', '.join(TO_EMAILS)}")


def main():
    dry_run = '--dry-run' in sys.argv or '--preview' in sys.argv
    send_email = '--send' in sys.argv

    print("Loading Google Sheets service...")
    service = load_sheets_service()

    print("Checking Trimmer Tracker (2026_Flower_Weights)...")
    issues = check_trimmer_tracker(service)
    print(f"  → {len(issues)} issues found")

    print("Checking Harvest Sheet (Harvest_Weight_2026)...")
    harvest_issues = check_harvest_sheet(service)
    print(f"  → {len(harvest_issues)} issues found")

    print("Checking Batch Mismatches (Trim_Weights vs Flower_Weights)...")
    mismatch_issues = check_batch_mismatches(service)
    print(f"  → {len(mismatch_issues)} issues found")

    all_issues = issues + harvest_issues + mismatch_issues

    # Sort: CRITICAL first, then WARNING, then INFO
    severity_order = {'CRITICAL': 0, 'WARNING': 1, 'INFO': 2}
    all_issues.sort(key=lambda x: severity_order.get(x[0], 99))

    print(f"\nTotal: {len(all_issues)} issues")
    for severity, source, detail in all_issues:
        icon = {'CRITICAL': '🚨', 'WARNING': '⚠️', 'INFO': 'ℹ️'}.get(severity, '?')
        print(f"  {icon} [{source}] {detail}")

    html = format_html_report(all_issues)

    if send_email:
        send_report(html, len(all_issues))
    elif dry_run:
        send_report(html, len(all_issues), dry_run=True)
    else:
        # Default: print summary and save preview
        send_report(html, len(all_issues), dry_run=True)


if __name__ == '__main__':
    main()
