"""Ratecon extraction result schema.

Design principles (per /Users/jr/.claude/plans/i-want-to-plan-expressive-bumblebee.md):

1. **Dual-field pattern** for normalizable values: a typed/normalized field plus
   a `*_raw` field that always preserves what the document said verbatim. The
   normalized field is `null` unless we're confident; the `_raw` field is `null`
   only when the LLM saw nothing.

2. **App-aligned naming**: enums and field names mirror the Create Load form +
   Prisma columns so the Node mapper is ~30 lines of snake→camel renaming.

3. **Record-level confidence + warnings**: the LLM emits an overall confidence
   and a human-readable warnings list. Pydantic validators are the "dirty data
   firewall" — when a value fails format validation it gets dropped to None and
   a warning is appended (via ValidationInfo.context["warnings"]).

The recursive `_unstringify_tree` validator handles an Anthropic tool-use quirk
where deeply nested sub-objects sometimes arrive as JSON strings (occasionally
with trailing junk like an extra `}`)."""

from __future__ import annotations

import json
import re
from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator


# ---------------------------------------------------------------------------
# Enums (match app vocabulary verbatim)
# ---------------------------------------------------------------------------


class StopType(str, Enum):
    PICKUP = "PICKUP"
    DELIVERY = "DELIVERY"
    STOP_OFF = "STOP_OFF"
    DROP_HOOK = "DROP_HOOK"
    LIVE_UNLOAD = "LIVE_UNLOAD"


class EquipmentType(str, Enum):
    DRY_VAN = "DRY_VAN"
    REEFER = "REEFER"
    FLATBED = "FLATBED"
    STEP_DECK = "STEP_DECK"
    BOX_TRUCK = "BOX_TRUCK"
    HOTSHOT = "HOTSHOT"
    POWER_ONLY = "POWER_ONLY"


class SchedulingType(str, Enum):
    APPOINTMENT = "APPOINTMENT"
    FCFS = "FCFS"
    NOTIFICATION = "NOTIFICATION"
    OPEN = "OPEN"
    DROP_HOOK = "DROP_HOOK"


class AccessorialType(str, Enum):
    DETENTION = "DETENTION"
    LUMPER = "LUMPER"
    TONU = "TONU"
    LAYOVER = "LAYOVER"
    DRIVER_ASSIST = "DRIVER_ASSIST"
    FUEL_SURCHARGE = "FUEL_SURCHARGE"
    TARP = "TARP"
    TOLL = "TOLL"
    OTHER = "OTHER"


ReferenceKind = Literal[
    "LOAD_NUMBER",
    "PO_NUMBER",
    "BOL_NUMBER",
    "PICKUP_NUMBER",
    "ORDER_NUMBER",
    "OTHER",
]

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]


# ---------------------------------------------------------------------------
# Validation primitives
# ---------------------------------------------------------------------------

US_STATES: frozenset[str] = frozenset(
    [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
        "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
        "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
        "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "PR",
        "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
        "WI", "WY",
    ]
)

_E164_RE = re.compile(r"^\+\d{10,15}$")
_HHMM_RE = re.compile(r"^\d{2}:\d{2}$")
_ZIP_RE = re.compile(r"^\d{5}$")
_DIGITS_RE = re.compile(r"^\d{1,9}$")
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _add_warning(info: ValidationInfo, message: str) -> None:
    """Append a warning to the shared context list, if one was provided.

    Callers invoke `ExtractionResult.model_validate(data, context={'warnings': []})`
    and the same list is mutated by all validators in the tree."""
    if info.context is None:
        return
    warnings = info.context.get("warnings")
    if isinstance(warnings, list):
        warnings.append(message)


def _is_iso_date(value: str) -> bool:
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def _coerce_state(value: str | None, *, info: ValidationInfo, field_path: str) -> str | None:
    if value is None:
        return None
    normalized = value.strip().upper()
    if normalized in US_STATES:
        return normalized
    _add_warning(info, f"{field_path}: '{value}' is not a recognized USPS state code, dropped")
    return None


