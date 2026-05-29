"""Ratecon extraction service.

Thin orchestration around the RateconExtractorPort. This is the seam where any
future cross-cutting concerns (retry policy, multi-extractor fallback, metrics)
should live — the adapter stays focused on a single LLM call shape, and the
router stays focused on HTTP concerns."""

from __future__ import annotations

from app.ratecon.ports import ExtractorOutput, RateconExtractorPort


async def extract_ratecon(
    pdf_bytes: bytes, *, extractor: RateconExtractorPort
) -> ExtractorOutput:
    if not pdf_bytes:
        raise ValueError("Empty PDF bytes")
    return await extractor.extract(pdf_bytes)
