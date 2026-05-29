# Python Service: Ratecon Extraction + BOL Scan-to-PDF

## Context

Two existing Jupyter notebooks (`/Users/jr/Development/Jupyter Notebook/bol_scanner.ipynb`, `ratecon_extraction.ipynb`) implement working pipelines:

- **Ratecon extraction** — Anthropic vision call → structured JSON (Pydantic `ExtractionResult`) covering broker, stops, equipment, charges, fees, detention policy.
- **BOL scanner** — OpenCV pipeline (LAB+Otsu paper mask → quad detection → perspective warp → shadow-removal/levels finish → multi-page PDF via Pillow).

We want to expose both as HTTP endpoints the FleetCommand app calls, so:

1. **Dispatchers** can drop a rate-con PDF on the Create Load form and have it pre-fill carrier rate, stops, references, equipment, special instructions.
2. **Drivers** can photograph signed BOLs in the field and the system stores a clean multi-page PDF (not a smear of phone photos) as the load's BOL document.

Outcome: one new Python service in the monorepo (FastAPI + Docker), two new API integration points (ratecon parse endpoint + BOL post-confirm processing), one new UI affordance on `CreateLoadPage`.

## Design Decisions (locked)

- **Service home:** new `hussle-app-dispatch-py/` package in the monorepo, FastAPI app, Docker service in `docker-compose.yml`. Deployed via Dokploy alongside API/UI.
- **BOL conversion point:** driver UI keeps existing presign+upload-to-S3+confirm flow unchanged. On `documentService.confirm()`, when the document type is BOL_SIGNED/POD and the uploaded files are images, the API queues server-to-server processing: download images from S3 → call `POST /bol/scan` → upload returned PDF → update document record to point to the PDF. Failure leaves the original images in place and flags the document for retry/manual review.
- **Ratecon trigger:** add a "Drop rate confirmation" zone at the top of `CreateLoadPage`. On parse, prefill Formik fields via `setFieldValue` for carrier rate, refs, stops, equipment, special instructions. User reviews + submits as normal.
- **Auth between Node API and Python service:** shared secret header (`X-Internal-Token`), env var on both sides. Service binds only to the internal docker network. (See conversation for tradeoffs.)
- **Anthropic API key:** lives only in the Python service env (`ANTHROPIC_API_KEY`). Node API never sees it.

## Python Service — `hussle-app-dispatch-py/`

**Stack:** FastAPI + Uvicorn, Pydantic 2 (already used by notebook schemas), `anthropic`, `pymupdf`, `opencv-python-headless`, `pillow`, `pillow-heif`, `numpy`.

**Layout:**
```
hussle-app-dispatch-py/
  pyproject.toml
  Dockerfile
  .env.example
  app/
    main.py            # FastAPI app + auth dep + route registration
    config.py          # env loading (pydantic-settings)
    auth.py            # X-Internal-Token dependency
    schemas.py         # Pydantic models (lift ExtractionResult from notebook verbatim)
    ratecon/
      service.py       # extract_ratecon(pdf_bytes) -> ExtractionResult  (port from notebook)
      router.py        # POST /ratecon/extract  (multipart pdf upload)
    bol/
      pipeline.py      # paper_mask, find_document_quad, warp, scanned_look (port from notebook)
      service.py       # scan_to_pdf(image_bytes_list) -> pdf_bytes
      router.py        # POST /bol/scan  (multipart images[])
  tests/
    test_ratecon.py    # uses ratecon_files/*.pdf fixtures from notebook dir
    test_bol.py        # uses bol_files/* fixtures
```

**Endpoints:**

- `GET /health` — liveness for Docker healthcheck.
- `POST /ratecon/extract` — `multipart/form-data` with a single `file` field (PDF). Returns the `ExtractionResult` JSON. Errors: 400 (not a PDF / >10MB), 502 (Anthropic failure), 504 (timeout).
- `POST /bol/scan` — `multipart/form-data` with `files[]` (one or more images, JPEG/PNG/HEIC). Returns `application/pdf`. Errors: 400 (no images, unreadable), 422 (`ScannerError` — driver must retake; include which page failed), 500 (unexpected).

