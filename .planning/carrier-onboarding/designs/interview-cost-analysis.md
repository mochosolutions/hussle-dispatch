# Interview — Cost Analysis Phase & Result Card

> Reference mockup: `cost_analysis_complete.png`

## Purpose
Phase 4 of the interview. 6 cost questions with preset tile inputs, followed by a full-screen result card showing break-even RPM and minimum booking rate.

## Question Sequence

### Q1: Truck Payment
- "What's your monthly truck payment?"
- PresetTileSelector: $800 / $1,200 / $1,500 / $2,000 / Custom
- "I own it outright" toggle — sets to $0, skips to next

### Q2: Insurance Cost
- "What's your monthly insurance cost?"
- PresetTileSelector: $800 / $1,200 / $1,500 / $2,000 / Custom
- Pre-populated from Equipment phase if entered there

### Q3: Fuel Cost Per Gallon
- "What are you paying for diesel right now?"
- PresetTileSelector: $3.50 / $3.75 / $4.00 / $4.25 / Custom
- Currency input with $ prefix

### Q4: Miles Per Gallon
- "What fuel economy does your truck get?"
- PresetTileSelector: 5.5 / 6.0 / 6.5 / 7.0 / Custom
- Number input with "MPG" suffix

### Q5: Maintenance Monthly
- "How much do you budget for maintenance per month?"
- PresetTileSelector: $300 / $500 / $800 / $1,200 / Custom

### Q6: Other Monthly Costs
- "Any other monthly costs? (tolls, permits, subscriptions, parking)"
- PresetTileSelector: $100 / $250 / $500 / Custom
- Hint: "Include anything recurring that comes out of your trucking income"

### PresetTileSelector Component
- Row of pill-shaped chips with preset values
- One selected at a time (radio behavior)
- "Custom" chip reveals a currency/number input below
- Selected chip: blue background, white text
- Unselected: white background, grey border, dark text

## Result Card (Full-Screen Takeover)

After all 6 questions answered, the result card replaces the interview temporarily:

### Layout
- Full viewport, dark navy background (#0F172A)
- Centered content, max-width ~700px
- No header bar visible (immersive moment)

### Content
- Label: "COST ANALYSIS COMPLETE" (12px, uppercase, grey-400, letter-spacing)
- Heading: "Here's your real cost picture, {firstName}." (30px, white, bold)
- Subtext: "Based on your expenses, here's what every mile needs to earn to keep your business profitable." (16px, grey-300)

- **Break-Even Card** (dark card, subtle border):
  - Label: "YOUR BREAK-EVEN RATE PER MILE" (12px, uppercase, grey-400)
  - Value: "$1.94" (48px, white, bold) — animated count-up from $0.00
  - Subtext: "Every mile you drive costs this much just to cover your costs & business expenses" (14px, grey-400)

- **Minimum Booking Rate Card** (slightly elevated, green accent):
  - Label: "MINIMUM RATE TO BOOK A LOAD" (12px, uppercase)
  - Value: "$2.44" (60px, green-400, bold) — animated count-up, larger than break-even
  - Subtext: "Load Intelligence will reject anything below this rate — protecting your bottom line" (14px, grey-300)

- **Expense Breakdown Row** (3 tiles):
  - Monthly Fixed: "$17,400" (or whatever calculated)
  - Monthly Variable: "$5,400"
  - Fuel Cost/Mile: "$2.50"
  - Each tile: value in white (24px bold), label below in grey (13px)

- **Disclaimer** (bottom):
  - "This is an estimate based on 6 inputs. Your dispatcher will refine your full cost profile after activation — adding every expense line for a more precise rate."
  - 14px, grey-400, max-width ~600px

- **Action Button**: "This looks right — Continue →" (green, large, centered)
  - Clicking returns to the interview thread, advances to Lane Preferences phase

### Animations
- Numbers count up from $0.00 over ~1.5 seconds (eased)
- Break-even appears first, minimum rate appears 300ms later
- Expense tiles fade in as a group after numbers settle
- All animations respect `prefers-reduced-motion` (show final values immediately)

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Truck Payment | truckPayment | currency |
| Insurance Cost | insuranceCost | currency |
| Fuel Cost/Gallon | fuelCostPerGallon | currency |
| Miles Per Gallon | milesPerGallon | number |
| Maintenance Monthly | maintenanceMonthlyCost | currency |
| Other Monthly | otherMonthlyCosts | currency |
| Break-Even RPM | breakEvenRpm | currency (2 decimal) |
| Minimum Rate | minimumRatePerMile | currency (2 decimal) |
| Monthly Expenses | totalMonthlyExpenses | currency |
| Fuel Cost/Mile | fuelCostPerMile | currency (2 decimal) |