def _coerce_zip(value: str | None, *, info: ValidationInfo, field_path: str) -> str | None:
    if value is None:
        return None
    # Drop +4 suffix if present
    base = value.strip().split("-", 1)[0]
    if _ZIP_RE.match(base):
        return base
    _add_warning(info, f"{field_path}: '{value}' is not a 5-digit ZIP, dropped")
    return None


def _coerce_phone_e164(
    value: str | None, *, info: ValidationInfo, field_path: str
) -> str | None:
    if value is None:
        return None
    if _E164_RE.match(value):
        return value
    _add_warning(info, f"{field_path}: '{value}' is not E.164 format (+1XXXXXXXXXX), dropped")
    return None


def _coerce_digits(
    value: str | None, *, info: ValidationInfo, field_path: str
) -> str | None:
    if value is None:
        return None
    digits = re.sub(r"\D", "", value)
    if _DIGITS_RE.match(digits):
        return digits
    _add_warning(info, f"{field_path}: '{value}' has no recognizable digits, dropped")
    return None


def _coerce_email(
    value: str | None, *, info: ValidationInfo, field_path: str
) -> str | None:
    if value is None:
        return None
    if _EMAIL_RE.match(value):
        return value.lower()
    _add_warning(info, f"{field_path}: '{value}' is not a valid email, dropped")
    return None


def _coerce_iso_date(
    value: str | None, *, info: ValidationInfo, field_path: str
) -> str | None:
    if value is None:
        return None
    if _is_iso_date(value):
        return value
    _add_warning(info, f"{field_path}: '{value}' is not ISO 8601 (YYYY-MM-DD), dropped")
    return None


def _coerce_hhmm(
    value: str | None, *, info: ValidationInfo, field_path: str
) -> str | None:
    if value is None:
        return None
    if _HHMM_RE.match(value):
        # Sanity: hour 0-23, minute 0-59
        try:
            hour, minute = value.split(":")
            if 0 <= int(hour) <= 23 and 0 <= int(minute) <= 59:
                return value
        except ValueError:
            pass
    _add_warning(info, f"{field_path}: '{value}' is not HH:mm 24-hour, dropped")
    return None


def _coerce_positive_int(
    value: int | None, *, info: ValidationInfo, field_path: str
) -> int | None:
    if value is None:
        return None
    if value > 0:
        return value
    _add_warning(info, f"{field_path}: {value} is not positive, dropped")
    return None


def _coerce_positive_number(
    value: float | None, *, info: ValidationInfo, field_path: str
) -> float | None:
    if value is None:
        return None
    if value > 0:
        return float(value)
    _add_warning(info, f"{field_path}: {value} is not positive, dropped")
    return None


# ---------------------------------------------------------------------------
# Recursive un-stringifier for Anthropic tool-use quirks
# ---------------------------------------------------------------------------

_JSON_DECODER = json.JSONDecoder()


