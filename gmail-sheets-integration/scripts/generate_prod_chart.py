#!/usr/bin/env python3
"""
Generate the Bonsai Production Chart with weekly data and send via email.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from calculate_weekly_production import calculate_weekly_production

def get_last_6_mondays():
    """Get the last 6 Mondays (not including current week's Monday)"""
    today = datetime.now()
    
    # Find the most recent Monday (but not this week's if it hasn't finished)
    days_since_monday = (today.weekday() - 0) % 7  # 0 = Monday
    last_monday = today - timedelta(days=days_since_monday)
    
    # If today is Monday-Saturday, go back one more week
    if today.weekday() <= 6:  # Mon-Sun
        last_monday = last_monday - timedelta(weeks=1)
    
    # Get the 6 weeks
    mondays = []
    for i in range(6):
        monday = last_monday - timedelta(weeks=(5-i))
        # Format without leading zeros: M/D/YYYY
        mondays.append(f"{monday.month}/{monday.day}/{monday.year}")
    
    return mondays

def calculate_prod_chart_number(monday_str):
    """
    Calculate the Prod Chart # based on which Monday of the year.
    First Monday of the year = #1
    """
    # Parse date format M/D/YYYY
    parts = monday_str.split('/')
    month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
    monday = datetime(year, month, day)
    
    # Find the first Monday of the year
    jan_1 = datetime(monday.year, 1, 1)
    days_to_monday = (7 - jan_1.weekday()) % 7  # Days until first Monday
    if days_to_monday == 0 and jan_1.weekday() != 0:
        days_to_monday = 7
    first_monday = jan_1 + timedelta(days=days_to_monday)
    
    # Calculate weeks difference
    weeks_diff = (monday - first_monday).days // 7
    
    return weeks_diff + 1

def create_chart(results, output_path):
    """Create the production chart visualization"""
    
    # Get the data
    weeks = list(results.keys())
    dry_equiv = [results[w]['dry_equivalent_lbs'] for w in weeks]
    
    # Get the Monday dates for chart number calculation
    monday_dates = [results[w]['monday'] for w in weeks]
    latest_monday = monday_dates[-1]  # Use the last Monday for the chart number
    chart_number = calculate_prod_chart_number(latest_monday)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Bar chart
    x_pos = range(len(weeks))
    bars = ax.bar(x_pos, dry_equiv, color='#2E7D32', alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels on bars
    for i, (bar, value) in enumerate(zip(bars, dry_equiv)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 5,
                f'{value:.1f}',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Format week labels (remove year, format as M/D - M/D)
    formatted_weeks = []
    for w in weeks:
        parts = w.split(' - ')
        if len(parts) == 2:
            start = parts[0].split('/2')[0]  # Remove year from start
            end = parts[1]
            formatted_weeks.append(f"{start} - {end}")
        else:
            formatted_weeks.append(w)
    
    ax.set_xticks(x_pos)
    ax.set_xticklabels(formatted_weeks, rotation=0, ha='center', fontsize=10)
    
    # Labels and title
    ax.set_ylabel('Dry Equivalent LBS', fontsize=12, fontweight='bold')
    ax.set_title('Bonsai Cultivation - Weekly Production', fontsize=16, fontweight='bold', pad=20)
    
    # Grid
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Y-axis range
    max_val = max(dry_equiv)
    ax.set_ylim(0, max_val * 1.15)
    
    # Add "Prod Chart #" box in top right corner
    prod_chart_text = f"Prod Chart # {chart_number}"
    
    # Create a box with border
    box_x = 0.85
    box_y = 0.92
    box_width = 0.12
    box_height = 0.05
    
    # Add rectangle (transform from axes to figure coordinates)
    rect = patches.FancyBboxPatch(
        (box_x, box_y), box_width, box_height,
        boxstyle="round,pad=0.01",
        transform=fig.transFigure,
        facecolor='white',
        edgecolor='black',
        linewidth=2
    )
    fig.patches.append(rect)
    
    # Add text
    fig.text(box_x + box_width/2, box_y + box_height/2, prod_chart_text,
             ha='center', va='center',
             fontsize=12, fontweight='bold',
             transform=fig.transFigure)
    
    # Tight layout
    plt.tight_layout()
    
    # Save
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Chart saved to: {output_path}")
    print(f"📊 Prod Chart # {chart_number}")

def send_email(to_email, subject, body, attachment_path):
    """Send email with attachment using Gmail"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.image import MIMEImage
    
    # Gmail credentials
    gmail_user = 'bonsaiburner420bot@gmail.com'
    gmail_password = 'tiak hlhy fvzw btmp'  # App password
    
    # Create message
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = to_email
    msg['Subject'] = subject
    
    # Add body
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach image
    with open(attachment_path, 'rb') as f:
        img = MIMEImage(f.read())
        img.add_header('Content-Disposition', 'attachment', filename='Bonsai_Prod_Chart.png')
        msg.attach(img)
    
    # Send
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.login(gmail_user, gmail_password)
    server.send_message(msg)
    server.quit()
    
    print(f"✅ Email sent to {to_email}")

if __name__ == "__main__":
    spreadsheet_id = '1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw'
    
    # Get last 6 Mondays
    weeks = get_last_6_mondays()
    
    print(f"📅 Generating chart for weeks: {weeks}\n")
    
    # Calculate production data
    results = calculate_weekly_production(spreadsheet_id, weeks)
    
    # Generate chart
    output_path = Path(__file__).parent / 'bonsai_prod_chart.png'
    create_chart(results, output_path)
    
    # Send email
    to_email = 'aaron.zimmerman@bonsaicultivation.com'
    
    # Get chart number for subject
    latest_monday = weeks[-1]
    chart_number = calculate_prod_chart_number(latest_monday)
    
    subject = f"Bonsai Production Chart #{chart_number}"
    body = f"""Weekly Production Summary

Prod Chart # {chart_number}

Last 6 Weeks of Production:
"""
    
    for week_label, data in results.items():
        body += f"\n{week_label}: {data['dry_equivalent_lbs']:.2f} lbs"
    
    body += "\n\n🌱 Bonsai_Burner420"
    
    send_email(to_email, subject, body, output_path)
    
    print("\n✅ Production chart generated and sent!")
