#!/usr/bin/env python3
"""
Bonsai Weekly Production Report
Generates and sends the weekly HTML email report.
Data sources: 2026_Trimmer_Tracker, 2026_Harvest_Sheet, 2026_Trim
"""

import pickle, smtplib, sys, json
from urllib.parse import quote
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from googleapiclient.discovery import build
from pathlib import Path

SPREADSHEET_ID = '1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw'
CREDS_DIR = Path(__file__).parent.parent.parent / '.credentials'
# Weekly goal schedule: list of (start_date, goal_lbs) tuples, ordered by date.
# The goal applies from start_date onward until the next entry.
# To change the goal mid-year, just add a new entry with the Monday it takes effect.
GOAL_WEEK0_LBS = 100.0  # 2 days × 50 lbs/day for partial first week
GOAL_WEEKLY_LBS = 250.0  # standard weekly goal (Mon-Sun)

GOAL_SCHEDULE = [
    ("2026-01-01", GOAL_WEEKLY_LBS),
    # ("2026-06-02", 300.0),  # example: bump to 300 starting week of June 2
]

def get_goal_for_week(monday):
    """Look up the goal for a given week's Monday from GOAL_SCHEDULE."""
    goal = GOAL_SCHEDULE[0][1]
    for date_str, g in GOAL_SCHEDULE:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        if monday >= d:
            goal = g
    return goal

def get_cumulative_goal(week_num):
    """Cumulative goal through a given week number. Week 0 = partial week (100 lbs)."""
    if week_num == 0:
        return GOAL_WEEK0_LBS
    return GOAL_WEEK0_LBS + (week_num * GOAL_WEEKLY_LBS)

GOAL_LBS = GOAL_WEEKLY_LBS  # alias for chart1 and table rows

def load_sheets_service():
    from google.oauth2 import service_account
    creds = service_account.Credentials.from_service_account_file(
        CREDS_DIR / 'service-account.json',
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    return build('sheets', 'v4', credentials=creds)

def read_tab(service, tab, cols='A:Z'):
    r = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID, range=f'{tab}!{cols}'
    ).execute()
    return r.get('values', [])

def parse_date(ds):
    if not ds: return None
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']:
        try: return datetime.strptime(ds.strip(), fmt)
        except: continue
    return None

def safe_float(row, idx):
    if len(row) > idx and row[idx]:
        try: return float(row[idx])
        except: pass
    return 0.0

def get_last_6_weeks(today=None):
    if today is None:
        today = datetime.now()
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)
    this_monday = today - timedelta(days=today.weekday())
    weeks = []
    for i in range(6, 0, -1):
        m = this_monday - timedelta(weeks=i)
        s = m + timedelta(days=6)
        weeks.append((m, s))
    return weeks

def get_week_number(monday):
    """Get the week number of the year (1-52)"""
    return monday.isocalendar()[1]