def _unstringify_tree(value: Any) -> Any:
    """Recursively parse any string that looks like a JSON object/array back into
    a dict/list. Anthropic tool-use occasionally serializes nested objects as
    JSON strings at arbitrary depth, sometimes with trailing garbage. Uses
    raw_decode so trailing junk does not block parsing."""
    if isinstance(value, str):
        stripped = value.lstrip()
        if stripped.startswith(("{", "[")):
            try:
                parsed, _end = _JSON_DECODER.raw_decode(stripped)
            except json.JSONDecodeError:
                return value
            return _unstringify_tree(parsed)
        return value
    if isinstance(value, dict):
        return {k: _unstringify_tree(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_unstringify_tree(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class ReferenceNumber(BaseModel):
    kind: ReferenceKind = Field(
        description=(
            "Classification of this reference. LOAD_NUMBER is the broker's primary "
            "load identifier; PO_NUMBER is a purchase order; BOL_NUMBER is a bill "
            "of lading; PICKUP_NUMBER is a pickup confirmation/appointment number; "
            "ORDER_NUMBER is a broker order number; OTHER for anything else."
        )
    )
    value: str = Field(description="The reference number value as printed")
    label: str = Field(
        description='The label as printed on the document (e.g. "Load #", "MCL PO #")'
    )


class ExtractedStop(BaseModel):
    sequence: int = Field(description="Stop order, 1-indexed")
    type: StopType | None = Field(default=None, description="Pickup or delivery enum")

    facility_name: str | None = Field(default=None)
    address: str | None = Field(default=None, description="Street address only")
    city: str | None = Field(default=None)
    state: str | None = Field(default=None, description="2-char USPS state code")
    zip: str | None = Field(default=None, description="5-digit US ZIP code")

    appointment_date: str | None = Field(
        default=None, description="Appointment date in ISO 8601 YYYY-MM-DD format"
    )
    appointment_date_raw: str | None = Field(
        default=None, description="Appointment date verbatim from the document"
    )
    appointment_time: str | None = Field(
        default=None, description="Appointment start time in HH:mm 24-hour format"
    )
    appointment_time_raw: str | None = Field(
        default=None, description="Appointment time verbatim from the document"
    )
    appointment_end_time: str | None = Field(
        default=None,
        description="End of appointment window in HH:mm 24-hour, if doc gives a window",
    )
    scheduling_type: SchedulingType | None = Field(
        default=None,
        description="APPOINTMENT/FCFS/NOTIFICATION/OPEN/DROP_HOOK if explicitly stated",
    )
    appointment_number: str | None = Field(default=None)

    contact_name: str | None = Field(default=None)
    contact_phone: str | None = Field(default=None, description="E.164 (+1XXXXXXXXXX)")
    contact_phone_raw: str | None = Field(default=None)

    commodity: str | None = Field(default=None)
    weight_lbs: int | None = Field(default=None, description="Weight in pounds, integer")
    weight_raw: str | None = Field(default=None)
    piece_count: int | None = Field(default=None)
    is_hazmat: bool | None = Field(default=None)
    is_tarp: bool | None = Field(default=None)
    is_temp_controlled: bool | None = Field(default=None)

    notes: str | None = Field(default=None, description="Stop-specific instructions")

    stop_reference_numbers: list[ReferenceNumber] = Field(default_factory=list)

    @field_validator("state", mode="after")
    @classmethod
    def _v_state(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_state(v, info=info, field_path="stop.state")

    @field_validator("zip", mode="after")
    @classmethod
    def _v_zip(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_zip(v, info=info, field_path="stop.zip")

    @field_validator("appointment_date", mode="after")
    @classmethod
    def _v_appt_date(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_iso_date(v, info=info, field_path="stop.appointment_date")

    @field_validator("appointment_time", "appointment_end_time", mode="after")
    @classmethod
    def _v_appt_time(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_hhmm(v, info=info, field_path=f"stop.{info.field_name}")

    @field_validator("contact_phone", mode="after")
    @classmethod
    def _v_phone(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_phone_e164(v, info=info, field_path="stop.contact_phone")

    @field_validator("weight_lbs", "piece_count", mode="after")
    @classmethod
    def _v_pos_int(cls, v: int | None, info: ValidationInfo) -> int | None:
        return _coerce_positive_int(v, info=info, field_path=f"stop.{info.field_name}")


class ExtractedCustomer(BaseModel):
    """Maps to the Customer entity in the app (the broker on the ratecon)."""

    company_name: str | None = Field(default=None)
    mc_number: str | None = Field(default=None, description="Digits only")
    dot_number: str | None = Field(default=None, description="Digits only")
    phone: str | None = Field(default=None, description="E.164 (+1XXXXXXXXXX)")
    phone_raw: str | None = Field(default=None)
    email: str | None = Field(default=None)
    address: str | None = Field(default=None, description="Street address")
    city: str | None = Field(default=None)
    state: str | None = Field(default=None, description="2-char USPS")
    zip: str | None = Field(default=None, description="5-digit US ZIP")

    @field_validator("mc_number", "dot_number", mode="after")
    @classmethod
    def _v_digits(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_digits(v, info=info, field_path=f"customer.{info.field_name}")

    @field_validator("phone", mode="after")
    @classmethod
    def _v_phone(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_phone_e164(v, info=info, field_path="customer.phone")

    @field_validator("email", mode="after")
    @classmethod
    def _v_email(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_email(v, info=info, field_path="customer.email")

    @field_validator("state", mode="after")
    @classmethod
    def _v_state(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_state(v, info=info, field_path="customer.state")

    @field_validator("zip", mode="after")
    @classmethod
    def _v_zip(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_zip(v, info=info, field_path="customer.zip")


class ExtractedContact(BaseModel):
    """Maps to the Contact entity in the app (broker rep)."""

    first_name: str | None = Field(default=None)
    last_name: str | None = Field(default=None)
    phone: str | None = Field(default=None, description="E.164 (+1XXXXXXXXXX)")
    phone_raw: str | None = Field(default=None)
    email: str | None = Field(default=None)
    role: str | None = Field(default=None, description="Free text role: Dispatcher, etc.")

    @field_validator("phone", mode="after")
    @classmethod
    def _v_phone(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_phone_e164(v, info=info, field_path="broker_contact.phone")

    @field_validator("email", mode="after")
    @classmethod
    def _v_email(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_email(v, info=info, field_path="broker_contact.email")


class DetentionPolicy(BaseModel):
    rate_per_hour: float | None = Field(default=None, description="USD per hour, parsed")
    rate_raw: str | None = Field(default=None, description="Rate text verbatim")
    free_hours: float | None = Field(default=None, description="Hours of free time, parsed")
    free_time_raw: str | None = Field(default=None)
    max_amount: float | None = Field(default=None, description="Cap in USD, parsed")
    max_amount_raw: str | None = Field(default=None)
    notes: str | None = Field(default=None, description="Additional conditions")

    @field_validator("rate_per_hour", "max_amount", mode="after")
    @classmethod
    def _v_positive(cls, v: float | None, info: ValidationInfo) -> float | None:
        return _coerce_positive_number(
            v, info=info, field_path=f"detention_policy.{info.field_name}"
        )


class ExtractedAccessorial(BaseModel):
    type: AccessorialType | None = Field(default=None)
    description: str = Field(description="What the fee/accessorial is for")
    amount_usd: float | None = Field(
        default=None, description="Parsed amount; null when rate is conditional/variable"
    )
    amount_raw: str = Field(description="Raw amount text from doc, always populated")
    conditions: str | None = Field(default=None, description="When this fee applies")


# ---------------------------------------------------------------------------
# Top-level result
# ---------------------------------------------------------------------------


class ExtractionResult(BaseModel):
    """Structured extraction of a rate confirmation document, aligned to the
    FleetCommand Create Load form and Prisma columns."""

    # Document classification — gates whether the rest of the fields are trustworthy.
    # Emails frequently bundle non-ratecon PDFs (BOLs, NDAs, broker packets); the
    # ingest worker auto-rejects imports where is_ratecon is false.
    is_ratecon: bool = Field(
        default=True,
        description="True only if this document is a carrier rate confirmation. False for BOLs, invoices, NDAs, broker packets, or anything else.",
    )
    document_type_guess: str | None = Field(
        default=None,
        description="Best guess at the document type when is_ratecon is false (e.g. 'Bill of Lading', 'Broker-Carrier Agreement', 'Invoice').",
    )

    # Confidence + review
    extraction_confidence: ConfidenceLevel = Field(
        default="MEDIUM",
        description="HIGH if every required field is unambiguous; MEDIUM if optional fields are ambiguous; LOW if any required field is missing or rates conflict.",
    )
    requires_review: bool = Field(
        default=False,
        description="True if any warning is present, or confidence is LOW.",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Human-readable warnings about ambiguous or dropped fields.",
    )

    # Load-level form fields
    customer_rate: float | None = Field(
        default=None,
        description="USD the broker pays the carrier (the carrier-pay total, not customer-bill).",
    )
    customer_rate_raw: str | None = Field(default=None)
    equipment_type: EquipmentType | None = Field(default=None)
    equipment_type_raw: str | None = Field(
        default=None, description="Verbatim equipment text even when enum match fails"
    )
    commodity: str | None = Field(default=None, description="Load-level commodity")
    weight_lbs: int | None = Field(default=None)
    weight_raw: str | None = Field(default=None)
    piece_count: int | None = Field(default=None)
    total_miles: int | None = Field(default=None)
    is_hazmat: bool | None = Field(default=None)
    is_tarp: bool | None = Field(default=None)
    is_team_driver: bool | None = Field(default=None)

    # Reefer fields
    reefer_temp_min_f: float | None = Field(default=None, description="Min temp in °F")
    reefer_temp_max_f: float | None = Field(default=None, description="Max temp in °F")
    reefer_temp_raw: str | None = Field(default=None)
    reefer_mode: Literal["continuous", "cycle-sentry"] | None = Field(default=None)
    reefer_precool_f: float | None = Field(default=None)

    # Long-text form fields
    dispatcher_notes: str | None = Field(
        default=None,
        description="Consolidated prose covering detention policy, fees, payment terms, POD rules — everything that affects money or compliance.",
    )
    driver_instructions: str | None = Field(
        default=None,
        description="Only what the driver needs to do their job: gate codes, check-in, dock #, seal, tracking app. No money content.",
    )

    # References
    reference_numbers: list[ReferenceNumber] = Field(default_factory=list)

    # Stops
    stops: list[ExtractedStop] = Field(default_factory=list)

    # Customer + contact
    customer: ExtractedCustomer | None = Field(default=None)
    broker_contact: ExtractedContact | None = Field(default=None)

    # Accessorials
    detention_policy: DetentionPolicy | None = Field(default=None)
    accessorials: list[ExtractedAccessorial] = Field(default_factory=list)

    # Carrier cross-check
    carrier_name_on_doc: str | None = Field(
        default=None,
        description="Carrier name the document is addressed to; used by the API to detect mis-uploaded docs.",
    )
    carrier_mc_number: str | None = Field(
        default=None, description="Carrier MC# on the document (digits only)"
    )

    # Audit
    document_date: str | None = Field(
        default=None, description="Document creation/issue date, ISO 8601 YYYY-MM-DD"
    )
    document_date_raw: str | None = Field(default=None)

    # --- Top-level validators ---

    @model_validator(mode="before")
    @classmethod
    def _coerce_stringified_nested(cls, data: Any) -> Any:
        return _unstringify_tree(data)

    @field_validator("customer_rate", mode="after")
    @classmethod
    def _v_customer_rate(cls, v: float | None, info: ValidationInfo) -> float | None:
        return _coerce_positive_number(v, info=info, field_path="customer_rate")

    @field_validator("weight_lbs", "piece_count", "total_miles", mode="after")
    @classmethod
    def _v_pos_int(cls, v: int | None, info: ValidationInfo) -> int | None:
        return _coerce_positive_int(v, info=info, field_path=info.field_name)

    @field_validator("document_date", mode="after")
    @classmethod
    def _v_doc_date(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_iso_date(v, info=info, field_path="document_date")

    @field_validator("carrier_mc_number", mode="after")
    @classmethod
    def _v_carrier_mc(cls, v: str | None, info: ValidationInfo) -> str | None:
        return _coerce_digits(v, info=info, field_path="carrier_mc_number")

    @model_validator(mode="after")
    def _merge_context_warnings(self, info: ValidationInfo) -> "ExtractionResult":
        """Merge any validator-appended warnings (from ValidationInfo.context)
        into the model's own warnings list, and force requires_review on if so."""
        if info.context is not None:
            context_warnings = info.context.get("warnings")
            if isinstance(context_warnings, list) and context_warnings:
                self.warnings = list(self.warnings) + list(context_warnings)
                self.requires_review = True
                # Downgrade confidence on any validator drop
                if self.extraction_confidence == "HIGH":
                    self.extraction_confidence = "MEDIUM"
        return self


def validate_extraction(raw_data: Any) -> ExtractionResult:
    """Parse raw Anthropic tool-use output into ExtractionResult, collecting
    validator-dropped-field warnings into the result's warnings list."""
    warnings: list[str] = []
    return ExtractionResult.model_validate(raw_data, context={"warnings": warnings})
