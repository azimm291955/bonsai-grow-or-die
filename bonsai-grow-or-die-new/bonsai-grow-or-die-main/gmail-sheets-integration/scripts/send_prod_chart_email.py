#!/usr/bin/env python3
"""
Send production chart email
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
import json
from datetime import datetime

# Gmail credentials
GMAIL_USER = "bot@bonsaicultivation.com"
GMAIL_PASSWORD = "kzsz gxfa rjdk rcll"

def load_data():
    """Load weekly production data"""
    data_path = Path(__file__).parent.parent / "downloads" / "weekly_production_data.json"
    with open(data_path, 'r') as f:
        return json.load(f)

def generate_html_email(data):
    """Generate HTML email matching template"""
    
    # Get weeks in order
    weeks = list(data.keys())
    latest_week = weeks[-1]
    latest_data = data[latest_week]
    
    # Calculate 6-week averages
    avg_buds = sum(data[w]['trimmed_lbs'] for w in weeks) / len(weeks)
    avg_conversion = sum(data[w]['conversion_rate'] for w in weeks) / len(weeks)
    avg_grams_per_plant = sum(data[w]['grams_per_plant'] for w in weeks) / len(weeks)
    avg_delta = sum(data[w]['delta'] for w in weeks) / len(weeks)
    
    # Latest week stats
    latest_buds = latest_data['dry_equivalent_lbs']
    latest_conversion = latest_data['conversion_rate'] * 100
    latest_plants = latest_data['trimmed_count']
    latest_delta = latest_data['delta']
    
    # Previous week (for comparison)
    prev_week = weeks[-2]
    prev_buds = data[prev_week]['dry_equivalent_lbs']
    change_from_prev = latest_buds - prev_buds
    
    # Generate today's date
    today = datetime.now().strftime("%A, %B %-d, %Y")
    
    # Build summary message
    if latest_delta >= 0:
        summary = f"Last week we achieved Dry Equivalent Production of {latest_buds:.2f} lbs, {abs(latest_delta):.2f} lbs over the goal line."
    else:
        summary = f"Last week we achieved Dry Equivalent Production of {latest_buds:.2f} lbs, {abs(latest_delta):.2f} lbs under the goal line."
    
    conversion_msg = f"Conversion rate of {latest_conversion:.2f}% on {latest_plants} plants"
    if latest_conversion < 10:
        conversion_msg += " - let's push for 10%+ next week."
    else:
        conversion_msg += " - great conversion rate!"
    
    if change_from_prev > 0:
        change_msg = f"That's up {abs(change_from_prev):.2f} lbs from the week before."
    else:
        change_msg = f"That's down {abs(change_from_prev):.2f} lbs from the week before."
    
    summary += f" {conversion_msg} {change_msg} Great work team - let's keep the momentum going!"
    
    # Build data table rows
    table_rows = ""
    grand_totals = {
        'buds': 0,
        'smalls': 0,  # We don't have this data yet
        'trim': 0,  # We don't have this data yet
        'mold': 0,  # We don't have this data yet
        'frozen_lbs': 0,
        'plants_harvested': 0,
        'frozen_plants': 0,
        'plants_trimmed': 0,
        'sick_plants': 0,
        'dry_equiv': 0
    }
    
    for week in weeks:
        d = data[week]
        
        buds = d['trimmed_lbs']
        frozen_lbs = d['frozen_lbs']
        plants_trimmed = d['trimmed_count']
        frozen_plants = d['frozen_count']
        sick_plants = d['sick_count']
        grams_per_plant = d['grams_per_plant']
        conversion = d['conversion_rate'] * 100
        dry_equiv = d['dry_equivalent_lbs']
        goal = d['goal_lbs']
        delta = d['delta']
        
        # Update totals
        grand_totals['buds'] += buds
        grand_totals['frozen_lbs'] += frozen_lbs
        grand_totals['frozen_plants'] += frozen_plants
        grand_totals['plants_trimmed'] += plants_trimmed
        grand_totals['sick_plants'] += sick_plants
        grand_totals['dry_equiv'] += dry_equiv
        
        # Delta color
        delta_color = "#28a745" if delta >= 0 else "#dc3545"
        delta_text = f"+{delta:.2f}" if delta >= 0 else f"{delta:.2f}"
        
        table_rows += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">{week}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{buds:.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{frozen_lbs:.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{frozen_plants}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{plants_trimmed}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{sick_plants}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grams_per_plant:.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{conversion:.2f}%</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px; font-weight: bold;">{dry_equiv:.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{goal:.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px; color: {delta_color}; font-weight: bold;">{delta_text}</td>
        </tr>
        """
    
    # Grand total row
    avg_gpp = grand_totals['buds'] * 453 / grand_totals['plants_trimmed'] if grand_totals['plants_trimmed'] > 0 else 0
    table_rows += f"""
    <tr style="background: #f8f9fa; font-weight: bold;">
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">Grand Total</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grand_totals['buds']:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grand_totals['frozen_lbs']:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grand_totals['frozen_plants']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grand_totals['plants_trimmed']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{grand_totals['sick_plants']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px; font-weight: bold;">{grand_totals['dry_equiv']:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{len(weeks) * 250:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
    </tr>
    """
    
    # 6-week average row
    table_rows += f"""
    <tr style="background: #e9ecef;">
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 13px;">6-Wk Avg</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{avg_buds:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{avg_grams_per_plant:.2f}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{avg_conversion*100:.2f}%</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">-</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">{avg_delta:.2f}</td>
    </tr>
    """
    
    html = f"""
    <html>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); color: white; padding: 24px;">
            <div style="display: flex; margin-bottom: 12px;">
                <img src="https://www.bonsaicultivation.com/wp-content/uploads/2024/07/Bonsai-Logo-Wht@3x.webp" alt="Bonsai Cultivation" style="height: 50px; width: auto;">
            </div>
            <h2 style="margin: 0; font-weight: normal; font-size: 18px;">Weekly Flower Production Report</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Report for week: {latest_week}</p>
            <p style="margin: 4px 0 0; opacity: 0.7; font-size: 12px;">Generated: {today}</p>
        </div>
        
        <!-- Summary -->
        <div style="padding: 20px 24px; background: #f0f7e6; border-bottom: 1px solid #ddd;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333;">{summary}</p>
        </div>
        
        <!-- Key Metrics -->
        <div style="padding: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="min-width: 140px; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #2d5016;">{avg_buds:.2f}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Avg Buds (lbs)</div>
            </div>
            <div style="min-width: 140px; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">{avg_conversion*100:.2f}%</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Avg Conversion Rate</div>
            </div>
            <div style="min-width: 140px; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #2d5016;">{avg_grams_per_plant:.2f}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Avg Grams/Plant</div>
            </div>
            <div style="min-width: 140px; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: {'#28a745' if avg_delta >= 0 else '#dc3545'};">{"+" if avg_delta >= 0 else ""}{avg_delta:.2f}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Avg Delta vs Goal</div>
            </div>
        </div>
        
        <!-- Data Table -->
        <div style="padding: 0 20px 20px;">
            <h3 style="margin: 20px 0 12px; font-size: 16px; color: #333;">6-Week Production Summary</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #2d5016; color: white;">
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left; font-size: 12px;">Metric</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Buds</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Smalls</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Trim</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Mold</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Frozen LBS</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Plants Harv.</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Frozen Plants</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Plants Trim.</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Sick Plants</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">G/Plant</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Conv. Rate</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">GWBP LBS</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Room Trim.</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Dry Equiv</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Goal</th>
                            <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Chart -->
        <div style="padding: 20px; text-align: center; background: #f8f9fa;">
            <img src="cid:production_chart" style="max-width: 100%; height: auto;" alt="Weekly Production Chart">
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">Target Conversion Rate: ≥10% | Weekly Goal: 250 lbs (13,000 annual lbs / 52 weeks)</p>
        </div>
        
        <div style="padding: 20px; text-align: center; font-size: 11px; color: #999;">
            <p style="margin: 0;">Generated by Bonsai_Burner420 🌱</p>
        </div>
        
    </body>
    </html>
    """
    
    return html

