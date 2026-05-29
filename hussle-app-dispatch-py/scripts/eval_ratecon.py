"""Eval harness: POST every fixture PDF to a running service and write JSON results.

Usage:
    uvicorn app.main:app --reload --port 8000   # in one shell
    python scripts/eval_ratecon.py               # in another

Outputs land in tests/output/<fixture-stem>.json.
Run `python scripts/eval_ratecon.py --help` for options.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures" / "ratecon"
OUTPUT = ROOT / "tests" / "output"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--url", default="http://localhost:8000/ratecon/extract", help="Service endpoint URL"
    )
    parser.add_argument(
        "--token",
        default=None,
        help="X-Internal-Token header (defaults to INTERNAL_TOKEN env or 'dev')",
    )
    parser.add_argument(
        "--only", default=None, help="Substring filter — only process matching filenames"
    )
    parser.add_argument(
        "--timeout", type=float, default=90.0, help="Per-request timeout (seconds)"
    )
    return parser.parse_args()


def main() -> int:
    load_dotenv(ROOT / ".env")
    args = parse_args()
    token = args.token or os.getenv("INTERNAL_TOKEN", "dev")

    pdfs = sorted(FIXTURES.glob("*.pdf"))
    if args.only:
        pdfs = [p for p in pdfs if args.only.lower() in p.name.lower()]
    if not pdfs:
        print(f"No PDFs found in {FIXTURES}", file=sys.stderr)
        return 1

    OUTPUT.mkdir(parents=True, exist_ok=True)
    print(f"Running {len(pdfs)} fixture(s) against {args.url}\n")

    summary: list[dict] = []
    with httpx.Client(timeout=args.timeout) as client:
        for pdf in pdfs:
            print(f"→ {pdf.name}")
            started = time.monotonic()
            try:
                with pdf.open("rb") as fh:
                    response = client.post(
                        args.url,
                        files={"file": (pdf.name, fh, "application/pdf")},
                        headers={"X-Internal-Token": token},
                    )
            except httpx.HTTPError as err:
                print(f"  ✗ HTTP error: {err}\n")
                summary.append({"file": pdf.name, "error": str(err)})
                continue

            elapsed = time.monotonic() - started
            if response.status_code != 200:
                print(f"  ✗ {response.status_code}: {response.text[:200]}\n")
                summary.append(
                    {"file": pdf.name, "status": response.status_code, "body": response.text[:500]}
                )
                continue

            payload = response.json()
            out_path = OUTPUT / f"{pdf.stem}.json"
            out_path.write_text(json.dumps(payload, indent=2))

            result = payload["result"]
            usage = payload["usage"]
            customer = (result.get("customer") or {}).get("company_name") or "?"
            stops = len(result.get("stops") or [])
            refs = len(result.get("reference_numbers") or [])
            rate = result.get("customer_rate")
            confidence = result.get("extraction_confidence", "?")
            warnings_count = len(result.get("warnings") or [])
            review_flag = " ⚠REVIEW" if result.get("requires_review") else ""
            cache_read = usage.get("cache_read_input_tokens", 0)
            cache_write = usage.get("cache_creation_input_tokens", 0)
            cache_tag = ""
            if cache_read:
                cache_tag = f" cache_read={cache_read}"
            elif cache_write:
                cache_tag = f" cache_write={cache_write}"
            print(
                f"  ✓ {elapsed:5.1f}s  conf={confidence}{review_flag}  "
                f"customer={customer}  stops={stops}  refs={refs}  rate={rate}  "
                f"warnings={warnings_count}  "
                f"tokens={usage['input_tokens']}/{usage['output_tokens']}{cache_tag}"
            )
            print(f"  → wrote {out_path.relative_to(ROOT)}\n")
            summary.append(
                {
                    "file": pdf.name,
                    "elapsed_seconds": round(elapsed, 1),
                    "extraction_confidence": confidence,
                    "requires_review": result.get("requires_review", False),
                    "warnings_count": warnings_count,
                    "customer": customer,
                    "stops": stops,
                    "refs": refs,
                    "customer_rate": rate,
                    "input_tokens": usage["input_tokens"],
                    "output_tokens": usage["output_tokens"],
                    "cache_read_input_tokens": cache_read,
                    "cache_creation_input_tokens": cache_write,
                }
            )

    summary_path = OUTPUT / "SUMMARY.json"
    summary_path.write_text(json.dumps(summary, indent=2))
    print(f"Summary written to {summary_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