**Porting notes:** copy the notebook helpers into `app/bol/pipeline.py` and `app/ratecon/service.py` mostly verbatim; replace file-path inputs with bytes/streams (use `cv2.imdecode(np.frombuffer(...), ...)` for images and `fitz.open(stream=pdf_bytes, filetype='pdf')` for PDFs); replace the global `client = anthropic.Anthropic()` with an injected client built once at app startup.

**Dockerfile:** `python:3.12-slim` base; install `libgl1` + `libglib2.0-0` for OpenCV headless; copy app; `CMD uvicorn app.main:app --host 0.0.0.0 --port 8000`.

## Node API — integration

### Internal HTTP client

New shared module `hussle-app-dispatch-api/src/shared/python/pythonServiceClient.ts`:

- One factory `createPythonServiceClient({ baseUrl, internalToken, logger, fetchImpl })` returning `{ extractRatecon(pdfBuffer), scanBolToPdf(imageBuffers[]) }`.
- Uses Node 20 native `fetch` + `FormData` + `Blob`. Times out at 60s (ratecon) / 30s (bol) via `AbortSignal.timeout`.
- Wired in via `compositionRoot.ts` of the loads + documents modules.
- Env vars added to `src/config/env.ts`: `PYTHON_SERVICE_URL`, `PYTHON_SERVICE_TOKEN`.

### Ratecon endpoint

New route under loads module: `POST /api/v1/loads/extract-ratecon`.

