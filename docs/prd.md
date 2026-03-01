# FleetCommand MVP — Product Requirements Document

**Version:** 4.4
**Date:** March 1, 2026
**Status:** Ready for Development
**Owner:** Jr (Mocho Solutions)
**Source of Truth:** This PRD + Hustle Bible Dispatch Guide

---

## 1. Problem & Context

### Problem Statement
Hustle Transportation Inc. is a trucking operation (up to 5 trucks — mix of owned Freightliners and leased Penske units) that also dispatches for external carriers. Operations currently rely on phone calls, Telegram messages, DAT load board browsing, manual email-based rate con tracking, scanner apps for BOLs, and Google Sheets/Drive for load tracking and document storage.

Pain points:
- No centralized view of active loads and their real-time statuses
- Broker rate confirmations live in email inboxes, untracked
- Invoicing is delayed because signed BOLs and delivery confirmations flow through text messages and email
- Load profitability is evaluated by gut feel, not per-truck cost analysis
- Revenue splits between the company and dispatch partner (Jr) are manually calculated
- External carrier onboarding documents (dispatch agreements, W-9s, insurance) are scattered across Google Drive
- Weekly gross targets per truck ($5,000) aren't systematically tracked
- No visibility into round-trip profitability — loads are evaluated in isolation with no consideration for what happens after delivery
- Loads come from multiple sources (DAT, broker calls, emails) with no unified pipeline for scoring and comparison
- Driver preferences (no-go zones, preferred lanes, home base) aren't tracked — loads get booked that drivers don't want

### Target Users
- **CEO / Owner (ADMIN):** Business management, invoice approval, financial oversight, final authority
- **Jr — Dispatch Partner (ADMIN):** Finds and books loads, manages dispatch operations, tracks revenue splits, builds the platform
- **Operations Employee (DISPATCHER):** Day-to-day load management, driver coordination, broker communication, BOL tracking
- **Driver Partner / Founder (VIEWER):** Monitors fleet activity and load status, read-only access

### Success Metrics
- **Week 1 post-launch:** First load dispatched end-to-end (QUOTED → PAID)
- **Week 2 post-launch:** All active loads managed in FleetCommand, zero parallel spreadsheet tracking
- **Month 1:** Broker rate con uploaded and tracked for 100% of booked loads
- **Month 1:** Invoice generated within 1 hour of signed BOL upload (vs current 1-3 day delay)
- **Month 1:** Weekly gross per truck visible on dashboard, tracked against $5,000 target
- **Month 2:** Dispatchers using min book rate and chain scoring from the intelligence feed as negotiation floor on every broker call
- **Month 2:** 80%+ of booked loads have chain evaluation data informing the booking decision

### Assumptions
- Team of 3-5 users; polling is sufficient (no WebSockets)
- Company is always on the carrier side of the broker relationship in MVP (not brokering loads)
- External carriers sign a dispatch agreement once at onboarding, not per load
- Chrome extension for DAT scraping exists in prototype form
- Existing auth module (Cognito + Redis sessions) is functional
- Fleet size may vary — seed data needs confirmation from the family
- Most DAT loads do not show a posted rate — scoring must work without rate data
- Dispatchers use multiple search tabs and filters on DAT — the extension must capture across all browsing patterns

---

## 2. Business Model

### Two Carrier Types, Two Financial Flows

**COMPANY_ASSET (Own Fleet)**
Company owns or leases the truck. Loads booked under the company's MC number. Broker pays the company the full load rate. A dispatch fee is calculated as a percentage of the load rate (or rate + accessorials if configured), split between the company and Jr.

**EXTERNAL_CARRIER (Dispatch Service)**
Company dispatches for independent carriers with their own MC and authority. Carrier must complete onboarding (signed dispatch agreement + insurance + W-9) before being assigned loads. Broker pays the carrier directly. Carrier pays the company a dispatch fee, split between the company and Jr.

**OWNER_OPERATOR** — Designed in the data model but NOT implemented in MVP. System rejects attempts to use this carrier type.

### Financial Rules

**Dispatch fee calculation:**
- Dispatch fee percentage is set per carrier (default 10%)
- Each carrier has a configurable flag: "fee includes accessorials" (default: no)
- If no: dispatch fee = customer rate × fee percentage
- If yes: dispatch fee = (customer rate + accessorial total) × fee percentage

**Partner split:**
- Partner split percentage is set per carrier (default 50%)
- Partner split = dispatch fee × partner split percentage
- Company share = dispatch fee − partner split

**Rounding:** Banker's rounding (round half to even) to 2 decimal places. Applied once at the final stored value, not intermediate steps.

**Financial field lifecycle:**
- QUOTED: customerRate may be set, financial fields are null
- BOOKED (carrier assigned): dispatchFee, partnerSplit, ratePerMile calculated and stored
- If carrier or rate changes while BOOKED: financials recalculate
- DISPATCHED and beyond: financial fields are frozen (broker rate con is the legal commitment)

**DISPATCHER role restriction:** API never includes partnerSplit amounts in responses to DISPATCHER role users. Enforced at the API layer.

### Prohibited Commodities
Configurable per organization. Default list: garbage, refuse, recyclables, dirty recyclables. Commodity is not available on DAT load board listings — it is shared verbally during the booking phone call. Therefore, the prohibited commodity check applies only in the Load Creator form (§4.2 Step 2) where the dispatcher manually enters it. The load intelligence feed (§4.8) does not check commodities.

---

## 3. User Roles & Permissions

### ADMIN (CEO + Jr)
- Full access to all features and data
- Can cancel loads, flag exceptions, mark payments received
- Can view and manage all financial data including partner splits
- Can approve and send invoices
- Can manage carriers (onboarding, deactivation)
- Can create, edit, and delete places
- Can invite users

### DISPATCHER (Operations Employee)
- Create and manage loads through the dispatch board
- Upload broker rate confirmations
- Update load statuses (EXCEPT: cannot flag EXCEPTION or mark PAID)
- Generate invoice drafts (cannot approve or send without ADMIN)
- View carriers, drivers, vehicles, contacts, places
- Create and edit places (dispatchers discover facility intelligence during daily operations)
- Add check calls, update stop times, upload BOLs
- CANNOT see partner split amounts
- CANNOT delete carriers, drivers, vehicles, or places
- CANNOT override onboarding gate

### VIEWER (Driver Partner / Founder)
- View dispatch board (read-only)
- View carriers, drivers, vehicles, places (read-only)
- CANNOT see financial data
- CANNOT create, modify, or delete any records
- CANNOT access load intelligence feed

---

## 4. Feature Specifications

### 4.1 Dispatch Board (PRIMARY SCREEN)

**Kanban View — 6 Grouped Columns:**

| Column | Color | Statuses | Purpose |
|--------|-------|----------|---------|
| NEW | Yellow | Quoted | Loads needing broker negotiation |
| BOOKED | Orange | Booked | Broker rate con received, awaiting dispatch |
| ACTIVE | Green | Dispatched, EnRoutePickup, AtPickup, InTransit, AtDelivery | Loads in motion |
| DELIVERED | Purple | Delivered, InvoicePending | Awaiting BOL / invoicing |
| COMPLETE | Gray | Invoiced, Paid | Finished loads |
| ISSUES | Red | Exception, Canceled, TONU | Needs attention |

