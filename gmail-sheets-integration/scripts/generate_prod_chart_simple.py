#!/usr/bin/env python3
"""
Generate the Bonsai Production Chart - Simple version for testing
"""

from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
import sys
import os

# Add Mission Control logging
sys.path.insert(0, '/root/.openclaw/workspace/mission-control/logging')
from python_logger import MissionControlLogger

# Initialize logger with PRODUCTION Convex URL
os.environ['CONVEX_HTTP_URL'] = 'https://compassionate-stork-327.convex.site'
logger = MissionControlLogger()

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
        mondays.append(monday)
    
    return mondays

def calculate_prod_chart_number(monday_date):
    """
    Calculate the Prod Chart # based on which Monday of the year.
    First Monday of the year = #1
    """
    # Find the first Monday of the year
    jan_1 = datetime(monday_date.year, 1, 1)
    days_to_monday = (7 - jan_1.weekday()) % 7  # Days until first Monday
    if days_to_monday == 0 and jan_1.weekday() != 0:
        days_to_monday = 7
    first_monday = jan_1 + timedelta(days=days_to_monday)
    
    # Calculate weeks difference
    weeks_diff = (monday_date - first_monday).days // 7
    
    return weeks_diff + 1

def create_chart(mondays, dry_equiv_values, output_path):
    """Create the production chart visualization"""
    
    # Get the Monday dates for chart number calculation
    latest_monday = mondays[-1]
    chart_number = calculate_prod_chart_number(latest_monday)
    
    # Create week labels (M/D - M/D format)
    week_labels = []
    for monday in mondays:
        sunday = monday + timedelta(days=6)
        label = f"{monday.month}/{monday.day} - {sunday.month}/{sunday.day}"
        week_labels.append(label)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Bar chart
    x_pos = range(len(week_labels))
    bars = ax.bar(x_pos, dry_equiv_values, color='#2E7D32', alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels on bars
    for i, (bar, value) in enumerate(zip(bars, dry_equiv_values)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 5,
                f'{value:.1f}',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax.set_xticks(x_pos)
    ax.set_xticklabels(week_labels, rotation=0, ha='center', fontsize=10)
    
    # Labels and title
    ax.set_ylabel('Dry Equivalent LBS', fontsize=12, fontweight='bold')
    ax.set_title('Bonsai Cultivation - Weekly Production', fontsize=16, fontweight='bold', pad=20)
    
    # Grid
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Y-axis range
    max_val = max(dry_equiv_values)
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
    
    return chart_number

def send_email(to_email, subject, body, attachment_path):
    """Send email with attachment using Gmail"""
    # Gmail credentials
    gmail_user = 'bot@bonsaicultivation.com'
    gmail_password = 'kzsz gxfa rjdk rcll'  # App password
    
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
    start_time = datetime.now()
    
    try:
        # Log start
        logger.log_analysis("Starting production chart generation")
        
        # Get last 6 Mondays
        mondays = get_last_6_mondays()
        
        # Sample data (from your last successful calculation)
        # 12/22, 12/29, 1/5, 1/12, 1/19, 1/26
        dry_equiv_values = [205.75, 242.73, 272.51, 289.77, 307.19, 255.40]
        
        print(f"📅 Generating chart for weeks:")
        for monday, value in zip(mondays, dry_equiv_values):
            sunday = monday + timedelta(days=6)
            print(f"   {monday.month}/{monday.day} - {sunday.month}/{sunday.day}: {value:.2f} lbs")
        print()
        
        # Generate chart
        output_path = Path(__file__).parent / 'bonsai_prod_chart.png'
        chart_number = create_chart(mondays, dry_equiv_values, output_path)
        
        # Log chart generation
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_analysis(
            f"Generated Prod Chart #{chart_number}",
            file="bonsai_prod_chart.png",
            duration=duration_ms,
            success=True,
            additionalData=f"Last 6 weeks production data"
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
            body += f"\n{week_label}: {value:.2f} lbs"
        
        body += "\n\n🌱 Bonsai_Burner420"
        
        send_email(to_email, subject, body, output_path)
        
        # Log email sent
        total_duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_email(
            f"Sent Prod Chart #{chart_number} email",
            recipient=to_email,
            file="bonsai_prod_chart.png",
            duration=total_duration_ms,
            success=True
        )
        
        print("\n✅ Production chart generated and sent!")
        
    except Exception as e:
        # Log error
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.log_analysis(
            "Production chart generation failed",
            duration=duration_ms,
            success=False,
            errorMessage=str(e)
        )
        print(f"\n❌ Error: {e}")
        raise
