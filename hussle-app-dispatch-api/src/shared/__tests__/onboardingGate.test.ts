import { checkCarrierOnboarding } from '../onboardingGate';
import type { CarrierOnboardingInput } from '../onboardingGate';

// ---------------------------------------------------------------------------
// COMPANY_ASSET — always allowed
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — COMPANY_ASSET', () => {
  it('returns allowed:true with no missing documents regardless of doc status', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toEqual([]);
  });

  it('returns allowed:true even when all documents missing', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toHaveLength(0);
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

// ---------------------------------------------------------------------------
// OWNER_OPERATOR — always rejected
// ---------------------------------------------------------------------------

describe('checkCarrierOnboarding — OWNER_OPERATOR', () => {
  it('returns allowed:false with "Owner-operator support coming soon" message', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'OWNER_OPERATOR',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: new Date(),
      w9OnFile: true,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toEqual(['Owner-operator support coming soon']);
  });

  it('returns allowed:false regardless of document status', () => {
    const input: CarrierOnboardingInput = {
      carrierType: 'OWNER_OPERATOR',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
    };

    const result = checkCarrierOnboarding(input);

    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toHaveLength(1);
    expect(result.missingDocuments[0]).toBe('Owner-operator support coming soon');
  });
});