def calculate_all_weeks(today=None):
    service = load_sheets_service()
    weeks = get_last_6_weeks(today)
    
    # Load data
    print("Loading 2026_Trimmer_Tracker...")
    tt_raw = read_tab(service, '2026_Trimmer_Tracker', 'A:K')
    tt_h, tt_d = tt_raw[0], tt_raw[1:]
    
    print("Loading 2026_Harvest_Sheet...")
    hs_raw = read_tab(service, '2026_Harvest_Sheet', 'A:J')
    hs_h, hs_d = hs_raw[0], hs_raw[1:]
    
    print("Loading 2026_Trim...")
    tr_raw = read_tab(service, '2026_Trim', 'A:G')
    tr_h, tr_d = tr_raw[0], tr_raw[1:]
    
    # Column indices
    TT_METRC = tt_h.index('METRC Tag #')
    TT_WEIGHT = tt_h.index('Weight')
    TT_SICK = 5
    TT_DATE = tt_h.index('Trim Date')
    TT_ROOM = tt_h.index('Room')
    
    HS_DATE = hs_h.index('Date')
    HS_METRC = hs_h.index('METRC Tag #')
    HS_GWBP = hs_h.index('GWBP')
    HS_FROZEN = hs_h.index('Frozen Weight')
    
    TR_SMALLS = 1
    TR_TRIM = 2
    TR_MOLD = 3
    TR_DATE = 5
    
    # GWBP lookup by METRC tag
    gwbp_by_tag = {}
    for row in hs_d:
        if len(row) > HS_METRC and row[HS_METRC]:
            tag = row[HS_METRC].strip()
            if len(row) > HS_GWBP and row[HS_GWBP]:
                try: gwbp_by_tag[tag] = float(row[HS_GWBP])
                except: pass
    
    results = []
    
    for monday, sunday in weeks:
        # --- Trimmer Tracker ---
        buds_g = 0; plants_trimmed = 0; sick_count = 0; rooms = set()
        trimmed_gwbp_g = 0; trimmed_weight_g = 0
        room_data = {}  # room -> {plants, weight_g, gwbp_g}
        
        for row in tt_d:
            if len(row) <= TT_DATE or not row[TT_DATE]: continue
            d = parse_date(row[TT_DATE])
            if not d or not (monday <= d <= sunday): continue
            
            is_sick = len(row) > TT_SICK and str(row[TT_SICK]).strip().upper() in ('Y', 'YES')
            if is_sick:
                sick_count += 1
                continue
            
            w = safe_float(row, TT_WEIGHT)
            buds_g += w
            plants_trimmed += 1
            trimmed_weight_g += w
            
            room = str(row[TT_ROOM]).strip() if len(row) > TT_ROOM and row[TT_ROOM] else '?'
            rooms.add(room)
            if room not in room_data:
                room_data[room] = {'plants': 0, 'weight_g': 0, 'gwbp_g': 0}
            room_data[room]['plants'] += 1
            room_data[room]['weight_g'] += w
            
            if len(row) > TT_METRC and row[TT_METRC]:
                tag = row[TT_METRC].strip()
                if tag in gwbp_by_tag:
                    trimmed_gwbp_g += gwbp_by_tag[tag]
                    room_data[room]['gwbp_g'] += gwbp_by_tag[tag]
        
        # --- Trim tab ---
        smalls_g = 0; trim_g = 0; mold_g = 0
        for row in tr_d:
            if len(row) <= TR_DATE or not row[TR_DATE]: continue
            d = parse_date(row[TR_DATE])
            if not d or not (monday <= d <= sunday): continue
            smalls_g += safe_float(row, TR_SMALLS)
            trim_g += safe_float(row, TR_TRIM)
            mold_g += safe_float(row, TR_MOLD)
        
        # --- Harvest Sheet ---
        frozen_g = 0; plants_harvested = 0; frozen_plants = 0; gwbp_g = 0
        for row in hs_d:
            if len(row) <= HS_DATE or not row[HS_DATE]: continue
            d = parse_date(row[HS_DATE])
            if not d or not (monday <= d <= sunday): continue
            if len(row) > HS_METRC and row[HS_METRC] and len(row[HS_METRC].strip()) == 24:
                plants_harvested += 1
            gwbp_g += safe_float(row, HS_GWBP)
            fw = safe_float(row, HS_FROZEN)
            if fw > 0:
                frozen_g += fw
                frozen_plants += 1
        
        # Calculated
        buds_lbs = buds_g / 453.0
        smalls_lbs = smalls_g / 453.0
        trim_lbs = trim_g / 453.0
        mold_lbs = mold_g / 453.0
        frozen_lbs = frozen_g / 453.0
        gwbp_lbs = gwbp_g / 453.0
        gpp = buds_g / plants_trimmed if plants_trimmed > 0 else 0
        conv = (trimmed_weight_g / trimmed_gwbp_g * 100) if trimmed_gwbp_g > 0 else 0
        dry_equiv = buds_lbs + (frozen_lbs * 0.15)
        week_goal = get_goal_for_week(monday)
        delta = dry_equiv - week_goal
        
        # Room breakdown with conversion
        room_breakdown = {}
        for rm, rd in sorted(room_data.items()):
            rm_gpp = rd['weight_g'] / rd['plants'] if rd['plants'] > 0 else 0
            rm_conv = (rd['weight_g'] / rd['gwbp_g'] * 100) if rd['gwbp_g'] > 0 else 0
            room_breakdown[rm] = {
                'plants': rd['plants'],
                'gpp': rm_gpp,
                'conversion': rm_conv,
            }
        
        results.append({
            'monday': monday, 'sunday': sunday,
            'buds': buds_lbs, 'smalls': smalls_lbs, 'trim': trim_lbs,
            'mold': mold_lbs, 'frozen': frozen_lbs,
            'plants_harvested': plants_harvested, 'frozen_plants': frozen_plants,
            'plants_trimmed': plants_trimmed, 'sick': sick_count,
            'gpp': gpp, 'conversion': conv, 'gwbp': gwbp_lbs,
            'rooms': sorted(rooms), 'room_breakdown': room_breakdown,
            'dry_equiv': dry_equiv, 'goal': week_goal, 'delta': delta,
        })
    
    return results