**Kanban Card Contents:**
- Load number (e.g., LD-2026-000042)
- Origin city/state → Destination city/state
- Carrier name + type badge (COMPANY_ASSET / EXTERNAL_CARRIER)
- Driver name (if assigned)
- Customer rate (hidden for VIEWER)
- Specific status badge within group
- Pickup date
- Urgency indicator if pickup is today or overdue

**Kanban Behavior:**
- Cards are NOT draggable (status changes via load detail)
- Column count badges
- Columns scroll vertically
- COMPLETE column collapsed by default
- ISSUES column always visible

**Table View:**
- Sortable: load number, status, carrier, origin, destination, pickup date, rate, created date
- Filterable: status, carrier, carrier type, equipment type, date range
- Searchable: load number, broker ref, carrier name, origin/dest city
- Pagination: 25 per page
- Click row → load detail

**Weekly Gross Tracker:**
- Above the board: shows each truck's weekly gross vs $5,000 target
- Format: "Truck #133718: $3,200 / $5,000" with progress bar
- Only visible to ADMIN and DISPATCHER

**Polling:** 15-second background refresh. Subtle "Last updated" indicator.

**Mobile (under 768px):** Card list view only. No Kanban on mobile.

**Empty State:** "No loads yet. Create your first load to get started." with Create Load button.

**Acceptance Criteria:**
- GIVEN no filters WHEN dispatch board loads THEN all non-deleted loads display in correct Kanban columns
- GIVEN VIEWER role WHEN viewing board THEN rates are hidden on all cards
- GIVEN 5 active trucks WHEN board loads THEN weekly gross tracker shows all 5 with progress toward $5,000

---

### 4.2 Load Creator

**Step 1 — Route & Broker:**
- Broker (searchable dropdown from Contacts, or "Add New")
- Broker reference number (optional)
- Equipment type (required at booking, optional at quoting)
- **Place typeahead** (first field in each stop form — pickup, delivery, additional stops):
  - Searchable field: "Search by facility name, city, or state..." (min 2 chars, calls `GET /api/v1/places/typeahead`)
  - Dropdown items show: `{name} — {city}, {state}` with facility type badge, associated contact name
  - **On selection**: auto-fill facilityName, address, city, state, zip, contactName, contactPhone. Set hidden `placeId`.
  - Show info badges when Place has: appointmentRequired, lumperRequired, checkInProcedures
  - All auto-filled fields remain editable for that specific load
  - **"Save as Place" quick action**: "+" button next to typeahead opens modal to create a new Place (pre-populated from any already-entered stop fields)
- Pickup stop: facility name, address, city, state, zip, appointment date, time, appointment number, contact name, phone
- Delivery stop: same fields
- "Add Stop" button for multi-stop loads

