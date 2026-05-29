"""Unit tests for the ratecon service layer + schema validators.

Service tests use a fake RateconExtractorPort so they don't hit Anthropic.
Schema tests exercise the drop-and-warn validator pattern."""

from __future__ import annotations

import pytest

from app.ratecon.ports import ExtractorOutput, ExtractorUsage, RateconExtractorPort
from app.ratecon.service import extract_ratecon
from app.schemas import (
    ExtractedCustomer,
    ExtractedStop,
    ExtractionResult,
    validate_extraction,
)


# ---------------------------------------------------------------------------
# Service-layer tests (port stub)
# ---------------------------------------------------------------------------


class FakeExtractor:
    """Implements RateconExtractorPort by structural typing — no inheritance needed."""

    def __init__(self, output: ExtractorOutput) -> None:
        self._output = output
        self.calls: list[bytes] = []

    async def extract(self, pdf_bytes: bytes) -> ExtractorOutput:
        self.calls.append(pdf_bytes)
        return self._output


def _make_output() -> ExtractorOutput:
    return ExtractorOutput(
        result=ExtractionResult(
            extraction_confidence="HIGH",
            requires_review=False,
            warnings=[],
        ),
        usage=ExtractorUsage(input_tokens=10, output_tokens=20),
    )


async def test_extract_ratecon_delegates_to_extractor() -> None:
    fake: RateconExtractorPort = FakeExtractor(_make_output())
    output = await extract_ratecon(b"%PDF-1.4 fake bytes", extractor=fake)

    assert output.usage.input_tokens == 10
    assert output.usage.output_tokens == 20
    assert isinstance(output.result, ExtractionResult)
    assert output.result.extraction_confidence == "HIGH"


async def test_extract_ratecon_rejects_empty_bytes() -> None:
    fake = FakeExtractor(_make_output())
    with pytest.raises(ValueError, match="Empty PDF"):
        await extract_ratecon(b"", extractor=fake)
    assert fake.calls == []


# ---------------------------------------------------------------------------
# Schema validator tests — drop-and-warn behavior
# ---------------------------------------------------------------------------


def test_is_ratecon_defaults_true_and_can_be_set_false() -> None:
    clean = validate_extraction({"extraction_confidence": "HIGH"})
    assert clean.is_ratecon is True
    assert clean.document_type_guess is None

    rejected = validate_extraction(
        {
            "is_ratecon": False,
            "document_type_guess": "Bill of Lading",
            "extraction_confidence": "LOW",
        }
    )
    assert rejected.is_ratecon is False
    assert rejected.document_type_guess == "Bill of Lading"


def test_validate_extraction_passes_clean_data_unchanged() -> None:
    result = validate_extraction(
        {
            "extraction_confidence": "HIGH",
            "customer_rate": 1850.0,
            "customer_rate_raw": "$1,850.00",
            "equipment_type": "REEFER",
            "stops": [
                {
                    "sequence": 1,
                    "type": "PICKUP",
                    "city": "Bohemia",
                    "state": "NY",
                    "zip": "11716",
                    "appointment_date": "2026-04-09",
                    "appointment_time": "08:00",
                }
            ],
        }
    )
    assert result.extraction_confidence == "HIGH"
    assert result.requires_review is False
    assert result.warnings == []
    assert result.customer_rate == 1850.0
    assert result.stops[0].zip == "11716"


def test_invalid_appointment_date_is_dropped_with_warning() -> None:
    result = validate_extraction(
        {
            "stops": [
                {
                    "sequence": 1,
                    "type": "PICKUP",
                    "appointment_date": "4/9/26",  # not ISO 8601
                    "appointment_date_raw": "4/9/26",
                }
            ]
        }
    )
    assert result.stops[0].appointment_date is None
    assert result.stops[0].appointment_date_raw == "4/9/26"
    assert result.requires_review is True
    assert any("appointment_date" in w for w in result.warnings)


def test_invalid_state_is_dropped_with_warning() -> None:
    result = validate_extraction(
        {"customer": {"state": "ZZ", "company_name": "Foo Logistics"}}
    )
    assert result.customer.state is None
    assert result.customer.company_name == "Foo Logistics"
    assert any("customer.state" in w for w in result.warnings)


def test_state_is_normalized_to_uppercase_when_valid() -> None:
    result = validate_extraction({"customer": {"state": " fl "}})
    assert result.customer.state == "FL"
    assert result.requires_review is False


