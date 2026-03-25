# PowerShell script to update achievements in constants.ts
# Run from the project root directory

$filePath = "lib/constants.ts"

Write-Host "Reading file: $filePath" -ForegroundColor Cyan
$content = Get-Content $filePath -Raw

if ($null -eq $content) {
    Write-Host "ERROR: Could not read file at $filePath" -ForegroundColor Red
    exit 1
}

Write-Host "File loaded successfully. Starting updates..." -ForegroundColor Green

# Achievement #1 - first_harvest
$content = $content -replace `
  'desc: "This was the real date of Bonsai Cultivation.s first-ever harvest\. 420 lbs of wholesale flower, pulled from Room 2 in a converted warehouse in Denver\. You.re making history\.", maxProgress: 1 \}', `
  'desc: "The real date of Bonsai''s first harvest! The day the legend took root. 420 lbs of premium flower, harvested straight from the concrete jungle of a Denver warehouse. Room 2 didn''t just produce a harvest; it made history. Now, it''s your turn to grow the empire.", maxProgress: 1 }'

# Achievement #2 - harvest_10
$content = $content -replace `
  'desc: "Complete 10 harvests", maxProgress: 10 \}', `
  'desc: "Complete 10 harvests. Ten harvests deep! Zero compromises. You''ve mastered the art of the cycle, dialing in the lights, the feed, and the timing until it''s second nature. Crushing the double-digit mark proves you have the grit to dominate the Denver grind. You aren''t just growing plants anymore—you''re fueling an unstoppable momentum.", maxProgress: 10 }'

# Achievement #3 - harvest_30 (now 42)
$content = $content -replace `
  'name: "Harvest Machine", desc: "Complete 30 harvests", maxProgress: 30 \}', `
  'name: "Harvest Machine", desc: "42 harvests deep. The answer to everything. You''ve peered into the heart of the cycle and found the ultimate truth: quality is king. Don''t panic; you''ve officially mastered the galaxy.", maxProgress: 42 }'

# Achievement #4 - assembly_line
$content = $content -replace `
  'name: "Assembly Line", desc: "Harvest from 5\+ different rooms", maxProgress: 5 \}', `
  'name: "Assembly Line", desc: "Harvest 5+ different rooms. Beyond the walls of Room 2. You''ve scaled the legend across five different rooms, proving that your genius isn''t confined to a single space. Managing this much canopy requires more than just luck; it takes the vision of a mogul. The warehouse is breathing as one, and your empire is finally finding its true scale.", maxProgress: 5 }'

# Achievement #5 - crop_death
$content = $content -replace `
  'name: "Crop Death", desc: "Let a crop rot to 0%", maxProgress: 1 \}', `
  'name: "Crop Death", desc: "Let a crop rot to 0%. Watched it all turn to dust. The smell. The loss. Sometimes the best education comes from failure. You won''t make this mistake twice.", maxProgress: 1 }'

# Achievement #6 - rev_1m
$content = $content -replace `
  'name: "First Million", desc: "Reach \$1M total revenue", maxProgress: 1000000 \}', `
  'name: "First Million", desc: "Reach $1M total revenue. A million reasons why they should''ve never doubted you!", maxProgress: 1000000 }'

# Achievement #7 - rev_5m (now Ten-Bagger at $10M)
$content = $content -replace `
  'name: "Five Bagger", desc: "Reach \$5M total revenue", maxProgress: 5000000 \}', `
  'name: "Ten-Bagger", desc: "Reach $10M total revenue. The Eight-Figure Force. You''ve reached $10M in revenue! You''ve transformed that original Denver warehouse into a financial powerhouse. From the first 420 lbs to an eight-figure powerhouse, your momentum is crushing the competition!", maxProgress: 10000000 }'

# Achievement #8 - rev_25m (now The Centennial Sovereign at $100M)
$content = $content -replace `
  'name: "Diamond Hands", desc: "Reach \$25M total revenue", maxProgress: 25000000 \}', `
  'name: "The Centennial Sovereign", desc: "Reach $100M total revenue. The hundred-million-dollar mark has fallen. You''ve built a financial fortress that stands as the ultimate testament to your cultivation mastery. Every light, every room, and every harvest has led to this moment of absolute market supremacy. Your name is now synonymous with the Bonsai standard.", maxProgress: 100000000 }'

# Achievement #9 - cash_hoarder (now $5M)
$content = $content -replace `
  'name: "Cash Hoarder", desc: "Have \$2M\+ cash on hand at once", maxProgress: 2000000 \}', `
  'name: "Cash Hoarder", desc: "Have $5M+ cash on hand at once. Five million in cold, hard cash. You''ve stacked the bags so high they''re starting to crowd the canopy.", maxProgress: 5000000 }'

# Achievement #10 - red_month
$content = $content -replace `
  'name: "Red Month", desc: "Survive a month with negative cash flow", maxProgress: 1 \}', `
  'name: "Red Month", desc: "Survive a month with negative cash flow. Thirty days of deficit. One unbreakable spirit. You''ve navigated the hardest month in the warehouse''s history without losing your nerve.", maxProgress: 1 }'

Write-Host "Writing updated content back to file..." -ForegroundColor Cyan
Set-Content $filePath $content -Encoding UTF8

Write-Host "`n✅ All 10 achievements updated successfully!" -ForegroundColor Green
Write-Host "`nUpdated achievements:" -ForegroundColor Cyan
Write-Host "  1. First Harvest (improved description)" -ForegroundColor Gray
Write-Host "  2. Seasoned Grower (improved description)" -ForegroundColor Gray
Write-Host "  3. Harvest Machine (42 harvests, improved description)" -ForegroundColor Gray
Write-Host "  4. Assembly Line (improved description)" -ForegroundColor Gray
Write-Host "  5. Crop Death (improved description)" -ForegroundColor Gray
Write-Host "  6. First Million (improved description)" -ForegroundColor Gray
Write-Host "  7. Ten-Bagger ($10M, was $5M, improved description)" -ForegroundColor Gray
Write-Host "  8. The Centennial Sovereign ($100M, was $25M, improved description)" -ForegroundColor Gray
Write-Host "  9. Cash Hoarder ($5M, was $2M, improved description)" -ForegroundColor Gray
Write-Host " 10. Red Month (improved description)" -ForegroundColor Gray

Write-Host "`nCommitting changes..." -ForegroundColor Cyan
git add .
git commit -m "Update achievements 1-10 with improved descriptions and financial milestones"
git push origin main

Write-Host "`n✅ Changes committed and pushed to origin main!" -ForegroundColor Green
