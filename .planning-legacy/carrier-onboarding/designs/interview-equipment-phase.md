# Interview — Equipment Phase

> Reference mockups: `onboard_questions.png`, `onboard_questions_cargo.png`

## Purpose
Phase 2 of the interview. Collects vehicle types, compliance information per type, and insurance attestation. The most complex branching phase.

## Question Sequence

### Q1: Vehicle Type Selection
- Question: "What types of vehicles do you run?"
- Input: Multi-select chip buttons (large, pill-shaped)
  - Semi Truck
  - Box Truck
  - Cargo Van
  - Personal Vehicle
- Multiple selections allowed (mixed fleet)
- On selection: compliance sub-questions reveal for each selected type

### Per-Type Sub-Questions

#### Semi Truck (selected)
Sub-questions with **blue left border** (required compliance):

1. **MC Authority — REQUIRED** (blue border, label tag)
   - "What is your MC number?"
   - Text input, pattern validation (1-8 digits)

2. **DOT Registration — REQUIRED** (blue border, label tag)
   - "What is your DOT number?"
   - Text input, pattern validation (1-8 digits)

3. **Insurance** (blue border)
   - Minimum badge: "$1,000,000 commercial auto · $100,000 cargo" (blue chip)
   - "What is your commercial insurance cost per month?"
   - Currency input ($ prefix)
   - Confirmation checkbox: "I confirm my policy meets the minimum coverage requirements listed above"

#### Box Truck (selected)
1. **GVWR Input** (no border — primary question)
   - "What is the Gross Vehicle Weight Rating (GVWR) of your box truck?"
   - Hint: "GVWR is the maximum operating weight... usually on the driver's side door frame"
   - Number input
   - **Live indicator below input** (updates as carrier types):
     - Green (< 10,000 lbs): "Under 10,000 lbs — no DOT registration needed"
     - Amber (10,001-26,000 lbs): "10,001-26,000 lbs — DOT registration optional for intrastate"
     - Red (> 26,001 lbs): "Over 26,001 lbs — DOT number required by federal law"

2. **DOT Registration** (red border, appears when GVWR > 26,001) — **REQUIRED**
   - "What is your DOT number?"
   - Hint: "Your DOT is a US DOT ID which requires an FMCSA registration for interstate commerce"
   - Text input

3. **MC Authority** (green border — optional)
   - "MC AUTHORITY — OPTIONAL FOR BOX TRUCKS"
   - "Do you have MC authority? MC (Motor Carrier) authority allows you to operate as a for-hire carrier"
   - Two large buttons: "Yes, I have MC" / "No, I don't"
   - If Yes: "What is your MC number?" sub-input appears

4. **Insurance** (blue border)
   - Minimum badge: "$300,000 commercial auto · $100,000 cargo"
   - Currency input for monthly cost
   - Confirmation checkbox

#### Cargo Van (selected)
1. **MC Authority** (green border — optional)
   - Same yes/no pattern as box truck

2. **Non-CDL Regulatory Callout** (grey background card, no left border)
   - Title: "Cargo Van Operation Requirements"
   - List items with status badges:
     - Commercial auto insurance rider — **REQUIRED** (bold)
     - LLC or business entity — *recommended* (grey)
     - Business bank account — *required for ACH settlements*
     - EIN — **REQUIRED** for year-end 1099
   - Footer: "Your dispatcher will help you get set up if anything is missing"
   - This is informational — no inputs, does not block

3. **Insurance** (blue border)
   - Minimum badge: "$300,000 commercial auto"
   - Currency input + confirmation checkbox

#### Personal Vehicle (selected)
1. **Delivery Types** (blue border — required)
   - "What types of deliveries will you run?"
   - Multi-select chips: Courier/Same-Day, Last Mile, Medical Courier, Grocery, Pharmacy, Other
   - Large pill buttons with checkmark when selected

2. **Cargo Size** (grey border — follow-up)
   - "What's the largest item you can carry?"
   - Visual tile selector (4 tiles with icons):
     - Envelope/Small
     - Furniture/Sized
     - Large/Parcel
     - Pallet
   - Tiles are ~150px wide, icon above label, blue border when selected

3. **Medical Courier Compliance** (red border — appears only if "Medical Courier" delivery type selected)
   - "Do you transport pharmaceuticals?" — Yes/No buttons
   - If Yes: "Do those include controlled substances?" — Yes/No buttons
   - If Yes to either: **Red callout card**: "Compliance verification required. Your dispatcher will schedule a compliance review call to verify DEA registration, chain of custody procedures, and temperature control documentation."
   - This flags, does not block

4. **Non-CDL Regulatory Callout** (same as cargo van)

5. **Insurance** (blue border)
   - Minimum badge: "$300,000 commercial auto"
   - Note: "Requires commercial auto rider on your personal policy"
   - Currency input + confirmation checkbox

### Mixed Fleet Rendering
When multiple vehicle types are selected, compliance sub-questions for each type appear in sequence within the same phase, separated by a type label divider:
- "SEMI TRUCK REQUIREMENTS" divider
- Semi sub-questions...
- "BOX TRUCK REQUIREMENTS" divider
- Box truck sub-questions...

### Q-Last: Add Individual Vehicles
After all compliance questions:
- "Now let's add your individual vehicles"
- Repeatable vehicle entry card:
  - Year / Make / Model (3 fields in a row)
  - VIN (17 characters)
  - License Plate
  - Category dropdown (pre-selected based on type selection)
- "Add Another Vehicle" button below
- Vehicle cards can be removed (X button top-right)

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Vehicle Types | vehicles[].category | VehicleCategory enum chips |
| MC Number | carrier.mcNumber | string (1-8 digits) |
| DOT Number | carrier.dotNumber | string (1-8 digits) |
| GVWR | vehicles[].gvwr | integer (lbs) |
| Insurance Cost | vehicles[].insuranceMonthlyCost | currency |
| Insurance Attested | vehicles[].insuranceAttested | boolean (checkbox) |
| Delivery Types | vehicles[].deliveryTypes | DeliveryType enum chips |
| Transports Pharma | medicalCourierCompliance.transportsPharma | boolean |
| Controlled Substances | medicalCourierCompliance.controlledSubstances | boolean |
| Vehicle Year | vehicles[].year | integer |
| Vehicle Make | vehicles[].make | string |
| Vehicle Model | vehicles[].model | string |
| VIN | vehicles[].vin | string (17 chars) |
| License Plate | vehicles[].licensePlate | string |