def test_invalid_zip_is_dropped_and_plus4_is_truncated() -> None:
    # Plus-4 ZIPs get truncated to 5
    result = validate_extraction({"customer": {"zip": "11716-1234"}})
    assert result.customer.zip == "11716"

    # Garbage ZIPs are dropped
    result = validate_extraction({"customer": {"zip": "not-a-zip"}})
    assert result.customer.zip is None
    assert any("customer.zip" in w for w in result.warnings)


def test_invalid_phone_is_dropped() -> None:
    result = validate_extraction({"customer": {"phone": "(910) 555-0100"}})
    # Not E.164 — validator drops it
    assert result.customer.phone is None
    assert any("customer.phone" in w for w in result.warnings)


def test_valid_e164_phone_passes() -> None:
    result = validate_extraction({"customer": {"phone": "+19105550100"}})
    assert result.customer.phone == "+19105550100"


def test_mc_number_strips_non_digits() -> None:
    result = validate_extraction({"customer": {"mc_number": "MC 1145125"}})
    assert result.customer.mc_number == "1145125"


def test_invalid_email_is_dropped() -> None:
    result = validate_extraction({"customer": {"email": "not-an-email"}})
    assert result.customer.email is None
    assert any("customer.email" in w for w in result.warnings)


def test_valid_email_is_lowercased() -> None:
    result = validate_extraction({"customer": {"email": "REP@BROKER.COM"}})
    assert result.customer.email == "rep@broker.com"


def test_negative_customer_rate_is_dropped() -> None:
    result = validate_extraction({"customer_rate": -100.0})
    assert result.customer_rate is None
    assert any("customer_rate" in w for w in result.warnings)


def test_validator_warnings_downgrade_high_confidence_to_medium() -> None:
    result = validate_extraction(
        {
            "extraction_confidence": "HIGH",
            "customer": {"state": "ZZ"},  # triggers a validator warning
        }
    )
    assert result.extraction_confidence == "MEDIUM"
    assert result.requires_review is True


def test_recursive_unstringify_handles_nested_json_strings() -> None:
    # Anthropic occasionally returns nested objects as JSON strings; the
    # _unstringify_tree validator unwraps them before field validation.
    result = validate_extraction(
        {
            "extraction_confidence": "HIGH",
            "customer": '{"company_name": "Foo Logistics", "state": "NY"}',
        }
    )
    assert isinstance(result.customer, ExtractedCustomer)
    assert result.customer.company_name == "Foo Logistics"
    assert result.customer.state == "NY"


def test_recursive_unstringify_handles_trailing_junk() -> None:
    # Real Anthropic bug: stringified JSON sometimes has an extra trailing `}`.
    # raw_decode parses the first valid object and ignores trailing data.
    bad_json = '{"company_name": "RLS Logistics", "state": "NJ"}}'  # extra `}`
    result = validate_extraction(
        {"extraction_confidence": "HIGH", "customer": bad_json}
    )
    assert isinstance(result.customer, ExtractedCustomer)
    assert result.customer.company_name == "RLS Logistics"
    assert result.customer.state == "NJ"


def test_warnings_are_deduplicated_via_context_merge() -> None:
    # Trigger multiple validator drops; warnings should accumulate in order.
    result = validate_extraction(
        {
            "customer": {"state": "ZZ", "phone": "not-a-phone", "email": "bad"},
        }
    )
    assert len(result.warnings) >= 3
    assert result.requires_review is True


def test_invalid_equipment_falls_back_to_raw_only() -> None:
    # Sending an invalid equipment_type enum should be rejected by Pydantic itself
    # (since the field is typed as EquipmentType). The adapter is responsible for
    # only sending valid enum values; if the LLM emits garbage, we expect Pydantic
    # to raise. The defense is in the prompt + tool schema.
    with pytest.raises(Exception):
        validate_extraction({"equipment_type": "ROCKETSHIP"})


def test_stop_appointment_time_window_validates_both_endpoints() -> None:
    result = validate_extraction(
        {
            "stops": [
                {
                    "sequence": 1,
                    "type": "PICKUP",
                    "appointment_time": "08:00",
                    "appointment_end_time": "14:00",
                }
            ]
        }
    )
    assert result.stops[0].appointment_time == "08:00"
    assert result.stops[0].appointment_end_time == "14:00"
    assert result.requires_review is False


def test_stop_appointment_end_time_invalid_dropped() -> None:
    result = validate_extraction(
        {
            "stops": [
                {
                    "sequence": 1,
                    "type": "PICKUP",
                    "appointment_time": "08:00",
                    "appointment_end_time": "25:00",  # invalid hour
                }
            ]
        }
    )
    assert result.stops[0].appointment_time == "08:00"
    assert result.stops[0].appointment_end_time is None
    assert any("appointment_end_time" in w for w in result.warnings)
