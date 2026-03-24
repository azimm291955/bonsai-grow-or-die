# Bonsai Yieldbook — Google Sheets Data Structure
*Generated 2026-02-10*

## Harvest_Sheet (ID: 1421hIJaj69XnZ16rIQ7S7cL-1P0sXEYe1UZiw5e7Ntw)

### Harvest_Weight_2024 (27,751 rows)
Columns: Date, Strain, METRC Tag #, GWBP, GWP, Frozen Weight, Room #, Freezer #, Rockwool?, Oops Weight, Mold Weight, Sick?, Client

### Harvest_Weight_2025 (38,605 rows)
Columns: Date, Strain, METRC Tag #, GWBP, GWP, Frozen Weight, Room #, Turn, Freezer #, Oops Weight, Mold Weight, Sick?, Client

### Harvest_Weight_2026 (8,306 rows)
Columns: Date, Strain, METRC Tag #, GWBP, GWP, Frozen Weight, Room #, Turn, Freezer #, Oops Weight, Mold Weight, Sick?, Client

**Note:** 2024 lacks "Turn" column (col index shifts). Each row = one plant. METRC Tag is 24-char. GWBP = gross weight before packaging (grams). GWP = gross weight packaged.

## Trimmer_Tracker (ID: 1_8z9bwpcrJR0Ev6N0o8YVvQ0lDDClfn_8bKN52mLxRM)

### Flower_Weights (trimmed weight per plant)

#### 2023_Flower_Weights (19,801 rows)
Columns: Batch, METRC Tag #, Weight, Waste Weight, Initials (First, Middle, Last), Sick ('Y' if yes), Trim Date, Empty, Room, Turn, Turn Count
**Note:** No "BD Initials" column (2024+ adds it at index 2)

#### 2024_Flower_Weights (27,498 rows)
Columns: Batch #, METRC Tag #, BD Initials, Weight, Initials, Sick, Trim Date, Empty, Room, Turn, Turn Count

#### 2025_Flower_Weights (36,387 rows)
Columns: Batch, METRC Tag #, BD Initials, Weight, Trim Initials, Sick, Trim Date, Empty, Room, Turn, Turn Count

#### 2026_Flower_Weights (7,920 rows)
Columns: same as 2025

### Trim_Weights (batch-level trim/smalls/mold breakdown)

#### 2023_Trim_Weights (2,542 rows)
Columns: Batch, Smalls Weight (g), Trim Weight (g), Mold/B Tier (g), Waste Weight (g), Date
**Note:** Many rows missing Date and some weight columns

#### 2024_Trim_Weights (668 rows)
Columns: Batch, Smalls Weight (g), Trim Weight (g), Mold/B Tier (g), Waste Weight (g), Date

#### 2025_Trim_Weights (1,207 rows)
Columns: Batch #, Smalls Weight (g), Trim Weight (g), Mold/B Tier (g), Waste Weight (g), Date

#### 2026_Trim_Weights (333 rows)
Columns: Batch #, Smalls Weight (g), Trim Weight (g), Mold/B Tier (g), Waste Weight (g), Date

## Flower_Projections (ID: 1UDyIj0Ko5rvBLs-lFSBpl77Y2cUdRrn-goE2h8w4xJw)

### Room_Production (97 rows)
Columns: Turn Count, Flower LBS, Dry Plants, Frozen LBS @15%, Frozen Plants, Smalls Weight @50%, Total LBS Produced, Healthy Plants, Sick Plants, 1st Day of Harvest, 1st Day of Trim, Grams Per Plant, Room

### Trimmed_Weights (64,218 rows)
Columns: Batch #, METRC Tag #, BD Initials, Weight, Initials (First, Middle, Last), Sick ('Y' if yes), Trim Date, Empty, Turn Count, Strain, Harvest Date
**Note:** This is a master view combining all years with Strain and Harvest Date columns added.

## Key Identifiers
- **METRC Tag**: 24-char tag (e.g. `1A4000A00010BF9000075904`) — unique per plant
- **Batch**: strain abbreviation + date + room (e.g. `ZP123124`, `BR111725_5`)
- **Turn Count**: room_turn format (e.g. `3_46` = Room 3, Turn 46)

## Total Data
- ~91,606 plant-level flower weights (Flower_Weights across years)
- ~74,662 harvest weights (Harvest_Weight across years)  
- ~4,750 batch trim records (Trim_Weights across years)
- ~64,218 combined trimmed weights (Trimmed_Weights master)
- ~97 room production summaries
