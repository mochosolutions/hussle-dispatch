from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.schemas import ExtractionResult


@dataclass
class ExtractorUsage:
    """Token + cache stats returned by a ratecon extractor adapter."""

    input_tokens: int
    output_tokens: int
    cache_creation_input_tokens: int = 0
    cache_read_input_tokens: int = 0


@dataclass
class ExtractorOutput:
    result: ExtractionResult
    usage: ExtractorUsage


class RateconExtractorPort(Protocol):
    """Contract for any ratecon extractor implementation.

    Implementations decide their own model, prompt, retry, and caching strategy.
    Service-level code depends only on this protocol.
    """

    async def extract(self, pdf_bytes: bytes) -> ExtractorOutput: ...
