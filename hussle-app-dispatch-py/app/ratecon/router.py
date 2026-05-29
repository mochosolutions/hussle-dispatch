from __future__ import annotations

import logging

from anthropic import APIConnectionError, APIStatusError, APITimeoutError
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app.auth import require_internal_token
from app.config import get_settings
from app.ratecon.ports import RateconExtractorPort
from app.ratecon.service import extract_ratecon

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ratecon", tags=["ratecon"])


def get_extractor(request: Request) -> RateconExtractorPort:
    return request.app.state.deps.ratecon_extractor


@router.post("/extract", dependencies=[Depends(require_internal_token)])
async def extract(
    file: UploadFile = File(...),
    extractor: RateconExtractorPort = Depends(get_extractor),
) -> dict:
    settings = get_settings()
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected application/pdf, got {file.content_type}",
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {settings.max_upload_bytes} byte limit",
        )
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file"
        )

    try:
        output = await extract_ratecon(pdf_bytes, extractor=extractor)
    except APITimeoutError as err:
        logger.exception("Anthropic timeout")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Anthropic timeout"
        ) from err
    except (APIConnectionError, APIStatusError) as err:
        logger.exception("Anthropic upstream error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Anthropic upstream error: {err}",
        ) from err
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err

    return {
        "result": output.result.model_dump(),
        "usage": {
            "input_tokens": output.usage.input_tokens,
            "output_tokens": output.usage.output_tokens,
            "cache_creation_input_tokens": output.usage.cache_creation_input_tokens,
            "cache_read_input_tokens": output.usage.cache_read_input_tokens,
        },
    }
