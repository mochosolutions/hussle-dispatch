import type { RateconCustomerHint, RateconPrefill } from 'utils/api/ratecon-imports';

// Location-state contract carried from the inbox "Review" action into CreateLoadPage.
// Task 28 consumes this on the CreateLoadPage side to prefill the form and, on submit,
// link the load back to the import via acceptRateconImport.
export interface RateconReviewLocationState {
  rateconImportId: string;
  rateconPrefill: RateconPrefill | null;
  rateconCustomerHint: RateconCustomerHint | null;
  rateconRequiresReview: boolean;
  rateconWarnings: string[];
  rateconSourceDocumentId: string | null;
}
