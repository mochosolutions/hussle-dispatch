import type { AgreementContext, Session } from 'features/carrier-portal/engine';

import {
  selectAgreement,
  selectAgreements,
  selectAllAgreementsSigned,
  selectAnyAgreementSigned,
  selectFirstUnsignedAgreement,
  selectIsLocked,
  selectOnboardingComplete,
  selectVisibleAgreementKeys,
} from '../carrierPortalSelectors';

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'sess-1',
  carrierId: 'carrier-1',
  currentStepId: 'sign-agreement',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'c@test.com', phone: null, organizationName: 'Acme' },
  ...overrides,
});

const makeAgreement = (overrides: Partial<AgreementContext> = {}): AgreementContext => ({
  id: 'agr-1',
  templateKey: 'DISPATCH_AGREEMENT',
  status: 'PENDING',
  ...overrides,
});

const makeState = (session: Session | null) =>
  ({
    pages: {
      carrierPortalV2: {
        token: null,
        session,
        loading: {},
        errors: {},
        lastSavedAt: null,
      },
    },
  }) as unknown as Parameters<typeof selectAgreements>[0];

describe('selectAgreements', () => {
  it('returns empty record when session is null', () => {
    expect(selectAgreements(makeState(null))).toEqual({});
  });

  it('returns the agreements record when present', () => {
    const agreements = { DISPATCH_AGREEMENT: makeAgreement() };
    expect(selectAgreements(makeState(makeSession({ agreements })))).toBe(agreements);
  });
});

describe('selectAgreement(key)', () => {
  it('returns null when key is missing', () => {
    expect(
      selectAgreement('W9')(
        makeState(makeSession({ agreements: { DISPATCH_AGREEMENT: makeAgreement() } })),
      ),
    ).toBeNull();
  });

  it('returns the agreement when key is present', () => {
    const a = makeAgreement();
    expect(
      selectAgreement('DISPATCH_AGREEMENT')(
        makeState(makeSession({ agreements: { DISPATCH_AGREEMENT: a } })),
      ),
    ).toBe(a);
  });
});

describe('selectAllAgreementsSigned', () => {
  it('returns false when agreements record is empty', () => {
    expect(selectAllAgreementsSigned(makeState(makeSession({ agreements: {} })))).toBe(false);
  });

  it('returns false when at least one agreement is not SIGNED', () => {
    expect(
      selectAllAgreementsSigned(
        makeState(
          makeSession({
            agreements: {
              DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }),
              W9: makeAgreement({ id: 'agr-2', templateKey: 'W9', status: 'PENDING' }),
            },
          }),
        ),
      ),
    ).toBe(false);
  });

  it('returns true when every agreement is SIGNED', () => {
    expect(
      selectAllAgreementsSigned(
        makeState(
          makeSession({
            agreements: {
              DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }),
              W9: makeAgreement({ id: 'agr-2', templateKey: 'W9', status: 'SIGNED' }),
            },
          }),
        ),
      ),
    ).toBe(true);
  });
});

describe('selectFirstUnsignedAgreement(visibleKeys)', () => {
  it('returns null when no agreements record', () => {
    expect(selectFirstUnsignedAgreement(['DISPATCH_AGREEMENT'])(makeState(makeSession()))).toBeNull();
  });

  it('returns the first unsigned in visibleKeys order', () => {
    const w9 = makeAgreement({ id: 'agr-2', templateKey: 'W9', status: 'PENDING' });
    const result = selectFirstUnsignedAgreement(['DISPATCH_AGREEMENT', 'W9'])(
      makeState(
        makeSession({
          agreements: {
            DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }),
            W9: w9,
          },
        }),
      ),
    );
    expect(result).toBe(w9);
  });

  it('returns null when every visible agreement is signed', () => {
    expect(
      selectFirstUnsignedAgreement(['DISPATCH_AGREEMENT'])(
        makeState(
          makeSession({
            agreements: { DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }) },
          }),
        ),
      ),
    ).toBeNull();
  });
});

describe('selectIsLocked', () => {
  it('returns false when no agreements', () => {
    expect(selectIsLocked(makeState(makeSession()))).toBe(false);
  });

  it('returns false when no agreement has signedFieldsLocked', () => {
    expect(
      selectIsLocked(
        makeState(
          makeSession({
            agreements: { DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }) },
          }),
        ),
      ),
    ).toBe(false);
  });

  it('returns true when at least one agreement has signedFieldsLocked === true', () => {
    expect(
      selectIsLocked(
        makeState(
          makeSession({
            agreements: {
              DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED', signedFieldsLocked: true }),
            },
          }),
        ),
      ),
    ).toBe(true);
  });
});

describe('selectVisibleAgreementKeys', () => {
  it('returns [] when session is null', () => {
    expect(selectVisibleAgreementKeys(null)).toEqual([]);
  });

  it("returns ['DISPATCH_AGREEMENT'] for the live schema with no visibility predicates", () => {
    expect(selectVisibleAgreementKeys(makeSession())).toEqual(['DISPATCH_AGREEMENT']);
  });
});

describe('selectAnyAgreementSigned', () => {
  it('returns false when no agreements', () => {
    expect(selectAnyAgreementSigned(makeState(makeSession()))).toBe(false);
  });

  it('returns false when no agreement is SIGNED', () => {
    expect(
      selectAnyAgreementSigned(
        makeState(
          makeSession({
            agreements: { DISPATCH_AGREEMENT: makeAgreement({ status: 'PENDING' }) },
          }),
        ),
      ),
    ).toBe(false);
  });

  it('returns true when at least one agreement is SIGNED', () => {
    expect(
      selectAnyAgreementSigned(
        makeState(
          makeSession({
            agreements: { DISPATCH_AGREEMENT: makeAgreement({ status: 'SIGNED' }) },
          }),
        ),
      ),
    ).toBe(true);
  });
});

describe('selectOnboardingComplete', () => {
  it('returns false when session is null', () => {
    expect(selectOnboardingComplete(makeState(null))).toBe(false);
  });

  it('returns false when completedAt is null', () => {
    expect(
      selectOnboardingComplete(
        makeState(makeSession({ currentStepId: 'sign-agreement', completedAt: null })),
      ),
    ).toBe(false);
  });

  it('returns true ONLY when completedAt is set (the durable post-success signal)', () => {
    expect(
      selectOnboardingComplete(
        makeState(makeSession({ completedAt: '2026-05-24T15:00:00Z' })),
      ),
    ).toBe(true);
  });

  it('returns false when currentStepId is "complete" but completedAt is null (avoids loop with route guard)', () => {
    // Cursor advancing to 'complete' client-side (via advanceCurrentStep) is
    // NOT a sufficient signal — the API might still reject the completion.
    // Only the server-stamped completedAt is authoritative.
    expect(
      selectOnboardingComplete(
        makeState(makeSession({ currentStepId: 'complete', completedAt: null })),
      ),
    ).toBe(false);
  });
});
