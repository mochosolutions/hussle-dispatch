from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.composition_root import create_composition_root
from app.config import get_settings
from app.ratecon.router import router as ratecon_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.deps = create_composition_root(get_settings())
    yield


app = FastAPI(title="hussle-app-dispatch-py", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(ratecon_router)
