/**
 * Demo: take a Python /ratecon/extract output JSON and show exactly what the
 * Node side produces — the form prefill + the denormalized card fields that get
 * stored on PendingRateconImport and pushed into the app.
 *
 * Usage: npx ts-node --transpile-only scripts/demoRateconMapping.ts <path-to-output.json>
 */
import { readFileSync } from 'fs';

import {
  buildCardSummary,
  buildPrefill,
} from '../src/ratecon-imports/services/rateconPrefillMapper';
import type { RateconExtractionResult } from '../src/ratecon-imports/types/rateconImportTypes';

const path = process.argv[2];
if (path === undefined) {
  throw new Error('Usage: demoRateconMapping.ts <path-to-output.json>');
}

const raw = JSON.parse(readFileSync(path, 'utf8')) as
  | { result: RateconExtractionResult }
  | RateconExtractionResult;
const result: RateconExtractionResult = 'result' in raw ? raw.result : raw;

// Simulate the worker: no matched customer for this demo (or pretend matched).
const matchedCustomerId: string | null = null;

const prefill = buildPrefill(result, matchedCustomerId);
const card = buildCardSummary(result);

const line = (s: string) => `\n${'='.repeat(72)}\n${s}\n${'='.repeat(72)}`;

console.log(line('1) DOCUMENT CLASSIFICATION + CONFIDENCE (gates everything)'));
console.log({
  is_ratecon: result.is_ratecon,
  document_type_guess: result.document_type_guess,
  extraction_confidence: result.extraction_confidence,
  requires_review: result.requires_review,
  warning_count: result.warnings.length,
});

console.log(line('2) PendingRateconImport row — denormalized card fields'));
console.log({
  status: result.is_ratecon ? 'PENDING_REVIEW' : 'EXTRACTION_FAILED',
  brokerName: card.brokerName,
  laneSummary: card.laneSummary,
  customerRate: card.customerRate,
  pickupDate: card.pickupDate?.toISOString() ?? null,
  matchedCustomerId,
  requiresReview: result.requires_review,
});

console.log(line('3) RateconPrefill — the Create Load form payload (camelCase)'));
console.log(
  JSON.stringify(
    {
      externalRefNumber: prefill.externalRefNumber,
      customerRate: prefill.customerRate,
      equipmentType: prefill.equipmentType,
      commodity: prefill.commodity,
      weight: prefill.weight,
      isHazmat: prefill.isHazmat,
      isTarp: prefill.isTarp,
      reefer: {
        min: prefill.reeferTempMin,
        max: prefill.reeferTempMax,
        mode: prefill.reeferMode,
      },
      customerHint: prefill.customerHint,
      stops: prefill.stops.map((s) => ({
        seq: s.sequence,
        type: s.type,
        facility: s.facilityName,
        cityState: [s.city, s.state].filter(Boolean).join(', '),
        zip: s.zip,
        apptDate: s.appointmentDate,
        apptTime: s.appointmentTime,
        apptEnd: s.appointmentEndTime,
      })),
    },
    null,
    2,
  ),
);

console.log(line('4) dispatcher_notes (prose stored on the load)'));
console.log(prefill.dispatcherNotes ?? '(none)');
console.log(line('5) driver_instructions (prose stored on the load)'));
console.log(prefill.driverInstructions ?? '(none)');

if (result.warnings.length > 0) {
  console.log(line('6) warnings surfaced to the dispatcher'));
  result.warnings.forEach((w) => console.log(` - ${w}`));
}