def fmt(v, decimals=2):
    if decimals == 0:
        return f"{v:,.0f}"
    return f"{v:,.{decimals}f}"

def upload_chart_image(png_bytes):
    """Upload a PNG to QuickChart's image hosting and return URL."""
    import urllib.request, base64
    payload = json.dumps({
        "chart": "data:image/png;base64," + base64.b64encode(png_bytes).decode(),
    }).encode()
    # Use a free image host instead - just use imgbb or inline
    # Actually, let's upload to quickchart's short URL service
    import tempfile, os
    # Save locally first, we'll embed as CID in the email
    return png_bytes  # Return raw bytes, embed as CID


def render_chart1(results):
    """6-week production trend bar chart with goal line, rendered via matplotlib."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import io
    
    labels = [r['monday'].strftime('%-m/%-d/%Y') for r in results]
    values = [round(r['dry_equiv'], 1) for r in results]
    colors = ['#2ECC71' if v >= GOAL_LBS else '#E74C3C' for v in values]
    
    fig, ax = plt.subplots(figsize=(10, 5.5))
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FAFAFA')
    
    bars = ax.bar(labels, values, color=colors, width=0.6, zorder=2)
    
    # Goal line
    ax.axhline(y=GOAL_LBS, color='#2C3E50', linewidth=3, linestyle='--', zorder=10)
    
    # Data labels
    for bar, v in zip(bars, values):
        if v >= GOAL_LBS:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                    f'{v:.1f}', ha='center', va='bottom', fontweight='bold',
                    fontsize=13, color='#333', zorder=5)
        else:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() - (bar.get_height() - 150) * 0.15,
                    f'{v:.1f}', ha='center', va='top', fontweight='bold',
                    fontsize=13, color='#FFFFFF', zorder=11)
    
    ax.set_ylim(150, 350)
    ax.set_yticks(range(150, 375, 25))
    ax.set_ylabel('Dry Equivalent Production (lbs)', fontsize=13)
    ax.set_xlabel('Week', fontsize=13)
    ax.set_title('Weekly Flower Production - Last 6 Weeks', fontsize=18, fontweight='bold', color='#2d5016')
    ax.grid(axis='y', linewidth=0.5, color='#e0e0e0', zorder=1)
    ax.set_axisbelow(True)
    
    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, facecolor='#FFFFFF')
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def calculate_year_weekly(year, today=None):
    """Calculate weekly Dry Equivalent LBS for a year, with Week 0 for partial first week.
    
    Week 0: Jan 1 through the Friday before the first Monday.
    Week 1+: Monday-Sunday weeks starting from the first Monday of the year.
    If today is provided and year == today.year, only includes completed weeks.
    """
    service = load_sheets_service()
    
    tt_tab = f'{year}_Trimmer_Tracker'
    hs_tab = f'{year}_Harvest_Sheet'
    tr_tab = f'{year}_Trim'
    
    print(f"Loading {tt_tab}...")
    tt_raw = read_tab(service, tt_tab, 'A:K')
    tt_h, tt_d = tt_raw[0], tt_raw[1:]
    
    print(f"Loading {hs_tab}...")
    hs_raw = read_tab(service, hs_tab, 'A:J')
    hs_h, hs_d = hs_raw[0], hs_raw[1:]
    
    print(f"Loading {tr_tab}...")
    tr_raw = read_tab(service, tr_tab, 'A:G')
    tr_h, tr_d = tr_raw[0], tr_raw[1:]
    
    # Column indices
    TT_WEIGHT = tt_h.index('Weight')
    TT_SICK = 5
    TT_DATE = tt_h.index('Trim Date')
    
    HS_DATE = hs_h.index('Date')
    HS_FROZEN = hs_h.index('Frozen Weight')
    
    TR_SMALLS = 1; TR_TRIM = 2; TR_MOLD = 3; TR_DATE = 5
    
    jan1 = datetime(year, 1, 1)
    # First Monday of the year
    first_monday = jan1 + timedelta(days=(7 - jan1.weekday()) % 7)
    if first_monday == jan1 and jan1.weekday() == 0:
        first_monday = jan1  # Jan 1 is already a Monday
    
    # Determine end date
    if today and year == today.year:
        today = today.replace(hour=0, minute=0, second=0, microsecond=0)
        this_monday = today - timedelta(days=today.weekday())
        end = this_monday - timedelta(days=1)  # last completed Sunday
    else:
        end = datetime(year, 12, 31)
    
    # Build week ranges: Week 0 (partial), then Week 1+ (Mon-Sun)
    weeks = []
    
    # Week 0: Jan 1 to the Sunday before first Monday (if Jan 1 is not Monday)
    if first_monday > jan1:
        wk0_end = first_monday - timedelta(days=1)
        weeks.append((0, jan1, wk0_end))
    
    # Week 1+
    wk_num = 1
    m = first_monday
    while m + timedelta(days=6) <= end:
        weeks.append((wk_num, m, m + timedelta(days=6)))
        m += timedelta(weeks=1)
        wk_num += 1
    
    def calc_dry_equiv(start, stop):
        """Calculate dry equivalent lbs for a date range."""
        buds_g = 0
        for row in tt_d:
            if len(row) <= TT_DATE or not row[TT_DATE]: continue
            d = parse_date(row[TT_DATE])
            if not d or not (start <= d <= stop): continue
            is_sick = len(row) > TT_SICK and str(row[TT_SICK]).strip().upper() in ('Y', 'YES')
            if is_sick: continue
            buds_g += safe_float(row, TT_WEIGHT)
        
        frozen_g = 0
        for row in hs_d:
            if len(row) <= HS_DATE or not row[HS_DATE]: continue
            d = parse_date(row[HS_DATE])
            if not d or not (start <= d <= stop): continue
            frozen_g += safe_float(row, HS_FROZEN)
        
        return (buds_g / 453.0) + ((frozen_g / 453.0) * 0.15)
    
    results = []
    for wk_num, start, stop in weeks:
        dry_equiv = calc_dry_equiv(start, stop)
        results.append({
            'week_num': wk_num,
            'start': start,
            'end': stop,
            'dry_equiv': dry_equiv,
        })
    
    return results


def render_chart2(results, today=None):
    """Cumulative YTD production: 2025 vs 2026 with goal pace line."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker
    import numpy as np
    import io
    
    if today is None:
        today = datetime.now()
    
    print("Calculating 2025 weekly data...")
    data_2025 = calculate_year_weekly(2025)
    print("Calculating 2026 weekly data...")
    data_2026 = calculate_year_weekly(2026, today)
    
    # Build cumulative totals by week number
    def cumulate(data):
        cum = {}
        running = 0
        for r in data:
            running += r['dry_equiv']
            cum[r['week_num']] = running
        return cum
    
    cum_2025 = cumulate(data_2025)
    cum_2026 = cumulate(data_2026)
    
    # Only show weeks 0 through max week in 2026 data (no lookahead)
    max_week = max(cum_2026.keys()) if cum_2026 else 6
    show_weeks = list(range(0, max_week + 1))
    
    vals_2025 = [cum_2025.get(w) for w in show_weeks]
    vals_2026 = [cum_2026.get(w) for w in show_weeks]
    
    # Goal pace line: week 0 = 100, then +250/week
    goal_pace = [get_cumulative_goal(w) for w in show_weeks]
    
    # Adaptive sizing: wider as weeks grow
    chart_width = max(11, min(18, 8 + len(show_weeks) * 0.2))
    fig, ax = plt.subplots(figsize=(chart_width, 6))
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FAFAFA')
    
    # Plot 2025 — grey, muted
    x25 = [i for i, v in enumerate(vals_2025) if v is not None]
    y25 = [v for v in vals_2025 if v is not None]
    marker25 = 'o' if len(show_weeks) <= 20 else None
    ms25 = 5 if len(show_weeks) <= 20 else 0
    ax.plot(x25, y25, color='#95A5A6', linewidth=2.5, marker=marker25, markersize=ms25,
            markerfacecolor='#95A5A6', label='2025', zorder=3, alpha=0.8)
    
    # Plot 2026 — bold green
    x26 = [i for i, v in enumerate(vals_2026) if v is not None]
    y26 = [v for v in vals_2026 if v is not None]
    marker26 = 'o' if len(show_weeks) <= 20 else None
    ms26 = 7 if len(show_weeks) <= 20 else 0
    ax.plot(x26, y26, color='#2ECC71', linewidth=3, marker=marker26, markersize=ms26,
            markerfacecolor='#2ECC71', label='2026', zorder=4)
    
    # Shaded delta between 2025 and 2026
    common_x = [i for i in range(len(show_weeks)) if vals_2025[i] is not None and vals_2026[i] is not None]
    if len(common_x) >= 2:
        common_y25 = [vals_2025[i] for i in common_x]
        common_y26 = [vals_2026[i] for i in common_x]
        y25_arr = np.array(common_y25)
        y26_arr = np.array(common_y26)
        ax.fill_between(common_x, y25_arr, y26_arr,
                        where=(y26_arr >= y25_arr), interpolate=True,
                        color='#2ECC71', alpha=0.15, zorder=1)
        ax.fill_between(common_x, y25_arr, y26_arr,
                        where=(y26_arr < y25_arr), interpolate=True,
                        color='#E74C3C', alpha=0.15, zorder=1)
    
    # Goal pace line
    ax.plot(range(len(show_weeks)), goal_pace, color='#2C3E50', linewidth=2,
            linestyle='--', zorder=2, alpha=0.6, label=f'Goal Pace ({int(GOAL_LBS)}/wk)')
    
    # Data label on latest 2026 point
    if y26:
        last_x26 = x26[-1]
        last_y26 = y26[-1]
        ax.annotate(f'{last_y26:,.0f} lbs', xy=(last_x26, last_y26),
                    xytext=(12, 8), textcoords='offset points',
                    fontsize=11, fontweight='bold', color='#27AE60',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='#2ECC71', alpha=0.9),
                    zorder=10)
    
    # Data label on latest 2025 point at same week
    if y25 and x26:
        last_2025_val = vals_2025[x26[-1]] if x26[-1] < len(vals_2025) and vals_2025[x26[-1]] is not None else None
        if last_2025_val is not None:
            ax.annotate(f'{last_2025_val:,.0f} lbs', xy=(x26[-1], last_2025_val),
                        xytext=(12, -12), textcoords='offset points',
                        fontsize=10, fontweight='bold', color='#7F8C8D',
                        bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='#95A5A6', alpha=0.9),
                        zorder=10)
    
    # X-axis: monthly labels for 15+ weeks, week labels for fewer
    if len(show_weeks) <= 15:
        ax.set_xticks(range(len(show_weeks)))
        ax.set_xticklabels([f'Wk {w}' for w in show_weeks], fontsize=9)
    else:
        # Monthly markers: show "Jan", "Feb", etc. at roughly week 2, 6, 10...
        # Week 0=Jan1, Week 4~Feb, Week 8~Mar, etc.
        import calendar
        month_ticks = []
        month_labels = []
        for w_idx, w in enumerate(show_weeks):
            # Approximate month from week number
            approx_month = min(12, max(1, (w * 7 + 1) // 30 + 1))
            # Place label at first week of each month
            if w == 0 or (w > 0 and min(12, max(1, ((w-1) * 7 + 1) // 30 + 1)) != approx_month):
                month_ticks.append(w_idx)
                month_labels.append(calendar.month_abbr[approx_month])
        ax.set_xticks(month_ticks)
        ax.set_xticklabels(month_labels, fontsize=10)
        # Minor ticks for each week
        ax.set_xticks(range(len(show_weeks)), minor=True)
        ax.tick_params(axis='x', which='minor', length=3, width=0.5)
    
    # Y-axis: format with K for thousands
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(
        lambda x, p: f'{x:,.0f}' if x < 1000 else f'{x/1000:,.1f}K'))
    
    ax.set_ylabel('Cumulative Dry Equivalent LBS', fontsize=13)
    ax.set_xlabel('Week of Year', fontsize=13)
    ax.set_title('Year-to-Date Cumulative Production — 2026 vs 2025', fontsize=16, fontweight='bold', color='#2d5016')
    ax.legend(loc='upper left', fontsize=11, framealpha=0.9)
    ax.grid(axis='y', linewidth=0.5, color='#e0e0e0', zorder=0)
    ax.grid(axis='x', linewidth=0.3, color='#eee', zorder=0)
    ax.set_axisbelow(True)
    
    # Start y at 0
    ax.set_ylim(bottom=0)
    
    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, facecolor='#FFFFFF')
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def generate_html(results, today=None):
    if today is None:
        today = datetime.now()
    
    last = results[-1]
    week_num = get_week_number(last['monday'])
    
    # Averages
    avg_buds = sum(r['buds'] for r in results) / len(results)
    avg_conv = sum(r['conversion'] for r in results) / len(results)
    avg_gpp = sum(r['gpp'] for r in results) / len(results)
    avg_delta = sum(r['delta'] for r in results) / len(results)
    
    # 6-Week Totals
    tot_buds = sum(r['buds'] for r in results)
    tot_smalls = sum(r['smalls'] for r in results)
    tot_trim = sum(r['trim'] for r in results)
    tot_mold = sum(r['mold'] for r in results)
    tot_frozen = sum(r['frozen'] for r in results)
    tot_harvested = sum(r['plants_harvested'] for r in results)
    tot_frozen_plants = sum(r['frozen_plants'] for r in results)
    tot_trimmed = sum(r['plants_trimmed'] for r in results)
    tot_sick = sum(r['sick'] for r in results)
    tot_gpp = (tot_buds * 453.0) / tot_trimmed if tot_trimmed > 0 else 0  # back to grams for g/plant
    # Conversion: total buds grams / total GWBP grams (both from sums)
    tot_buds_g = sum(r['buds'] for r in results) * 453.0
    tot_gwbp_g = sum(r['gwbp'] for r in results) * 453.0
    tot_conv = (tot_buds_g / tot_gwbp_g * 100) if tot_gwbp_g > 0 else 0
    tot_gwbp = sum(r['gwbp'] for r in results)
    tot_dry = sum(r['dry_equiv'] for r in results)
    tot_goal = sum(r['goal'] for r in results)
    tot_delta = tot_dry - tot_goal
    
    # 6-Week Averages
    avg6_buds = tot_buds / len(results)
    avg6_smalls = tot_smalls / len(results)
    avg6_trim = tot_trim / len(results)
    avg6_mold = tot_mold / len(results)
    avg6_frozen = tot_frozen / len(results)
    avg6_harvested = tot_harvested / len(results)
    avg6_frozen_plants = tot_frozen_plants / len(results)
    avg6_trimmed = tot_trimmed / len(results)
    avg6_sick = tot_sick / len(results)
    avg6_gpp = tot_gpp  # same as total g/plant (it's a ratio)
    avg6_conv = tot_conv  # same ratio
    avg6_gwbp = tot_gwbp / len(results)
    avg6_dry = tot_dry / len(results)
    avg6_delta = avg6_dry - GOAL_LBS
    
    # Week-over-week change
    if len(results) >= 2:
        wow_change = last['dry_equiv'] - results[-2]['dry_equiv']
        wow_dir = "up" if wow_change > 0 else "down"
        wow_text = f"That's {wow_dir} {abs(wow_change):.2f} lbs from the week before."
    else:
        wow_text = ""
    
    # Summary text
    if last['delta'] >= 0:
        delta_text = f"{last['delta']:.2f} lbs over the goal line"
    else:
        delta_text = f"{abs(last['delta']):.2f} lbs under the goal line"
    
    summary = (
        f"Last week we achieved Dry Equivalent Production of {last['dry_equiv']:.2f} lbs, "
        f"{delta_text}. Solid conversion rate of {last['conversion']:.2f}% on "
        f"{last['plants_trimmed']} plants. {wow_text} Great work team - let's keep the momentum going!"
    )
    
    # Room breakdown for last week - equal width cells in a single row
    num_rooms = len(last['room_breakdown'])
    pct_width = int(100 / max(num_rooms, 1))
    room_cells = ""
    for rm, rd in last['room_breakdown'].items():
        conv_color = "#2ECC71" if rd['conversion'] > 10 else "#ffc107" if rd['conversion'] >= 9 else "#E74C3C"
        room_cells += f"""<td style="width:{pct_width}%;vertical-align:top;padding:0 6px">
        <div style="background:#e8f5e9;padding:14px;border-radius:8px;border-left:4px solid #2d5016">
          <div style="font-size:16px;font-weight:bold;color:#2d5016;margin-bottom:8px">Room {rm}</div>
          <div style="font-size:13px;color:#333;margin-bottom:4px"><strong>{rd['plants']}</strong> Plants Trimmed</div>
          <div style="font-size:13px;color:#333;margin-bottom:4px"><strong>{rd['gpp']:.2f}</strong> g/plant</div>
          <div style="font-size:13px;color:{conv_color};font-weight:bold"><strong>{rd['conversion']:.2f}%</strong> Conversion</div>
        </div>
      </td>"""
    
    # Table rows with alternating row colors
    row_index = [0]  # mutable counter
    def table_row(label, values, tot_val, avg_val, is_pct=False, is_int=False, is_rooms=False):
        bg = "#f0f7e6" if row_index[0] % 2 == 0 else "#ffffff"
        row_index[0] += 1
        
        cells = f'<td style="padding:8px;font-weight:bold;background:{bg};border-bottom:1px solid #e0e0e0;font-size:12px;white-space:nowrap">{label}</td>'
        for v in values:
            if is_rooms:
                cell = v
            elif is_pct:
                cell = f"{v:.2f}%"
            elif is_int:
                cell = f"{v:,}"
            else:
                cell = f"{v:,.2f}"
            cells += f'<td style="padding:8px;text-align:right;background:{bg};border-bottom:1px solid #e0e0e0;font-size:12px">{cell}</td>'
        
        # 6-Wk Total
        tot_bg = "#e8f0dc" if bg == "#f0f7e6" else "#e9ecef"
        if is_rooms:
            tot_cell = "-"
        elif is_pct:
            tot_cell = f"{tot_val:.2f}%"
        elif is_int:
            tot_cell = f"{tot_val:,}"
        else:
            tot_cell = f"{tot_val:,.2f}"
        cells += f'<td style="padding:8px;text-align:right;background:{tot_bg};font-weight:bold;border-bottom:1px solid #e0e0e0;font-size:12px">{tot_cell}</td>'
        
        # 6-Wk Avg
        if is_rooms:
            avg_cell = "-"
        elif is_pct:
            avg_cell = f"{avg_val:.2f}%"
        elif is_int:
            avg_cell = f"{avg_val:,.0f}"
        else:
            avg_cell = f"{avg_val:,.2f}"
        cells += f'<td style="padding:8px;text-align:right;background:{tot_bg};border-bottom:1px solid #e0e0e0;font-size:12px">{avg_cell}</td>'
        
        return f"<tr>{cells}</tr>"
    
    # Date headers
    date_headers = ""
    for r in results:
        label = f"{r['monday'].strftime('%-m/%-d/%Y')} - {r['sunday'].strftime('%-m/%-d/%Y')}"
        date_headers += f'<th style="padding:8px;background:#2d5016;color:white;text-align:center;font-size:11px;white-space:nowrap">{label}</th>'
    
    # Room strings
    room_strs = [" & ".join(r['rooms']) for r in results]
    
    # Build table body (tot, avg)
    rows = ""
    rows += table_row("Buds", [r['buds'] for r in results], tot_buds, avg6_buds)
    rows += table_row("Smalls", [r['smalls'] for r in results], tot_smalls, avg6_smalls)
    rows += table_row("Trim", [r['trim'] for r in results], tot_trim, avg6_trim)
    rows += table_row("Mold / B-Tier", [r['mold'] for r in results], tot_mold, avg6_mold)
    rows += table_row("Frozen LBS", [r['frozen'] for r in results], tot_frozen, avg6_frozen)
    rows += table_row("Plants Harvested", [r['plants_harvested'] for r in results], tot_harvested, avg6_harvested, is_int=True)
    rows += table_row("Frozen Plants", [r['frozen_plants'] for r in results], tot_frozen_plants, avg6_frozen_plants, is_int=True)
    rows += table_row("Plants Trimmed", [r['plants_trimmed'] for r in results], tot_trimmed, avg6_trimmed, is_int=True)
    rows += table_row("Sick Plants", [r['sick'] for r in results], tot_sick, avg6_sick, is_int=True)
    rows += table_row("Grams Per Plant", [r['gpp'] for r in results], tot_gpp, avg6_gpp)
    rows += table_row("Conversion Rate", [r['conversion'] for r in results], tot_conv, avg6_conv, is_pct=True)
    rows += table_row("GWBP LBS", [r['gwbp'] for r in results], tot_gwbp, avg6_gwbp)
    rows += table_row("Room Trimmed", room_strs, "-", "-", is_rooms=True)
    rows += table_row("Dry Equivalent Lbs", [r['dry_equiv'] for r in results], tot_dry, avg6_dry)
    rows += table_row("Goal Lbs", [r['goal'] for r in results], tot_goal, GOAL_LBS)
    rows += table_row("Delta", [r['delta'] for r in results], tot_delta, avg6_delta)
    
    # YTD summary — calculate true cumulative YTD from all 2026 weeks (wk 0 through current)
    ytd_2026 = calculate_year_weekly(today.year, today)
    ytd_actual = sum(r['dry_equiv'] for r in ytd_2026)
    max_wk = max(r['week_num'] for r in ytd_2026) if ytd_2026 else 0
    ytd_goal = get_cumulative_goal(max_wk)
    ytd_delta = ytd_actual - ytd_goal
    if ytd_delta >= 0:
        ytd_status = f"{ytd_delta:.2f} lbs Above Goal"
        ytd_color = "#28a745"
    else:
        ytd_status = f"{abs(ytd_delta):.2f} lbs Below Goal"
        ytd_color = "#dc3545"
    
    week_label = f"{last['monday'].strftime('%-m/%-d/%Y')} - {last['sunday'].strftime('%-m/%-d/%Y')}"
    generated = today.strftime("%A, %B %-d, %Y")
    
    html = f"""
<div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0">
<div style="max-width:1100px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
  
  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#333333 100%);color:white;padding:24px">
    <table style="width:100%;border:none">
      <tr>
        <td style="vertical-align:top">
          <img src="https://www.bonsaicultivation.com/wp-content/uploads/2024/07/Bonsai-Logo-Wht@3x.webp" alt="Bonsai Cultivation" style="height:50px;width:auto">
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="background:#2d5016;padding:8px 16px;border-radius:4px;font-size:14px;font-weight:bold;display:inline-block">Report {week_num} of 52</div>
        </td>
      </tr>
    </table>
    <h2 style="margin:16px 0 0;font-weight:normal;font-size:18px">Weekly Flower Production Report</h2>
    <p style="margin:8px 0 0;opacity:0.9;font-size:14px">Report for week: {week_label}</p>
    <p style="margin:4px 0 0;opacity:0.7;font-size:12px">Generated: {generated}</p>
  </div>
  
  <div style="padding:20px 24px;background:#f0f7e6;border-bottom:1px solid #ddd">
    <p style="margin:0;font-size:15px;line-height:1.6;color:#333">{summary}</p>
  </div>
  
  <div style="padding:16px 20px;background:#f0f7e6;border-bottom:1px solid #ddd">
    <h3 style="margin:0 0 12px;font-size:14px;color:#2d5016;font-weight:bold">Last Week Performance by Room</h3>
    <table style="width:100%;border:none;border-collapse:separate;border-spacing:0">
      <tr>{room_cells}</tr>
    </table>
  </div>
  
  <div style="padding:0 20px 20px;overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th style="padding:8px;background:#2d5016;color:white;text-align:left;font-size:12px">Metric</th>
          {date_headers}
          <th style="padding:8px;background:#1a3009;color:white;text-align:center;font-size:11px">6-Wk Total</th>
          <th style="padding:8px;background:#1a3009;color:white;text-align:center;font-size:11px">6-Wk Avg</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  </div>
  
  <div style="padding:20px;text-align:center;background:white">
    <img src="cid:chart1" alt="6-Week Production Trend" style="max-width:100%;height:auto;border-radius:8px">
  </div>
  
  <div style="padding:20px;text-align:center;background:white;border-top:1px solid #eee">
    <img src="cid:chart2" alt="Year-to-Date Production vs Goal" style="max-width:100%;height:auto;border-radius:8px">
  </div>
  
  <div style="padding:20px;background:#f0f7e6;border-top:1px solid #ddd">
    <h3 style="margin:0 0 8px;font-size:14px;color:#2d5016">2026 Year-to-Date Production</h3>
    <p style="margin:4px 0;font-size:14px;color:#333">
      Goal Weight: {ytd_goal:,.2f} lbs &nbsp;|&nbsp; Actual Weight: {ytd_actual:,.2f} lbs
    </p>
    <p style="margin:4px 0;font-size:16px;font-weight:bold;color:{ytd_color}">{ytd_status}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#666">Target Conversion Rate: ≥10% | Weekly Goal: {GOAL_LBS:.0f} lbs</p>
  </div>
  
  <div style="padding:16px 20px;background:#1a1a1a;color:#999;font-size:11px;text-align:center">
    This report was automatically generated by Bonsai_Burner420 🌱 for Bonsai Cultivation.
  </div>
  
</div>
</div>
"""
    return html, week_num, week_label

def send_report(to_email, today=None):
    if today is None:
        today = datetime.now()
    
    print("Calculating weekly production data...")
    results = calculate_all_weeks(today)
    
    print("Generating HTML report...")
    html, week_num, week_label = generate_html(results, today)
    
    subject = f"🌿 Bonsai Weekly Report {week_num}/52: {week_label}"
    
    # Render charts
    print("Rendering charts...")
    chart1_png = render_chart1(results)
    chart2_png = render_chart2(results)
    
    msg = MIMEMultipart('related')
    msg['From'] = 'bonsaiburner420bot@gmail.com'
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html, 'html'))
    
    img1 = MIMEImage(chart1_png, 'png')
    img1.add_header('Content-ID', '<chart1>')
    img1.add_header('Content-Disposition', 'inline', filename='chart1.png')
    msg.attach(img1)
    
    img2 = MIMEImage(chart2_png, 'png')
    img2.add_header('Content-ID', '<chart2>')
    img2.add_header('Content-Disposition', 'inline', filename='chart2.png')
    msg.attach(img2)
    
    print(f"Sending to {to_email}...")
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login('bonsaiburner420bot@gmail.com', 'tiak hlhy fvzw btmp')
        server.sendmail(msg['From'], to_email, msg.as_string())
    
    print(f"✅ Sent: {subject}")
    return results

if __name__ == "__main__":
    to = sys.argv[1] if len(sys.argv) > 1 else 'aaron.zimmerman@bonsaicultivation.com'
    send_report(to)
