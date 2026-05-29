"""Anthropic vision-based ratecon extractor.

Owns: the prompt, the tool schema wrapping, the model selection, the
cache_control markers, and the Anthropic SDK call. Implements RateconExtractorPort.
"""

from __future__ import annotations

import base64
import logging

import fitz
from anthropic import AsyncAnthropic

from app.ratecon.ports import ExtractorOutput, ExtractorUsage
from app.schemas import ExtractionResult, validate_extraction

logger = logging.getLogger(__name__)


EXTRACTION_PROMPT = """You extract structured data from carrier rate confirmations for FleetCommand, a dispatch app. Your output prefills the Create Load form and gets saved to a Postgres database. Dispatchers trust your output — incorrect data means lost revenue. Be conservative: when in doubt, return null and explain the doubt in the warnings list.

# Step 0: Classify the document FIRST

Before extracting anything, decide whether this document is actually a **carrier rate confirmation** (a broker's offer/agreement to pay a carrier to haul a specific load — contains a rate, stops, and load reference numbers).

- If it IS a rate confirmation: set `is_ratecon = true` and extract everything below.
- If it is NOT (e.g. a Bill of Lading, Proof of Delivery, broker-carrier agreement/NDA, insurance certificate, W-9, invoice, or a generic broker packet): set `is_ratecon = false`, set `document_type_guess` to your best guess of what it is, and do NOT spend effort extracting load fields — leave them null. The app will not create a load from a non-ratecon.

Rate confirmations are sometimes titled "Rate Confirmation", "Load Confirmation", "Carrier Confirmation", "Rate & Load Confirmation", or "Order Confirmation" and always show a carrier pay amount plus pickup/delivery details.

# Hard rules

1. **Null means uncertain.** Never guess. Never invent. If a field is not clearly stated on any page, leave it null.
2. **Always preserve the original text in `*_raw` fields** whenever you see anything. If you cannot normalize a value confidently, leave the normalized field null but ALWAYS populate the corresponding `*_raw` field with the verbatim text from the document.
3. **Only fill a normalized (typed/enum) field when the value is unambiguous.** A date like "4/9" is ambiguous (year missing) — leave `appointment_date` null but set `appointment_date_raw = "4/9"`.
4. **Conflicting values → null + warning.** If two pages show different rates, different appointment times, etc., set the normalized field to null, keep both raw values if possible, and add a warning explaining the conflict.
5. **Do not invent enums.** Use only the enum values listed below. If equipment is something other than the listed enums, set `equipment_type=null` and `equipment_type_raw="<verbatim text>"`.

# Format specifications

| Field type | Required format | Example |
|---|---|---|
| Dates (normalized) | ISO 8601 `YYYY-MM-DD` | `2026-04-09` |
| Times (normalized) | 24-hour `HH:mm` | `08:00`, `14:30` |
| Phones (normalized) | E.164 `+1XXXXXXXXXX` (US) | `+19105550100` |
| States | 2-char USPS uppercase | `NY`, `CA`, `FL` |
| ZIP | 5 digits only (drop +4 suffix) | `11779` |
| Money | Number only, no `$` or commas | `1850.00` |
| MC#/DOT# | Digits only (strip "MC", "DOT", spaces, hyphens) | `1145125` |
| Weights | Integer pounds | `42500` |
| Temperatures (°F) | Number only | `-10`, `34.5` |

If you cannot produce the normalized format confidently, leave the normalized field null and populate the `*_raw` field. The dispatcher will see the raw text and can fix it.

# Enum values (use exactly these strings)

- **StopType**: `PICKUP`, `DELIVERY`, `STOP_OFF`, `DROP_HOOK`, `LIVE_UNLOAD`
- **EquipmentType**: `DRY_VAN`, `REEFER`, `FLATBED`, `STEP_DECK`, `BOX_TRUCK`, `HOTSHOT`, `POWER_ONLY`
- **SchedulingType**: `APPOINTMENT`, `FCFS`, `NOTIFICATION`, `OPEN`, `DROP_HOOK`
- **AccessorialType**: `DETENTION`, `LUMPER`, `TONU`, `LAYOVER`, `DRIVER_ASSIST`, `FUEL_SURCHARGE`, `TARP`, `TOLL`, `OTHER`
- **ReferenceNumber.kind**: `LOAD_NUMBER`, `PO_NUMBER`, `BOL_NUMBER`, `PICKUP_NUMBER`, `ORDER_NUMBER`, `OTHER`
- **ReeferMode**: `continuous`, `cycle-sentry`
- **ExtractionConfidence**: `HIGH`, `MEDIUM`, `LOW`

# Reference number classification

Classify every reference number using the `kind` field. Mapping rules:

- Labels containing "Load #", "Load Number", "Load ID", "MCL Load" → `LOAD_NUMBER`
- Labels containing "Order #", "Order Number" → `ORDER_NUMBER`
- Labels containing "PO #", "P.O.", "Purchase Order", "MCL PO #" → `PO_NUMBER`
- Labels containing "BOL", "B/L", "Bill of Lading" → `BOL_NUMBER`
- Labels containing "Pickup #", "PU #", "Pickup Number", "Confirmation #", "Appt #" → `PICKUP_NUMBER`
- Anything else → `OTHER`

Always preserve the original label string in the `label` field even after classifying.

# Field-specific guidance

- **`customer_rate`** — the dollar amount the BROKER PAYS THE CARRIER. If the document shows both a customer rate and a carrier rate, use the carrier rate. If only one rate is shown, use it. Set `customer_rate_raw` to the verbatim text including `$` and commas (e.g., `"$1,850.00"`).

- **`equipment_type`** — pick from the enum list. Common mappings: "53 Reefer" → `REEFER`; "53' Dry Van" → `DRY_VAN`; "Flatbed", "FB", "Flat" → `FLATBED`. For reefer-specific fields (temperature, mode), only populate them if the document explicitly says so.

- **Stops** — number them starting at 1 in the order they appear. Determine type from context:
  - "PU", "Pick", "Pickup", "Shipper", "Origin" → `PICKUP`
  - "SO", "Stop", "Drop", "Deliver", "Delivery", "Consignee", "Destination" → `DELIVERY`
  - Other less common keywords map to `STOP_OFF`, `DROP_HOOK`, `LIVE_UNLOAD`
  - If you genuinely cannot tell, set type to null and add a warning.
- For each stop, capture facility_name, address (street only), city, state, zip, appointment_date, appointment_time, contact info, and per-stop reference numbers separately from document-level ones.
- If a stop has an appointment window (e.g., "0800-1400"), set `appointment_time` to the start and `appointment_end_time` to the end, both in HH:mm.
- For stops with FCFS or open scheduling, set `scheduling_type` accordingly and leave `appointment_time` null only if no specific time is stated.

- **`dispatcher_notes`** — compose a coherent prose summary of ALL operationally significant rules: detention policy, every fee/penalty with trigger, payment terms (net 30, quick pay, etc.), POD submission requirements, tracking requirements with provider, anything else that affects money or compliance. Use short paragraphs or bullet lines. Dispatchers will read this when handling exceptions.

- **`driver_instructions`** — short, action-oriented text for the driver only. Include: gate codes, check-in procedures, dock numbers, seal requirements, tracking app to install, precool requirements, any facility-specific instructions. EXCLUDE: dollar amounts, payment terms, accessorial rules, broker billing concerns.

- **`detention_policy`** — extract separately from accessorials. Populate `rate_per_hour`, `free_hours`, `max_amount` as numbers when stated; always populate the matching `*_raw` fields.

- **`accessorials`** — every fee, deduction, or penalty other than detention. Set `type` from the enum. Always populate `description` (what the fee is for) and `amount_raw` (the text from the doc). Set `amount_usd` only when it's a fixed dollar amount; leave null for conditional or variable rates like "$2/mile" or "5% of haul".

- **`broker_contact`** — the individual broker rep listed on the document (name + phone + email). The broker COMPANY goes in `customer`. Split contact_name into first_name + last_name if you can; otherwise use last_name only.

- **`customer`** — the broker company entity. Populate `mc_number` and `dot_number` if shown (digits only — strip "MC", "DOT", and any spaces/hyphens).

- **`carrier_name_on_doc` + `carrier_mc_number`** — the CARRIER the document is addressed to (this is "us"). Always extract if visible; the app uses these to detect mis-uploaded documents.

# Booleans

For `is_hazmat`, `is_tarp`, `is_team_driver`, `is_temp_controlled`:
- `true` only when the document explicitly says yes (checkbox marked, "HAZMAT REQUIRED", "TARP REQUIRED", etc.)
- `false` only when the document explicitly says no (checkbox unmarked, "No tarp", etc.)
- `null` when the document does not address the topic. Do not infer.

# Confidence rules

Set `extraction_confidence`:
- **`HIGH`** — every required field (customer_rate, equipment_type, ≥1 PICKUP stop with address, ≥1 DELIVERY stop with address) is populated and unambiguous. No conflicting values across pages. No fields you had to skip.
- **`MEDIUM`** — all required fields populated, but some optional fields are ambiguous, missing, or had to be left raw (e.g., couldn't parse an appointment time, no contact phone visible).
- **`LOW`** — any required field missing, OR document is illegible/partially redacted, OR rates conflict between pages, OR you saw something that suggests this is not a standard rate confirmation.

Set `requires_review = true` whenever you add any warning, OR confidence is LOW.

# Warnings format

For every field where you had to leave a value null because of ambiguity (not because the field was simply absent from the doc), or made a judgement call worth flagging, add a one-sentence warning. Format:

```
"<field path>: <what was ambiguous and what you did>"
```

Examples:
- `"customer_rate: doc shows '$1,850' on page 1 and '$1,750' on page 2 — used null, see customer_rate_raw"`
- `"stops[1].appointment_time: doc shows '0800-1400' window — used 08:00 for appointment_time, captured raw"`
- `"equipment_type: doc says '53 Reefer w/ E-track' — mapped to REEFER, equipment_type_raw preserved"`

If extraction is fully clean (HIGH confidence, no warnings), return an empty warnings list."""


