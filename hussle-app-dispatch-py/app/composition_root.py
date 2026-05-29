"""Composition root — wires shared infrastructure to feature adapters.

Mirrors the Node API pattern: this is the only place that knows about concrete
adapter classes. Everywhere else depends on ports."""

from __future__ import annotations

from dataclasses import dataclass

from anthropic import AsyncAnthropic

from app.config import Settings
from app.ratecon.extractors.anthropic_vision import AnthropicVisionRateconExtractor
from app.ratecon.ports import RateconExtractorPort


@dataclass
class AppDependencies:
    ratecon_extractor: RateconExtractorPort


def create_composition_root(settings: Settings) -> AppDependencies:
    anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    ratecon_extractor = AnthropicVisionRateconExtractor(
        client=anthropic_client,
        model=settings.ratecon_model,
    )
    return AppDependencies(ratecon_extractor=ratecon_extractor)