def send_email(to_email, subject, html_body, chart_path):
    """Send HTML email with embedded chart image"""
    
    msg = MIMEMultipart('related')
    msg['Subject'] = subject
    msg['From'] = GMAIL_USER
    msg['To'] = to_email
    
    # HTML body
    html_part = MIMEText(html_body, 'html')
    msg.attach(html_part)
    
    # Embed chart image
    with open(chart_path, 'rb') as f:
        img = MIMEImage(f.read())
        img.add_header('Content-ID', '<production_chart>')
        img.add_header('Content-Disposition', 'inline', filename='production_chart.png')
        msg.attach(img)
    
    # Send
    print(f"📧 Sending email to {to_email}...")
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(GMAIL_USER, GMAIL_PASSWORD)
        smtp.send_message(msg)
    
    print("✅ Email sent successfully!")

if __name__ == "__main__":
    # Load data
    data = load_data()
    
    # Get latest week for subject
    weeks = list(data.keys())
    latest_week = weeks[-1]
    
    # Generate HTML
    html = generate_html_email(data)
    
    # Chart path
    chart_path = Path(__file__).parent.parent / "downloads" / "weekly_production_chart.png"
    
    # Send email
    subject = f"🌿 Bonsai Weekly Report: {latest_week}"
    send_email("aaron.zimmerman@bonsaicultivation.com", subject, html, chart_path)