**Step 2 — Cargo:**
- Commodity (free text — validated against org's prohibited commodity list, hard block if match. This is the only place commodity is checked, since load board sources do not provide commodity data.)
- Weight (lbs)
- Piece count
- Hazmat toggle
- Tarp required toggle — when ON, auto-suggest accessorial "Tarp Fee" at $150-$200
- Team driver required toggle
- Loaded miles, deadhead miles

**Step 3 — Assignment & Rate:**
- Carrier (searchable dropdown, active carriers only)
  - EXTERNAL_CARRIER: onboarding gate check — if dispatch agreement, insurance, OR W-9 missing, show warning: "[Carrier] is missing required documents: [list]. Complete carrier onboarding before assigning loads." Block assignment.
  - Show carrier type badge
  - Show carrier's weekly gross: "$3,200 / $5,000 this week"
- Driver (filtered to carrier's active drivers)
  - Show available hours and current location if tracked
  - If driver is assigned to another active load, show warning
  - Show driver preference match: "Preferred Lane" badge if origin→dest matches, "🚫 No-Go" warning if destination is in no-go zones (requires confirmation to override)
  - Show "~N days from home base" estimate
- Vehicle (filtered to carrier's active vehicles)
  - If carrier has one driver and one vehicle, auto-select both
- Customer rate (required)
  - If load was created from "Book This Load" on intelligence feed, show helper text with min book rate: "Min book: $900 for #133718"
  - If load was created from "Book Chain," show chain context: "Chain target: $2,800+ for $5,000 round trip"
- Accessorial charges: type dropdown + amount, add multiple
- Auto-calculated financial preview: dispatch fee, company share, partner split (ADMIN only), rate per mile

**Step 4 — Review & Create:**
- Full summary
- Financial breakdown
- If created from "Book Chain": planned backhaul summary shown
- Dispatcher notes, driver instructions
- "Create as Quoted" (no carrier) or "Create as Booked" (carrier assigned)
- If Booked: prompt "Upload broker rate con now?" with file upload

**Validation:**
- At least one pickup and one delivery stop
- Customer rate must be positive
- Carrier/driver/vehicle must belong to same org
- Driver must belong to selected carrier
- Vehicle must belong to selected carrier
- Commodity checked against prohibited list

**Acceptance Criteria:**
- GIVEN a prohibited commodity entered WHEN user submits THEN creation is blocked with policy message
- GIVEN an external carrier missing W-9 WHEN dispatcher tries to assign THEN assignment is blocked with list of missing documents
- GIVEN a carrier with one driver and one vehicle WHEN selected THEN both auto-populate
- GIVEN DISPATCHER role WHEN viewing financial preview THEN partner split is hidden
- GIVEN driver has Montana as no-go zone WHEN assigning to Montana load THEN warning: "[Driver] has Montana as a no-go zone. Assign anyway?"
- GIVEN driver has NJ→PA preferred lane WHEN assigning to NJ→PA load THEN "Preferred Lane" badge shown
- GIVEN load created from intelligence feed WHEN rate field displays THEN min book rate shown as helper text
- GIVEN load created from "Book Chain" WHEN review step displays THEN planned backhaul summary shown
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN Place selected on stop WHEN auto-fill runs THEN address/contact fields populate, all editable

---

### 4.3 Load Detail

**Header:** Load number, status badge, carrier name + type, driver name, vehicle unit number

**Sections:**
- **Route:** All stops with appointment times, actual arrival/departure times. If stop has a `placeId`, show Place name as clickable link to Place detail. Show facility intelligence badges inline (appointment required, lumper, PPE).
- **Broker Info:** Broker name, reference number, broker rate con (view/download if uploaded)
- **Assignment:** Carrier, driver, vehicle, driver's available hours and location
- **Financial:** Customer rate, accessorials, dispatch fee, partner split (ADMIN only), company share, rate per mile
- **Planned Backhaul:** If load was created via "Book Chain," shows backhaul summary with "Convert to Load" button, "Backhaul Expired" indicator if Redis key gone, and "Find New Backhaul" → opens intelligence feed filtered to loads FROM the delivery destination
- **Status Timeline:** All transitions with timestamps, user, and notes
- **Check Calls:** Log with location, ETA, notes, "Broker Notified" flag
- **Documents:** Uploaded files with special handling for BOLs (see §4.5)
- **Invoice:** Status, link to PDF, payment tracking

**Status Change Actions:**
- Primary button: next valid transition
- Dropdown: alternate valid transitions
- Confirmation dialog required
- Notes required for EXCEPTION and CANCELED
- BOOKED transition: prompt to upload broker rate con

**Acceptance Criteria:**
- GIVEN load in DISPATCHED WHEN ADMIN or DISPATCHER views THEN primary action is "Mark En Route to Pickup"
- GIVEN load in IN_TRANSIT WHEN DISPATCHER tries EXCEPTION THEN rejected (ADMIN only)
- GIVEN VIEWER role WHEN viewing THEN financials hidden, no action buttons
- GIVEN load created from "Book Chain" WHEN load detail viewed THEN Planned Backhaul section is visible with backhaul summary

---

### 4.4 Broker Rate Con Handling (INBOUND)

The company is on the carrier side. Brokers send rate confirmations TO the company. This is the trigger for a load becoming BOOKED.

**Flow:**
1. Dispatcher negotiates load with broker (phone, email, load board)
2. Broker emails rate confirmation
3. Dispatcher creates load in FleetCommand (or load already exists as QUOTED)
4. Dispatcher uploads broker's rate con as a document on the load
5. Load status becomes BOOKED (broker rate con on file = commitment)
6. System stores: who uploaded, when, the original file

**Upload can happen:**
- During load creation (Step 4 prompt)
- From the load detail page at any time while QUOTED
- The status transition from QUOTED → BOOKED prompts "Upload broker rate con" but does NOT hard-require it (some loads may be booked verbally first, rate con arrives later)

**Broker Rate Con as Document:**
- Document type: BROKER_RATE_CON
- Stored in S3 under the load's folder
- Visible on load detail in the Broker Info section
- Multiple can be uploaded if terms change (latest is primary, previous are archived)

**Hustle Bible Alignment:**
- "Make sure you receive a rate confirmation via email before you send the driver out"
- "If a new rate is discussed, make sure those changes are reflected on a new rate confirmation"
- System tracks: rateConReceivedAt on the load, warns if load is being dispatched without a broker rate con on file

**Acceptance Criteria:**
- GIVEN a load in QUOTED status WHEN dispatcher uploads a broker rate con THEN document is stored and rateConReceivedAt is set
- GIVEN a load transitioning to DISPATCHED with no broker rate con uploaded THEN show warning: "No broker rate con on file. The Hustle Bible requires a rate con before sending the driver out. Continue anyway?"
- GIVEN a load with a broker rate con WHEN dispatcher uploads a new one THEN new document becomes primary, previous is archived (not deleted)

---

### 4.5 BOL Workflow

The signed Bill of Lading is the single most important document. No signed BOL = no payment. Two-stage workflow per the Hustle Bible.

**At Pickup (load status AT_PICKUP):**
- System prompts: "Upload unsigned BOL from shipper"
- Document type: BOL_UNSIGNED
- Check call should capture: arrival time, loading ETA, broker notified

**At Delivery (load status AT_DELIVERY → DELIVERED):**
- System prompts: "Upload signed BOL"
- Document type: BOL_SIGNED
- The signed BOL must clearly show: load number, shipper info, location, check-in and check-out times
- When transitioning to DELIVERED: if no signed BOL is uploaded, show warning: "No signed BOL on file. Payment cannot be processed without a signed BOL. Continue anyway?"
- Load tracks: bolSignedAt (when signed BOL was uploaded)

**Invoice Integration:**
- When invoice is auto-generated at DELIVERED: if no signed BOL exists, invoice is created with warning flag "Missing signed BOL — payment may be delayed"
- Invoice list shows a BOL status indicator per invoice

**Post-Delivery:**
- Signed BOL is automatically attached to the invoice record
- System should remind: "Send signed BOL to info@hustletransport.com for processing" (or automate this in V2)

**Acceptance Criteria:**
- GIVEN a load at AT_PICKUP WHEN dispatcher views load detail THEN an "Upload Unsigned BOL" prompt is visible
- GIVEN a load transitioning to DELIVERED without signed BOL WHEN dispatcher confirms THEN warning displayed and load transitions with bolSignedAt = null
- GIVEN a load at DELIVERED with signed BOL WHEN invoice auto-generates THEN invoice has no missing-BOL warning
- GIVEN a load at DELIVERED without signed BOL WHEN invoice auto-generates THEN invoice displays "Missing signed BOL" flag

---

### 4.6 Carrier Onboarding & Dispatch Agreement

**Onboarding Requirements (gate for EXTERNAL_CARRIER load assignment):**

| Document | Required? | Tracks |
|----------|-----------|--------|
| Signed Dispatch Agreement | YES — hard block | dispatchAgreementOnFile, dispatchAgreementSignedAt |
| Certificate of Insurance | YES — hard block | insuranceCertOnFile, insuranceExpiry |
| W-9 | YES — hard block | w9OnFile |
| Carrier Packet | Recommended | carrierPacketOnFile |

**Dispatch Agreement Flow:**
1. ADMIN creates a new EXTERNAL_CARRIER carrier record
2. System generates a dispatch agreement PDF from a customizable template
3. Template includes: dispatch company info, carrier info, fee percentage, no-rebroker clause, cancellation/TONU policy, payment terms, term of agreement
4. ADMIN downloads or emails the generated PDF to the carrier
5. Carrier signs and returns it
6. ADMIN uploads the signed copy as a document on the carrier record
7. ADMIN marks "Dispatch Agreement Signed" which sets dispatchAgreementOnFile = true and dispatchAgreementSignedAt

**Onboarding Gate Logic:**
- When assigning an EXTERNAL_CARRIER to a load, the system checks:
  - dispatchAgreementOnFile = true
  - insuranceCertOnFile = true AND insuranceExpiry > today
  - w9OnFile = true
- If any check fails: assignment is blocked with a message listing what's missing
- COMPANY_ASSET carriers skip this gate entirely

**Insurance Expiry Warning:**
- Dashboard attention item: "Carrier [name] insurance expires in [N] days"
- 30-day and 7-day warning thresholds
- If insurance is expired: carrier is blocked from load assignment (same as missing)

**OnboardFlow-Ready Design:**
- Carrier record includes optional `onboardingFlowId` and `onboardingStatus` fields (null in MVP)
- In V2, OnboardFlow handles the entire flow and writes back via API
- For MVP, booleans are manually set by ADMIN

**Acceptance Criteria:**
- GIVEN a new external carrier with no documents WHEN ADMIN tries to assign to a load THEN blocked: "Missing: Dispatch Agreement, Insurance Certificate, W-9"
- GIVEN a carrier with expired insurance WHEN assignment attempted THEN blocked: "[Carrier] insurance expired on [date]"
- GIVEN a carrier with all docs on file and valid insurance WHEN assigned to load THEN assignment succeeds
- GIVEN COMPANY_ASSET carrier WHEN assigned to load THEN no onboarding gate check

---

### 4.7 Invoice Manager

**Auto-Generation:**
- When load transitions to DELIVERED, invoice draft auto-created
- Type determined by carrier:
  - COMPANY_ASSET → CUSTOMER invoice (bills broker at full rate)
  - EXTERNAL_CARRIER → DISPATCH_FEE invoice (bills carrier for dispatch fee)
- Due date from contact's payment terms (default net 30)
- Warning flag if signed BOL is missing
- Load status → INVOICE_PENDING

**List View:**
- Filterable: status, type, date range, overdue, missing BOL
- Overdue invoices highlighted in red
- Count badges per status

**Actions:**
- **Edit Draft:** Modify line items, notes, terms. Cannot change type or load.
- **Delete Draft:** ADMIN only. Load reverts to DELIVERED.
- **Approve:** ADMIN reviews and approves.
- **Generate PDF & Send:** PDF generated in browser, uploaded to S3 via presigned URL. Email sent via SES. Status → SENT. If no recipient email: warning with manual download option.
- **Mark Paid:** ADMIN records payment (amount, method, reference, date). Partial payment → PARTIALLY_PAID. Full → PAID. Load → PAID.

**Acceptance Criteria:**
- GIVEN COMPANY_ASSET load DELIVERED THEN CUSTOMER invoice draft created for full rate
- GIVEN EXTERNAL_CARRIER load DELIVERED THEN DISPATCH_FEE invoice draft created for dispatch fee amount
- GIVEN invoice missing signed BOL THEN warning flag visible in list and detail
- GIVEN ADMIN deletes draft THEN invoice removed, load → DELIVERED
- GIVEN DISPATCHER tries to approve THEN rejected (ADMIN only)

---

### 4.8 Load Intelligence Feed

The competitive differentiator. A source-agnostic intelligence engine that ingests loads from any source (DAT, manual entry, future: email, other boards), scores them per truck across profitability + market + driver fit, and chains them into round trips.

#### 4.8.1 Architecture

Loads in the intelligence feed are ephemeral — they live in Redis with a 24-hour TTL, not Postgres. When a dispatcher clicks "Book This Load" or "Book Chain," the data copies to a real Load record in Postgres. Everything else auto-expires.

The ingestion API is source-agnostic. Every source normalizes data into a universal `LoadIntelPayload` format with a source tag. The scoring engine, chaining engine, and feed UI never know or care where a load came from. A load is a load.

```
SOURCES (MVP)                     SOURCES (V2)
┌──────────┐  ┌──────────┐       ┌──────────┐  ┌──────────┐  ┌──────────┐
│   DAT    │  │  Manual  │       │  Email   │  │Truckstop │  │ Broker   │
│ Chrome   │  │  Entry   │       │  Parser  │  │  Scraper │  │  API     │
│Extension │  │          │       │          │  │          │  │          │
└────┬─────┘  └────┬─────┘       └────┬─────┘  └────┬─────┘  └────┬─────┘
     │              │                  │              │              │
     ▼              ▼                  ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              UNIVERSAL INGESTION API                                     │
│           POST /api/v1/load-intel/ingest                                 │
└─────────────────────────┬────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────────────┐
│         DEDUPE → SCORE → CHAIN → REDIS → FEED                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Note on commodity:** Load board sources do not show commodity on listings. Commodity is shared verbally during the broker phone call. There is no commodity check at the ingestion level — that validation happens only in the Load Creator (§4.2).

#### 4.8.2 Load Sources (MVP)

**DAT Chrome Extension — Three Scraping Modes:**

| Mode | Trigger | Behavior | When to Use |
|------|---------|----------|-------------|
| Active Page | Dispatcher clicks "Send to FleetCommand" in extension | Scrapes current DAT results page, batch POSTs to API | Specific search the dispatcher wants evaluated |
| Auto-Capture | Toggle ON in extension | Silently scrapes as dispatcher browses DAT, batches every 30s | Maximum coverage, browse DAT normally |
| Bulk Multi-Tab | "Bulk Scrape All Tabs" button | Scrapes all open DAT tabs in sequence | Morning search routine across multiple lanes |

The extension captures two types of data from DAT:
1. **Load data:** origin, destination, rate (nullable), miles, equipment type, broker info, pickup/delivery dates. NO commodity (not available on DAT).
2. **Market data:** Load-to-truck ratio for markets visible on DAT search results. POSTed separately to the market data endpoint.

The extension uses multiple DOM selector fallback chains for resilience against DAT layout changes. If selectors return 0 results (layout changed), the extension pauses scraping and shows "DAT layout may have changed — update available."

**Manual Load Entry:**

"Add Load Manually" button on the intelligence feed page. Simplified modal form for loads that come in via phone call:
- Origin: city + state (required)
- Destination: city + state (required)
- Pickup date (required)
- Equipment type (optional)
- Rate (optional — "call for rate" toggle)
- Loaded miles (auto-estimated from city pair geo data, editable)
- Broker: name, company, phone, email, MC (all optional)

On submit, creates a `LoadIntelPayload` with `source: 'manual'`, runs through the same pipeline. Card tagged "Manual" in the feed.

**Why this matters:** A broker calls and says "I've got a load, NJ to Charlotte, 800 miles, call me for rate." The dispatcher types it in, instantly sees the min book rate, market strength, chain options — before calling the broker back.

#### 4.8.3 Min Book Rate

The minimum rate a dispatcher should negotiate to hit profitability. Shown on ALL loads — priced and unpriced — as a negotiation reference.

**Calculation per truck:**
```
minBookRate = (vehicle CPM × total miles) / (1 - feePercent/100) × (1 + profitMargin)
```
Where profitMargin is configurable per org (default 15%). Rounded up to nearest $50 for clean negotiation numbers.

**Card display (best truck):** Shows the lowest min book rate across all eligible trucks.

**Three card states based on rate vs min book:**

| Situation | Display |
|-----------|---------|
| Priced, above min | ✅ $1,900 above min book rate |
| Priced, below min | 🔴 $600 below min book rate |
| No price posted | 📞 Book above $900 (#133718) |

#### 4.8.4 Destination Market Strength

Load-to-truck ratio scraped from DAT for the load's destination market. Stored in Redis with 6-hour TTL.

| Ratio | Label | Color | Meaning |
|-------|-------|-------|---------|
| 3.0+ | Hot | Green | Easy backhaul, strong rates out |
| 1.5–2.9 | Balanced | Blue | Good chance of backhaul |
| 0.8–1.4 | Soft | Yellow | Rates under pressure |
| Below 0.8 | Dead | Red | Truck may get stranded |

#### 4.8.5 Single-Load Composite Scoring (0-100)

Each load is scored per truck across up to three dimensions:

**When rate IS available (full score, marked ★):**

| Dimension | Points | Measures |
|-----------|--------|----------|
| CPM Profitability | 0-40 | Can this truck make money on this load? |
| Destination Market | 0-30 | Can the truck find a backhaul? |
| Driver Fit | 0-30 | Does the driver want to go there? |

**When rate is NOT available (route score, marked ◇):**
Market and driver fit dimensions only, normalized to 0-100 scale. The ◇ marker tells the dispatcher profitability hasn't been validated.

**CPM Profitability scoring (when rate available):**
- $1.00+/mile profit → 40 pts
- $0.75–$0.99 → 35 pts; $0.50–$0.74 → 28 pts; $0.25–$0.49 → 18 pts; $0.10–$0.24 → 8 pts
- Below $0.10 or below min book → 0 pts

**Destination Market scoring:**
- Hot (3.0+) → 30 pts; Balanced (1.5–2.9) → 22 pts; Soft (0.8–1.4) → 10 pts; Dead (<0.8) → 0 pts; No data → 15 pts (neutral)

**Driver Fit scoring:**
- No-go zone violation → hard disqualifier, score = 0, flagged 🚫
- Preferred lane match → +15 pts; not preferred → +5 pts (neutral)
- Destination ≤200mi from home → +10; 200-500mi → +5; 500mi+ → +0
- Round trip within maxDaysOut → +5; exceeds → -10 (warning ⚠️)
- No preferences set → 15 pts (neutral default)

**Score labels:** Excellent (85-100, green), Good (65-84, blue), Marginal (40-64, yellow), Pass (below 40, red)

**Override flags:** 🚫 No-Go, ⚠️ Days Out, 🔴 Below Min

#### 4.8.6 Load Chaining Engine

**The core competitive feature.** Instead of evaluating loads in isolation, the chaining engine pairs each outbound load with available return loads to form round trips. A $2,800 outbound to Charlotte with a $2,200 Charlotte→Newark backhaul is a $5,000 chain. A $3,500 outbound to rural Montana with no backhaul is a $3,500 chain — worse despite the higher single-load rate.

**Chain Types:**

| Type | When Used | Structure |
|------|-----------|-----------|
| 2-step | Destination < 500mi from driver home base | Outbound → Backhaul → Home |
| 3-step | Destination ≥ 500mi from home | Outbound → Relay toward home → Backhaul → Home |

The 500-mile threshold is configurable in OrgSettings.

**Backhaul Search:**
- Query Redis for loads originating within 50 miles of outbound destination
- Filter: pickup date ≥ outbound estimated delivery date, compatible equipment type
- Cap: top 20 candidates by single-load score
- For 3-step: relay load must move truck ≥ 20% closer to home base

**Three Optimization Metrics (evaluated per chain):**

**1. Round-Trip Profitability (RTP):**
```
chainRevenue = outbound rate + backhaul rate
chainCost = vehicle CPM × total chain miles
chainFees = outbound dispatch fee + backhaul dispatch fee
chainProfit = chainRevenue - chainCost - chainFees
chainRPM = chainProfit / loaded miles
```
Display: "$5,000 round trip / $2.10 RPM"

**2. Daily Revenue Utilization (DRU):**
```
chainDays = transit days + dwell time + deadhead time
chainDRU = chainRevenue / chainDays
```
Transit: loaded miles ÷ 500 mi/day. Dwell between loads: 0.5 days default or actual pickup gap.
Display: "$1,667/day" — higher means the truck is earning, not sitting.

**3. Weekly Gross Projection (WGP):**
```
projectedWeeklyGross = currentWeeklyGross + chainRevenue
```
Display: "This chain brings Truck #133718 to $4,200 / $5,000 this week"

**Chain Scoring (0-100):**

| Dimension | Points | Measures |
|-----------|--------|----------|
| Chain Profitability | 0-40 | Round-trip RPM (same tiers as single-load CPM) |
| Return Positioning | 0-35 | How close the chain ends to home base |
| Time Efficiency | 0-25 | Daily Revenue Utilization tiers |

Return Positioning tiers: within 100mi → 35 pts, 200mi → 28, 300mi → 20, 500mi → 10, 500mi+ → 0, away from home → -10 penalty.

DRU tiers: ≥$1,500/day → 25 pts, $1,200-1,499 → 20, $900-1,199 → 15, $600-899 → 8, <$600 → 0.

**Handling Missing Backhaul Data:**
- No backhaul loads in Redis → chain score shows "—" with tooltip: "No loads scraped from [destination]. Market proxy used instead."
- Dead market AND no backhaul data → "⚠️ Dead market, no backhaul options found"
- System never hides the single-load score — dispatchers always have both perspectives.

**Performance:** Chain evaluation is lazy — triggered when feed loads or card expands, not at ingestion. Cached in Redis alongside load data.

#### 4.8.7 Feed Display

**Side-by-side scoring:** Each card shows BOTH the single-load score and the chain score:

```
┌──────────────────────────────────────────────────────────────────┐
│ Newark, NJ → Charlotte, NC  [DAT]              800 mi  DV       │
│ Posted: $2,800 ($3.50/mi)                                       │
│ ✅ $1,900 above min book │ Market: Charlotte 🟢 Hot (3.2)       │
│                                                                  │
│ ┌─────────── SINGLE ──────────┐ ┌──────── CHAIN (2-step) ──────┐│
│ │ Score: 92 ★ Excellent       │ │ Score: 88 ★ Excellent        ││
│ │ Truck: #133718 / Marcus     │ │ ↪ Charlotte → Newark $2,200  ││
│ │ Profit: $1,827 ($2.28/mi)   │ │ Round trip: $5,000           ││
│ │                             │ │ RPM: $2.10 │ DRU: $1,667/day ││
│ │                             │ │ Weekly: $2K → $7K ✅ target   ││
│ └─────────────────────────────┘ └───────────────────────────────┘│
│ [Book This Load]  [Book Chain]  [Dismiss]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Source badges on cards:** DAT (blue), DAT Bulk (blue), Manual (gray), Email (purple, V2), TS (green, V2), 123 (orange, V2), API (teal, V2)

**Feed header stats:** "142 loads from 3 sources: DAT (98), DAT Bulk (32), Manual (12)"

**Expanded per-truck breakdown:** Table showing for each truck: unit number, driver, min book rate, rate margin, market score, driver fit details, single-load score, best chain summary with three metrics.

**Actions:**
- "Book This Load" → pre-fills Load Creator with load data, best truck/driver pre-selected, min book rate as helper text
- "Book Chain" → pre-fills Load Creator with outbound data + saves backhaul as planned reference on load record (see §4.8.8)
- "Dismiss" → removed from feed (Redis set, expires with load)
- "Add Load Manually" → opens manual entry modal
- Filter by: score tier, equipment type, origin/dest state, market strength, has rate, score type (★/◇), source
- Sort by: single-load score (default), chain score, posted rate, miles, pickup date

**Mobile:** Card collapses chain to one line: "Chain: $5,000 RT / $2.10 RPM ★ 88"

**Empty State:** "No loads in the intelligence feed. Use the DAT Chrome extension or add a load manually."

#### 4.8.8 Book Chain Flow

When dispatcher clicks "Book Chain":
1. Outbound load created normally via Load Creator (pre-filled)
2. Backhaul saved as a **planned reference** on the outbound load — NOT a real load. Stores: scraped data snapshot (origin, dest, rate, broker, pickup date)
3. Load Detail shows "Planned Backhaul" section with:
   - Backhaul summary
   - "Convert to Load" → creates backhaul as a real QUOTED load, pre-filled
   - "Backhaul Expired" indicator if Redis key gone
   - "Find New Backhaul" → opens feed filtered to loads FROM delivery destination

The backhaul is aspirational — it's based on scraped data that might expire by delivery time. The planned reference keeps the dispatcher's intention visible while acknowledging reality.

**Acceptance Criteria:**
- GIVEN a load to Charlotte (L/T=2.8) with Marcus (preferred NJ→NC) WHEN feed displays THEN Marcus's truck shows highest composite with "Preferred Lane" and min book rate, plus chain with best Charlotte→NJ backhaul
- GIVEN a load to Montana with James (MT is no-go) WHEN feed displays THEN James's truck shows "🚫 No-Go" with single score 0, no chain evaluated
- GIVEN an unpriced load to Memphis with no backhaul data WHEN feed displays THEN card shows "📞 Book above $1,200" with ◇ route score, chain panel shows "— No backhaul data" with market proxy
- GIVEN a priced load with strong 2-step chain WHEN "Book Chain" clicked THEN Load Creator opens with outbound pre-filled and Step 4 shows planned backhaul summary
- GIVEN a load booked via "Book Chain" WHEN load detail viewed 3 days later THEN planned backhaul shows "Backhaul Expired" with "Find New Backhaul" button
- GIVEN a manual load entry for NJ→NC WHEN submitted THEN load appears in feed tagged "Manual" with full scoring and chain data
- GIVEN auto-capture ON WHEN dispatcher browses 5 DAT pages THEN extension silently ingests all results into feed
- GIVEN "Bulk Scrape All Tabs" with 3 DAT tabs WHEN clicked THEN shows "3 searches, 142 loads, 98 new"

---

### 4.9 Fleet & Carrier Management

**Carrier List:** Name, type badge, MC#, status, onboarding status (complete/incomplete for external), driver count, vehicle count.

**Carrier Detail:**
- Contact info, compliance status
- Financial terms: fee %, partner split %, fee includes accessorials toggle
- Onboarding documents section (dispatch agreement, insurance, W-9, carrier packet) with upload slots and signed/on-file indicators
- Drivers tab, vehicles tab, load history tab
- Insurance expiry warning if within 30 days

**Vehicle Detail:**
- Ownership type: Owned or Leased
- Emergency contact + phone (e.g., "Penske Roadside: 1-800-526-0796" or "NTP Warranty: 1-877-950-3200")
- Warranty/contract info (optional text field)
- CPM expense editor (same categories as existing CPM Calculator)
- Auto-calculated: monthly cost, cost per mile, daily minimum revenue

**Driver Detail:**
- Standard: name, phone, CDL info, etc.
- Operational: availableHours (decimal, manually updated by dispatcher), currentCity, currentState
- Warning if assigned to active load when being assigned to another
- **Preferences Section:**
  - Home base: city + state
  - Max days out: number input (1-14, default 5)
  - Preferred lanes: table of origin state → destination state pairs, with optional city refinement. Add/remove rows.
  - No-go zones: list of states with optional city. Add/remove entries.
  - Simple form-based UI — no map visualization in MVP

**Driver Assignment Intelligence:**
When assigning a driver to a load (in Load Creator or Load Detail), the system shows:
- Preferred lane match → green "Preferred" badge
- No-go zone hit → red "🚫 No-Go" warning (requires confirmation)
- Days from home estimate → "~2 days from home base"
- Available hours → "[X] hours available"
- Current location → "Last known: [City, ST]"

**Delete Constraints:**
- Cannot deactivate carrier with active loads (before PAID)
- Cannot deactivate driver assigned to active load (before DELIVERED)
- Cannot deactivate vehicle assigned to active load (before DELIVERED)
- Returns list of blocking loads

**Acceptance Criteria:**
- GIVEN external carrier missing insurance WHEN viewed THEN onboarding status shows "Incomplete" with missing items listed
- GIVEN vehicle with CPM expenses totaling $8,500/month and 10,000 miles target THEN CPM shows $0.85/mile
- GIVEN carrier with active load WHEN deactivation attempted THEN blocked with load list
- GIVEN driver with MT no-go WHEN assigning to Montana load THEN warning displayed (requires confirmation)
- GIVEN driver with NJ→PA preferred WHEN assigning NJ→PA load THEN "Preferred Lane" badge

---

### 4.10 Dashboard

**KPIs:**
- Active loads by Kanban group
- Weekly gross per truck (vs $5,000 target) — bar chart
- Revenue this week/month (PAID loads)
- Dispatch fees earned this month
- Partner split this month (ADMIN only)
- Overdue invoices count + total

**Attention Items:**
- Loads in EXCEPTION
- Invoices past due
- Loads dispatched without broker rate con
- Invoices missing signed BOL
- Carrier insurance expiring within 30 days
- Loads with pickup today that are still in BOOKED (not yet dispatched)

**Acceptance Criteria:**
- GIVEN DISPATCHER role THEN partner split KPI hidden
- GIVEN 3 loads in EXCEPTION THEN attention section shows them with links

---

### 4.11 Place Management

**Place List Page:**
- Table: name, city/state, facility type, associated contact, appointment required badge, actions
- Sortable: name, city, state, facility type, created date
- Filterable: facility type, state, associated contact
- Searchable: name, city, state
- Pagination: 25/page
- "Create Place" button

**Create/Edit Place Form (3 sections):**

*Location:*
- Name (required) — e.g., "Amazon FTW1", "Walmart DC #7044"
- Address, Address 2 (optional)
- City (required), State (required, 2-char dropdown), Zip (optional)
- Lat/Lng — auto-populated on save, read-only with manual override option

*Facility Details:*
- Facility type dropdown (Warehouse, Distribution Center, Cross Dock, Cold Storage, Port, Rail Yard, Truck Stop, Drop Yard, Manufacturing, Retail, Farm, Construction Site, Military, Government, Residential, Other)
- Dock type dropdown (Dock High, Ground Level, Both, None)
- Operating hours, Receiving hours (free text)
- Toggles: Appointment required, Lumper required, PPE required

*Contact & Intelligence:*
- Associated contact (searchable dropdown from Contacts, optional)
- On-site contact: name, phone, email
- Check-in procedures (multi-line text)
- Notes (multi-line text)

**Place Detail Page:**
- Read-only display of all fields
- Edit button
- "Recent loads at this facility" section — stops referencing this Place

**Acceptance Criteria:**
- GIVEN city "Charlotte", state "NC" WHEN Place saved THEN lat/lng auto-populate from Redis
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN Place selected on stop WHEN auto-fill runs THEN address/contact fields populate, all editable
- GIVEN Place soft-deleted WHEN dispatcher searches THEN excluded from typeahead
- GIVEN Place with lumperRequired=true WHEN selected on stop THEN info badge shown
- GIVEN Place linked to Contact "TQL" WHEN searching "TQL" in typeahead THEN associated Places appear

---

## 5. Load Status State Machine

### 13 Statuses

| Status | Meaning | Entered When |
|--------|---------|--------------|
| QUOTED | Load identified, negotiating | Load created |
| BOOKED | Broker rate con received, committed | Broker rate con uploaded or carrier assigned |
| DISPATCHED | Driver + truck assigned, driver has details | Assignment confirmed |
| EN_ROUTE_PICKUP | Driver heading to shipper | Dispatcher confirms |
| AT_PICKUP | At shipper, loading | Arrival confirmed |
| IN_TRANSIT | Freight on the road | Departed shipper |
| AT_DELIVERY | At consignee, unloading | Arrival confirmed |
| DELIVERED | Signed BOL obtained | Delivery confirmed |
| INVOICE_PENDING | Invoice draft created | Auto on DELIVERED |
| INVOICED | Invoice approved and sent | ADMIN approves |
| PAID | Payment received — terminal | ADMIN records payment |
| EXCEPTION | Dispute/claim/issue | ADMIN flags (notes required) |
| CANCELED | Load canceled — terminal | ADMIN/DISPATCHER (notes required) |

**Note:** TONU (Truck Ordered Not Used) is a side status reachable from DISPATCHED through AT_PICKUP. When a load transitions to TONU, a $250 accessorial charge is auto-created (configurable at org level). TONU loads can transition to INVOICED.

### Allowed Transitions

| From | Can Go To | Who |
|------|-----------|-----|
| QUOTED | BOOKED, CANCELED | ADMIN, DISPATCHER |
| BOOKED | DISPATCHED, CANCELED | ADMIN, DISPATCHER |
| DISPATCHED | EN_ROUTE_PICKUP, TONU, CANCELED | ADMIN, DISPATCHER |
| EN_ROUTE_PICKUP | AT_PICKUP, TONU | ADMIN, DISPATCHER |
| AT_PICKUP | IN_TRANSIT, TONU | ADMIN, DISPATCHER |
| IN_TRANSIT | AT_DELIVERY, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| AT_DELIVERY | DELIVERED, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| DELIVERED | INVOICE_PENDING, EXCEPTION | System (auto), ADMIN for Exception |
| INVOICE_PENDING | INVOICED | ADMIN (via invoice approval) |
| INVOICED | PAID | ADMIN (via mark paid) |
| PAID | (terminal) | — |
| EXCEPTION | INVOICED | ADMIN |
| CANCELED | (terminal) | — |
| TONU | INVOICED | ADMIN, DISPATCHER |

### Transition Prerequisites

| Transition | Prerequisite |
|------------|-------------|
| QUOTED → BOOKED | Carrier must be assigned |
| BOOKED → DISPATCHED | Driver and vehicle must be assigned. For EXTERNAL_CARRIER: onboarding gate must pass. |
| Any → CANCELED or EXCEPTION | Notes required |
| Any → TONU | Auto-creates $250 TONU accessorial charge |

### Transition Side Effects

| Transition | Side Effect |
|-----------|-------------|
| → BOOKED | Financial fields calculated |
| → DISPATCHED | Financial fields frozen |
| → DELIVERED | Invoice draft auto-generated, status immediately → INVOICE_PENDING |
| → TONU | $250 accessorial auto-created |
| Any transition | LoadStatusHistory record created |

### Transition Warnings (soft — can be overridden)

| Condition | Warning |
|-----------|---------|
| → DISPATCHED without broker rate con uploaded | "No broker rate con on file" |
| → DELIVERED without signed BOL uploaded | "No signed BOL on file — payment may be delayed" |
| → DISPATCHED and driver has < 10 available hours | "Driver has [N] available hours" |

---

## 6. Document Types

| Type | When Created | Special Handling |
|------|-------------|-----------------|
| BROKER_RATE_CON | Uploaded when load is booked | Sets rateConReceivedAt on load |
| BOL_UNSIGNED | Uploaded at pickup | Prompted at AT_PICKUP status |
| BOL_SIGNED | Uploaded at delivery | Prompted at DELIVERED. Warning on invoice if missing. |
| DISPATCH_AGREEMENT | Uploaded during carrier onboarding | Required for external carrier load assignment gate |
| INSURANCE_CERT | Uploaded during carrier onboarding | Expiry tracked, blocks assignment when expired |
| W9 | Uploaded during carrier onboarding | Required for external carrier load assignment gate |
| CARRIER_PACKET | Uploaded during carrier onboarding | Recommended, not required |
| INVOICE | System-generated PDF | Attached to invoice record |
| LUMPER_RECEIPT | Uploaded during load lifecycle | Supports accessorial documentation |
| SCALE_TICKET | Uploaded during load lifecycle | Weight verification |
| OTHER | Any time | General documents |

---

## 7. Email Specifications

### Provider
AWS SES. From address: `dispatch@[configurable-domain]`. Reply-to: dispatcher's email.

### Email 1: Invoice Delivery
- Trigger: ADMIN sends approved invoice
- Subject: "Invoice [INV-2026-000042] — [Company Name]"
- Body: Invoice summary, amount, due date, payment instructions
- Attachment: Invoice PDF

### Email 2: Dispatch Agreement Delivery (carrier onboarding)
- Trigger: ADMIN clicks "Send Dispatch Agreement" on carrier record
- Subject: "Dispatch Agreement — [Company Name]"
- Body: Agreement summary, instructions to sign and return
- Attachment: Generated dispatch agreement PDF

### Retry Policy
- 3 total attempts, 5-second delay between
- On failure: "Email failed. PDF saved — download manually."
- Invoice stays APPROVED (not SENT) on failure

### Future (V2)
- Email 3: Rate Confirmation Delivery (outbound, when brokering)
- Inbound email parsing for load offers → intelligence feed

---

## 8. Sequential Number Generation

- Load: `LD-{YYYY}-{NNNNNN}` — continuous, no annual reset
- Invoice: `INV-{YYYY}-{NNNNNN}` — continuous
- Gaps acceptable. Unique per organization. Postgres sequence.
- Retry on collision: max 3 attempts.

---

## 9. Presigned URL Upload Flow

1. Frontend requests presigned URL: `POST /api/v1/documents/presign`
2. API generates S3 PUT URL (15-min expiry) + document record in "pending" state
3. Frontend uploads directly to S3
4. Frontend confirms: `POST /api/v1/documents/{id}/confirm`
5. API verifies file exists, updates record to "confirmed"

Failure: retry button on upload fail. Orphaned S3 files cleaned by lifecycle rules (7 days).

S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`

File limits: PDFs max 5MB, uploads (BOL, POD) max 10MB. Accepted: PDF, PNG, JPG, JPEG.

---

## 10. Error Handling

| Scenario | User Experience |
|----------|----------------|
| Invalid status transition | Toast: "Cannot move to [status]. Allowed: [list]" |
| Two users book same load from feed | Second sees: "Already booked by [user]. Refreshing feed." |
| S3 upload fails | "Upload failed. Try again." Retry button. |
| Email fails after 3 retries | "Email failed. PDF saved — download manually." |
| Cognito down | Existing sessions work 24h. New logins: "Login temporarily unavailable." |
| Database down | 503. Frontend shows cached data with offline banner. |
| Concurrent edit conflict | "Updated by [user] at [time]. Please refresh." |
| Prohibited commodity entered | Hard block: "This commodity is prohibited per company policy." |
| External carrier missing onboarding docs | Hard block: "[Carrier] missing: [doc list]. Complete onboarding first." |
| Carrier insurance expired | Hard block: "[Carrier] insurance expired [date]." |
| Dispatching without broker rate con | Soft warning: "No broker rate con on file. Continue anyway?" |
| Invoice without signed BOL | Warning flag on invoice: "Missing signed BOL." |
| TONU transition | Auto-creates $250 accessorial. Confirmation dialog. |
| Driver no-go zone assignment | Warning: "[Driver] has [state] as no-go zone. Assign anyway?" |
| Redis unavailable | Intelligence feed shows: "Load intelligence temporarily unavailable." Dispatch board unaffected. |
| Priced load below min book | 🔴 indicator on card. Not blocked — dispatcher may negotiate higher. |
| No backhaul data for destination | Chain panel shows "—" with market proxy fallback |
| Dead market + no backhaul data | "⚠️ Dead market, no backhaul options found" |
| Planned backhaul expired | Load Detail shows "Backhaul Expired" with "Find New Backhaul" button |
| Chrome extension: DAT layout changed | Extension pauses, shows: "DAT layout may have changed — update available" |
| Place deleted while referenced by active load | Place remains on existing stops (placeId preserved), excluded from typeahead for new stops |

---

## 11. Pagination, Sorting & Filtering

- Offset-based, default 25, max 100
- Response: `{ data, meta: { page, limit, total, totalPages, hasMore } }`
- Sort: `?sort=field&order=asc|desc` (default: createdAt desc)
- Filter: query params per entity
- Decimals serialized as strings in JSON
- Intelligence feed: paginated from Redis sorted set, not Postgres

---

## 12. What's NOT in MVP

| Feature | Deferred to | Reason |
|---------|------------|--------|
| Owner-operator settlement | V2 | Not needed yet |
| Brokering loads (outbound rate cons) | V2 | Company is carrier-side for now |
| Public rate con acceptance page | V2 | Needed when brokering |
| OnboardFlow integration | V2 | Simple onboarding sufficient |
| Carrier portal | V2 | Email-based communication |
| Socket.io real-time | V2 | Polling for 5 users |
| Row-Level Security | V2 | Application filtering for MVP |
| ELD integration | V2 | Manual hours tracking |
| FMCSA auto-verification | V2 | Manual carrier vetting |
| Driver mobile app | V2 | SMS/call coordination |
| QuickBooks integration | V2 | Manual accounting |
| Automated detention computation | V2 | Manual calculation |
| Fuel card management | V2 | Fuel card provider portal |
| Double-broker detection | V2 | Add when scaling |
| Kanban drag-and-drop | V2 | Status changes via detail |
| Batch invoicing | V2 | One per load |
| Email load offer parsing | V2 | AI extraction needed for broker email parsing |
| Truckstop / 123Loadboard scrapers | V2 | Additional Chrome extension content scripts |
| Direct broker API feeds | V2 | Per-broker adapter integrations |
| DAT API integration | V2 | Replace Chrome scraping with official API |
| Predictive backhaul | V2 | Historical data needed to predict backhaul availability |
| Multi-truck chain optimization | V2 | Fleet-level TSP across all trucks simultaneously |
| Lane history analytics | V2 | Track rates/patterns per lane over time |
| Rate prediction | V2 | Predict achievable rate from historical + market data |
| GPS-based deadhead | V2 | Use actual truck position instead of broker origin estimate |
| Driver satisfaction tracking | V2 | Post-load "run this lane again?" feedback loop |
| Time-of-week market patterns | V2 | Factor day-of-week into chain predictions |
| Fuel cost per chain leg | V2 | More accurate round-trip profitability |
| Place geofencing / geofence alerts | V2 | GPS integration needed |
| Place operating hours structured scheduling | V2 | Free text sufficient for MVP |
| Place rating / quality scoring | V2 | Needs historical load data |
| Auto-suggest Place from address matching | V2 | Fuzzy address matching complexity |

---

## 13. Timeline — 5-6 Weeks

### Week 1: Foundation + Auth + Core CRUD
- Project scaffolding, Docker, auth integration
- Prisma schema, migration, seed script
- Redis configuration (sessions + intelligence feed + market data + geo bootstrap)
- Carriers (with onboarding fields), drivers (with hours/location/preferences), vehicles (with ownership/emergency), contacts, places (facility intelligence)
- **Milestone:** Login, manage fleet data, driver preferences, onboarding gate, facility database working

### Week 2: Loads + Dispatch Board
- Loads API with 13-status state machine
- Stops, load creator multi-step form with commodity check and driver fit warnings
- Dispatch board: 6-column Kanban + table, weekly gross tracker
- Broker rate con upload flow
- **Milestone:** Create and manage loads with driver preference intelligence

### Week 3: BOL Workflow + Documents + Invoices
- BOL two-stage workflow (unsigned pickup, signed delivery)
- Document upload via presigned URLs
- Invoice auto-generation on DELIVERED with BOL warning
- Invoice approval, PDF generation, SES email send
- **Milestone:** Full load-to-invoice workflow with BOL tracking

### Week 4: Financial Layer + Carrier Onboarding
- Dispatch fee calculations (configurable accessorial inclusion)
- Partner split with API-level filtering
- Dispatch agreement PDF generation from template
- Carrier onboarding gate enforcement
- Dashboard KPIs + attention items
- **Milestone:** Financial tracking, carrier onboarding, dashboard live

### Week 5: Intelligence Engine — Scoring + Ingestion
- Source-agnostic ingestion API (single + batch endpoints)
- CPM expense management per truck
- Min book rate calculation per truck
- Single-load composite scoring (CPM + market + driver fit)
- Chrome extension Modes 1 (active page) + 2 (auto-capture)
- Manual load entry form
- Intelligence feed UI with source badges and filters
- **Milestone:** Dispatchers scoring loads from DAT and phone calls

### Week 6: Intelligence Engine — Chaining + Polish
- Geo data bootstrap (US city centroids → Redis)
- Backhaul search logic (50mi radius matching)
- Chain scoring algorithm (RTP + DRU + WGP)
- Side-by-side card UI (single + chain scores)
- "Book Chain" flow with planned backhaul reference
- Chrome extension Mode 3 (bulk multi-tab)
- Fleet overview, bug fixes, team onboarding
- **Milestone:** Full MVP live with round-trip intelligence, team dispatching daily

### Buffer: 2-3 days for integration issues and feedback.

---

## 14. Open Items

**Waiting on Jr / Family:**
- [ ] Confirm current fleet: 5 trucks (3 Penske + 2 Freightliner) or changed?
- [ ] Auth module codebase
- [ ] Seed data: trucks, drivers (with home bases and preferred lanes), expense profiles
- [ ] Chrome extension sample JSON (load data + market data payloads)
- [ ] SES domain setup + from address
- [ ] Company logo for PDF templates
- [ ] Dispatch agreement legal template / terms they want included
- [ ] Hustle Transportation contact info for PDF headers
- [ ] Driver preference data for seed: preferred lanes, no-go zones per driver

**Can begin immediately:**
- [ ] Project scaffolding + Docker Compose
- [ ] Prisma schema (all FleetCommand tables)
- [ ] Redis configuration (sessions + intelligence data + geo)
- [ ] US city centroid CSV download + bootstrap script
- [ ] Base Express API with source-agnostic ingestion route
- [ ] MUI theme + layout
- [ ] Invoice PDF template
- [ ] Dispatch agreement PDF template (draft)
- [ ] Shared types, constants, scoring algorithm, chaining engine
- [ ] Min book rate calculation utility
- [ ] Chrome extension scaffold (Manifest V3)