- Controller: `hussle-app-dispatch-api/src/loads/controllers/extractRateconController.ts`. Accepts `multipart/form-data` (add `multer` or reuse existing upload middleware — confirm during exploration which exists in shared middleware; if none, add `multer` as a dep, used only here). Forwards PDF bytes to `pythonClient.extractRatecon()`.
- Returns the `ExtractionResult` JSON unchanged plus a `mapped` block: a UI-friendly shape pre-mapped to the create-load form's field names.
- Mapper: `src/loads/controllers/mappers/rateconToCreateLoadMapper.ts` translates `ExtractionResult` → partial `CreateLoadInput`-shaped object:
  - `externalRefNumber` ← first ref labeled "Load #" / "Order" / etc. (heuristic table).
  - `customerRate` / `carrierRate` ← `total_rate` (carrier rate; customer left blank).
  - `equipmentType` ← map free-text trailer_type to existing enum (best-effort; unmapped → null + warning).
  - `stops[]` ← preserve order + types; address fields copy verbatim; `appointmentStart`/`End` ← stop.date + time/appointment_end parsed loosely (leave raw strings in a `rawSchedule` field if parse fails).
  - `dispatcherNotes` ← rendered text of detention policy + fees (so dispatcher sees the money-sensitive rules even if we don't model them yet).
  - Returns an array of `warnings` for unmapped fields the UI surfaces.
- No load is created here — this is parse-only. Service stays stateless.

### BOL document conversion

Extend `documentService.confirm()` (`src/documents/services/documentService.ts`):

- After confirming the document and detecting `type ∈ { BOL_SIGNED, POD }` and all uploaded blobs are images, fire-and-forget a job (use existing event bus pattern — dispatch a domain event like `DocumentImagesUploaded` and add a subscriber in the documents module that runs the conversion).
- Subscriber `src/documents/subscribers/bolImageToPdfSubscriber.ts`:
  1. Download image blobs from storage provider.
  2. Call `pythonClient.scanBolToPdf(images)`.
  3. On success: upload PDF via storage provider, update document record (new `convertedFileId` field or replace `fileKey` — choose during exploration of `Document` Prisma model; prefer adding `convertedFileKey` to preserve originals for audit).
  4. On `ScannerError` (422): mark the document `status = NEEDS_RETAKE` (add status if it doesn't exist) so the driver UI can prompt to re-photograph.
  5. On other errors: log + leave document untouched; idempotent retry via subscriber re-delivery.
- Idempotency guard: skip if `convertedFileKey` already set.

Reference existing patterns in `src/notifications/` and `src/carriers/subscribers/` for subscriber wiring + `compositionRoot` registration.

## UI — create-load ratecon dropzone

`hussle-app-dispatch-ui/src/features/load/pages/CreateLoadPage/index.tsx` (or a child component under `components/CreateLoadPage/`):

- Add a `RateconImportZone` component above the multi-step form: react-dropzone (already a dep) accepting `application/pdf`.
- New API client method in `src/utils/api/loads/index.ts`: `extractRatecon(file: File) → Promise<{ result, mapped, warnings }>`.
- On drop: POST file → on success, call Formik `setValues({ ...currentValues, ...mapped })` (or per-field `setFieldValue` to avoid clobbering user edits) → toast warnings via `enqueueSnackbar`.
- Loading state: show a spinner + "Extracting…" message inside the dropzone. Failure shows the API error and lets the user keep filling in manually.
- No Redux — this is one-shot, response goes straight into Formik state. (Pattern: matches existing one-shot uploads in the codebase.)

## Driver portal — minor change

In `src/features/driver-portal/components/PortalDocumentUpload/index.tsx`:

- After confirm, poll document status (or rely on existing realtime/saga refresh) for `NEEDS_RETAKE` and surface a clear "We couldn't read this photo — please retake" affordance. If the conversion succeeded, the document just shows a PDF preview as it would today.

(If polling/refresh infra doesn't exist for portal documents yet, defer this and instead show a one-time toast "We'll process your BOL into a PDF — you'll see it ready in a moment." Confirm during exploration.)

## docker-compose + env

- Add service in `docker-compose.yml`:
  - `python-service` → builds from `hussle-app-dispatch-py/Dockerfile`, exposes `:8000` on the internal network only (no `ports:` mapping; only API container reaches it).
  - Env: `ANTHROPIC_API_KEY`, `INTERNAL_TOKEN`.
- API service gains `PYTHON_SERVICE_URL=http://python-service:8000` + `PYTHON_SERVICE_TOKEN=...`.
- `.env.example` updates in both packages.

## Validation

- **Python tests:** run `pytest hussle-app-dispatch-py/tests/` — uses the existing sample files in `/Users/jr/Development/Jupyter Notebook/{ratecon_files,bol_files}` (copy a few representative fixtures into `hussle-app-dispatch-py/tests/fixtures/` so tests are self-contained).
- **Manual ratecon flow:** `docker compose up` → open Create Load → drop one of the four notebook rate-cons → verify carrier rate, stops, refs pre-fill; verify warnings list shows for unmapped equipment.
- **Manual BOL flow:** sign in to a driver-portal session for an active load → upload 2 BOL photos via `PortalDocumentUpload` → wait ~10s → reload → document is now a multi-page PDF in S3 / local storage; original images preserved under `convertedFileKey` or retained per audit decision.
- **Failure modes:**
  - Upload a non-PDF to the ratecon endpoint → 400.
  - Upload a `_blank_failure_demo`-style photo (uniform background) → document ends in `NEEDS_RETAKE`, driver sees retake prompt.
  - Stop the python-service container and try to create a load — UI still works for manual entry; ratecon dropzone shows error toast.
- **Lint/types:** API package — `npm run validate` in `hussle-app-dispatch-api/`. UI — `npm run validate` in `hussle-app-dispatch-ui/`. Python — `ruff check . && mypy app` (add to validate script).

## Out of scope (call out)

- No production deploy wiring (Dokploy stack updates) — flag for follow-up after local works.
- No fancy schedule parsing (we leave broker date strings verbatim in `rawSchedule` initially).
- No new equipment-type enum additions — just map best-effort and warn on unknown.
- POD-vs-BOL distinction in the converted-PDF subscriber stays the same as today; we don't re-classify.