def _pdf_bytes_to_base64_pages(pdf_bytes: bytes) -> list[str]:
    """Render PDF pages to base64 PNGs at 2x zoom for vision input."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        pages: list[str] = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            png_bytes = pix.tobytes("png")
            pages.append(base64.standard_b64encode(png_bytes).decode("utf-8"))
        return pages
    finally:
        doc.close()


class AnthropicVisionRateconExtractor:
    """Implements RateconExtractorPort using Anthropic vision + tool-use.

    Caching: the system prompt and tool schema are marked cache_control=ephemeral
    so the static prefix is reused across calls within the 5-minute TTL window.
    The variable PDF images come after, in user messages, and are not cached."""

    def __init__(self, *, client: AsyncAnthropic, model: str, max_tokens: int = 8096) -> None:
        self._client = client
        self._model = model
        self._max_tokens = max_tokens
        self._tools = [
            {
                "name": "extract_rate_confirmation",
                "description": "Extract structured data from a rate confirmation document.",
                "input_schema": ExtractionResult.model_json_schema(),
                "cache_control": {"type": "ephemeral"},
            }
        ]
        self._system = [
            {
                "type": "text",
                "text": EXTRACTION_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    async def extract(self, pdf_bytes: bytes) -> ExtractorOutput:
        pages = _pdf_bytes_to_base64_pages(pdf_bytes)
        if not pages:
            raise ValueError("PDF contains no pages")

        content: list[dict] = []
        for i, page_b64 in enumerate(pages):
            content.append({"type": "text", "text": f"--- Page {i + 1} of {len(pages)} ---"})
            content.append(
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": page_b64,
                    },
                }
            )
        content.append({"type": "text", "text": "Extract the data from these pages now."})

        response = await self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=self._system,
            tools=self._tools,
            tool_choice={"type": "tool", "name": "extract_rate_confirmation"},
            messages=[{"role": "user", "content": content}],
        )

        tool_block = next((b for b in response.content if b.type == "tool_use"), None)
        if tool_block is None:
            raise RuntimeError("Anthropic response did not include a tool_use block")

        # validate_extraction() routes validator-dropped-field warnings into
        # the result's warnings list via ValidationInfo.context.
        result = validate_extraction(tool_block.input)

        usage = ExtractorUsage(
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            cache_creation_input_tokens=getattr(response.usage, "cache_creation_input_tokens", 0)
            or 0,
            cache_read_input_tokens=getattr(response.usage, "cache_read_input_tokens", 0) or 0,
        )
        logger.info(
            "ratecon_extracted",
            extra={
                "model": self._model,
                "pages": len(pages),
                "stops": len(result.stops),
                "refs": len(result.reference_numbers),
                "confidence": result.extraction_confidence,
                "requires_review": result.requires_review,
                "warnings": len(result.warnings),
                "input_tokens": usage.input_tokens,
                "output_tokens": usage.output_tokens,
                "cache_read": usage.cache_read_input_tokens,
                "cache_write": usage.cache_creation_input_tokens,
            },
        )
        return ExtractorOutput(result=result, usage=usage)
