import { checkCarrierOnboarding } from '../onboardingGate';
import type { CarrierOnboardingInput } from '../onboardingGate';

// ---------------------------------------------------------------------------
// COMPANY_ASSET — only insurance is required (no agreement / W-9 with self)
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — COMPANY_ASSET', () => {
  it('returns allowed:true when insurance is on file and unexpired, even without agreement or W-9', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const input: CarrierOnboardingInput = {
      carrierType: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: true,
      insuranceExpiry: futureDate,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toEqual([]);
  });

  it('flags missing insurance for COMPANY_ASSET', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toEqual(['Certificate of Insurance']);
  });

  it('flags expired insurance for COMPANY_ASSET but does not require agreement or W-9', () => {
    const pastDate = new Date('2020-06-15');

    const input: CarrierOnboardingInput = {
      carrierType: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: true,
      insuranceExpiry: pastDate,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toEqual(['Insurance expired on 2020-06-15']);
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — all docs present and insurance valid
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER with all docs valid', () => {
  it('returns allowed:true with no missing documents when all docs on file and insurance valid', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: futureDate,
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — missing dispatch agreement
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER missing dispatch agreement', () => {
  it('includes "Signed Dispatch Agreement" in missingDocuments', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: true,
      insuranceExpiry: futureDate,
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('Signed Dispatch Agreement');
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — insurance cert not on file
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER with insuranceCertOnFile=false', () => {
  it('includes "Certificate of Insurance" in missingDocuments', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('Certificate of Insurance');
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — insurance expired
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER with expired insurance', () => {
  it('includes "Insurance expired on [date]" in missingDocuments when insuranceExpiry is in the past', () => {
    const pastDate = new Date('2020-06-15');

    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: pastDate,
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('Insurance expired on 2020-06-15');
  });

  it('does not flag expired insurance when insuranceCertOnFile is false (cert missing takes precedence)', () => {
    const pastDate = new Date('2020-06-15');

    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: false,
      insuranceExpiry: pastDate,
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('Certificate of Insurance');
    expect(result.missingDocuments).not.toContain('Insurance expired on 2020-06-15');
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — missing W-9
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER missing W-9', () => {
  it('includes "W-9" in missingDocuments', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: futureDate,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('W-9');
  });
});

// ---------------------------------------------------------------------------
// EXTERNAL_CARRIER — all documents missing
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — EXTERNAL_CARRIER missing all documents', () => {
  it('returns allowed:false with 3 items in missingDocuments', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toHaveLength(3);
    expect(result.missingDocuments).toContain('Signed Dispatch Agreement');
    expect(result.missingDocuments).toContain('Certificate of Insurance');
    expect(result.missingDocuments).toContain('W-9');
  });
});

