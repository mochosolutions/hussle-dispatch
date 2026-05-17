import {
  computeInvalidations,
  evaluatePredicate,
  findPhaseOfStep,
  findStep,
  getNextStepId,
  getPrevStepId,
  getVisibleSteps,
  isStepVisible,
  LockViolationError,
  LOCKS_FIELDS,
  resolveContext,
  type Predicate,
  type Schema,
  type Session,
} from '..';

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'welcome',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'carrier@test.com', phone: null, organizationName: 'Acme Dispatch' },
  ...overrides,
});

const minimalSchema: Schema = {
  version: 1,
  metadata: { name: 'test-schema', estimatedMinutes: 5 },
  phases: [
    {
      id: 'welcome',
      label: 'Welcome',
      steps: [{ id: 'welcome', type: 'segmentation' }],
    },
    {
      id: 'company',
      label: 'Company',
      steps: [
        { id: 'company-authority-question', type: 'input' },
        {
          id: 'company-mc-entry',
          type: 'input',
          visibility: { op: 'eq', field: 'answers.company-authority-question.hasMcAuthority', value: 'yes' },
        },
        {
          id: 'company-confirm',
          type: 'review',
          visibility: { op: 'eq', field: 'answers.company-authority-question.hasMcAuthority', value: 'yes' },
        },
      ],
    },
    {
      id: 'equipment',
      label: 'Equipment',
      steps: [{ id: 'equipment-entry', type: 'input' }],
    },
    {
      id: 'documents',
      label: 'Documents',
      steps: [{ id: 'documents-upload', type: 'upload' }],
      visibility: { op: 'not', clause: { op: 'eq', field: 'session.carrierId', value: 'skip-docs' } },
    },
  ],
};

// ============================================================
// resolveContext
// ============================================================

describe('resolveContext', () => {
  it('resolves answers.<stepId>.<questionId>', () => {
    const session = makeSession({
      answers: { 'company-authority-question': { hasMcAuthority: 'yes' } },
    });
    expect(resolveContext(session, 'answers.company-authority-question.hasMcAuthority')).toBe('yes');
  });

  it('resolves fmcsa fields', () => {
    const session = makeSession({ fmcsaSnapshot: { legalName: 'ACME LLC' } });
    expect(resolveContext(session, 'fmcsa.legalName')).toBe('ACME LLC');
  });

  it('returns empty-record from fmcsa when no snapshot is set', () => {
    const session = makeSession();
    expect(resolveContext(session, 'fmcsa.legalName')).toBeUndefined();
  });

  it('resolves invitation fields', () => {
    const session = makeSession();
    expect(resolveContext(session, 'invitation.organizationName')).toBe('Acme Dispatch');
  });

  it('resolves agreement context when present', () => {
    const session = makeSession({
      agreement: { id: 'agr-1', status: 'SIGNED' },
    });
    expect(resolveContext(session, 'agreement.status')).toBe('SIGNED');
  });

  it('returns null root when agreement is absent', () => {
    const session = makeSession();
    expect(resolveContext(session, 'agreement.status')).toBeUndefined();
  });

  it('resolves session-level fields', () => {
    const session = makeSession({ carrierId: 'carrier-xyz' });
    expect(resolveContext(session, 'session.carrierId')).toBe('carrier-xyz');
  });

  it('returns undefined for unknown root', () => {
    const session = makeSession();
    expect(resolveContext(session, 'fake.field')).toBeUndefined();
  });

  it('returns undefined for empty/invalid path', () => {
    const session = makeSession();
    expect(resolveContext(session, '')).toBeUndefined();
    expect(resolveContext(session, undefined as unknown as string)).toBeUndefined();
  });

  it('returns undefined when traversal hits null/undefined intermediate', () => {
    const session = makeSession();
    expect(resolveContext(session, 'answers.missing.deep.value')).toBeUndefined();
  });
});

// ============================================================
// evaluatePredicate — all operators + composition
// ============================================================

describe('evaluatePredicate', () => {
  const session = makeSession({
    answers: { step: { color: 'blue', count: 3 } },
  });

  it('returns true for undefined predicate', () => {
    expect(evaluatePredicate(undefined, session)).toBe(true);
  });

  it('eq returns true when values match', () => {
    expect(evaluatePredicate({ op: 'eq', field: 'answers.step.color', value: 'blue' }, session)).toBe(true);
  });

  it('eq returns false when values differ', () => {
    expect(evaluatePredicate({ op: 'eq', field: 'answers.step.color', value: 'red' }, session)).toBe(false);
  });

  it('in returns true when context value is in the list', () => {
    expect(evaluatePredicate({ op: 'in', field: 'answers.step.color', values: ['blue', 'green'] }, session)).toBe(true);
  });

  it('in returns false when context value is not in the list', () => {
    expect(evaluatePredicate({ op: 'in', field: 'answers.step.color', values: ['red', 'green'] }, session)).toBe(false);
  });

  it('and returns true only when all clauses are true', () => {
    const p: Predicate = {
      op: 'and',
      clauses: [
        { op: 'eq', field: 'answers.step.color', value: 'blue' },
        { op: 'eq', field: 'answers.step.count', value: 3 },
      ],
    };
    expect(evaluatePredicate(p, session)).toBe(true);
  });

  it('and returns false when any clause is false', () => {
    const p: Predicate = {
      op: 'and',
      clauses: [
        { op: 'eq', field: 'answers.step.color', value: 'blue' },
        { op: 'eq', field: 'answers.step.count', value: 99 },
      ],
    };
    expect(evaluatePredicate(p, session)).toBe(false);
  });

  it('or returns true when any clause is true', () => {
    const p: Predicate = {
      op: 'or',
      clauses: [
        { op: 'eq', field: 'answers.step.color', value: 'red' },
        { op: 'eq', field: 'answers.step.count', value: 3 },
      ],
    };
    expect(evaluatePredicate(p, session)).toBe(true);
  });

  it('or returns false when all clauses are false', () => {
    const p: Predicate = {
      op: 'or',
      clauses: [
        { op: 'eq', field: 'answers.step.color', value: 'red' },
        { op: 'eq', field: 'answers.step.count', value: 99 },
      ],
    };
    expect(evaluatePredicate(p, session)).toBe(false);
  });

  it('not inverts the inner clause', () => {
    expect(evaluatePredicate({ op: 'not', clause: { op: 'eq', field: 'answers.step.color', value: 'red' } }, session)).toBe(true);
    expect(evaluatePredicate({ op: 'not', clause: { op: 'eq', field: 'answers.step.color', value: 'blue' } }, session)).toBe(false);
  });

  it('returns true conservatively when op is an unknown variant', () => {
    const malformed = { op: 'wat' } as unknown as Predicate;
    expect(evaluatePredicate(malformed, session)).toBe(true);
  });
});

// ============================================================
// getVisibleSteps / findStep / findPhaseOfStep / isStepVisible
// ============================================================

describe('getVisibleSteps', () => {
  it('returns every step when no predicates filter anything out', () => {
    const session = makeSession();
    const visible = getVisibleSteps(minimalSchema, session);
    // welcome + company-authority + equipment + documents
    // (company-mc-entry and company-confirm hidden because hasMcAuthority is unset)
    expect(visible.map((s) => s.id)).toEqual([
      'welcome',
      'company-authority-question',
      'equipment-entry',
      'documents-upload',
    ]);
  });

  it('includes conditional steps when their predicate is satisfied', () => {
    const session = makeSession({
      answers: { 'company-authority-question': { hasMcAuthority: 'yes' } },
    });
    const visible = getVisibleSteps(minimalSchema, session);
    expect(visible.map((s) => s.id)).toContain('company-mc-entry');
    expect(visible.map((s) => s.id)).toContain('company-confirm');
  });

  it('hides phase entirely when phase visibility predicate is false', () => {
    const session = makeSession({ carrierId: 'skip-docs' });
    const visible = getVisibleSteps(minimalSchema, session);
    expect(visible.map((s) => s.id)).not.toContain('documents-upload');
  });

  it('attaches phaseId + phaseLabel to each visible step', () => {
    const visible = getVisibleSteps(minimalSchema, makeSession());
    const welcome = visible[0];
    expect(welcome?.phaseId).toBe('welcome');
    expect(welcome?.phaseLabel).toBe('Welcome');
  });
});

describe('findStep + findPhaseOfStep', () => {
  it('finds an existing step by id', () => {
    expect(findStep(minimalSchema, 'equipment-entry')?.type).toBe('input');
  });

  it('returns undefined for unknown step', () => {
    expect(findStep(minimalSchema, 'nope')).toBeUndefined();
  });

  it('finds the phase that owns a step', () => {
    expect(findPhaseOfStep(minimalSchema, 'company-confirm')?.id).toBe('company');
  });

  it('returns undefined when no phase owns the stepId', () => {
    expect(findPhaseOfStep(minimalSchema, 'nope')).toBeUndefined();
  });
});

describe('isStepVisible', () => {
  it('returns true for a visible step', () => {
    expect(isStepVisible(minimalSchema, makeSession(), 'welcome')).toBe(true);
  });

  it('returns false when the step predicate fails', () => {
    expect(isStepVisible(minimalSchema, makeSession(), 'company-mc-entry')).toBe(false);
  });

  it('returns false when the phase predicate fails', () => {
    expect(isStepVisible(minimalSchema, makeSession({ carrierId: 'skip-docs' }), 'documents-upload')).toBe(false);
  });

  it('returns false for unknown step id', () => {
    expect(isStepVisible(minimalSchema, makeSession(), 'nope')).toBe(false);
  });
});

// ============================================================
// getNextStepId / getPrevStepId
// ============================================================

describe('getNextStepId', () => {
  it('returns the next visible step id', () => {
    expect(getNextStepId(minimalSchema, makeSession(), 'welcome')).toBe('company-authority-question');
  });

  it('skips hidden steps when walking forward', () => {
    expect(getNextStepId(minimalSchema, makeSession(), 'company-authority-question')).toBe('equipment-entry');
  });

  it('returns null at the end of the flow', () => {
    expect(getNextStepId(minimalSchema, makeSession(), 'documents-upload')).toBeNull();
  });

  it('returns null when currentStepId is unknown', () => {
    expect(getNextStepId(minimalSchema, makeSession(), 'unknown')).toBeNull();
  });
});

describe('getPrevStepId', () => {
  it('returns the previous visible step id', () => {
    expect(getPrevStepId(minimalSchema, makeSession(), 'equipment-entry')).toBe('company-authority-question');
  });

  it('skips hidden steps when walking backward', () => {
    const session = makeSession({
      answers: { 'company-authority-question': { hasMcAuthority: 'yes' } },
    });
    expect(getPrevStepId(minimalSchema, session, 'equipment-entry')).toBe('company-confirm');
  });

  it('returns null at the start of the flow', () => {
    expect(getPrevStepId(minimalSchema, makeSession(), 'welcome')).toBeNull();
  });

  it('returns null when currentStepId is unknown', () => {
    expect(getPrevStepId(minimalSchema, makeSession(), 'unknown')).toBeNull();
  });
});

// ============================================================
// computeInvalidations
// ============================================================

describe('computeInvalidations', () => {
  it('returns an empty array when no completed steps would flip', () => {
    const session = makeSession({ completedStepIds: ['welcome'] });
    expect(
      computeInvalidations(minimalSchema, session, 'welcome', { foo: 'bar' }),
    ).toEqual([]);
  });

  it('returns invalidated step ids when the change flips visibility for a completed step', () => {
    // Start with hasMcAuthority=yes (so company-confirm is visible + completed),
    // then change to no — company-confirm should invalidate.
    const session = makeSession({
      answers: { 'company-authority-question': { hasMcAuthority: 'yes' } },
      completedStepIds: ['welcome', 'company-authority-question', 'company-mc-entry', 'company-confirm'],
    });
    const result = computeInvalidations(
      minimalSchema,
      session,
      'company-authority-question',
      { hasMcAuthority: 'no' },
    );
    expect(result).toEqual(expect.arrayContaining(['company-confirm', 'company-mc-entry']));
    expect(result).not.toContain('company-authority-question');
    expect(result).not.toContain('welcome');
  });

  it('excludes the changed step itself from invalidations', () => {
    const session = makeSession({
      answers: { 'company-authority-question': { hasMcAuthority: 'yes' } },
      completedStepIds: ['company-authority-question'],
    });
    const result = computeInvalidations(
      minimalSchema,
      session,
      'company-authority-question',
      { hasMcAuthority: 'no' },
    );
    expect(result).not.toContain('company-authority-question');
  });

  it('throws LockViolationError when a locked path is mutated after signing', () => {
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'ACME LLC' } },
      agreement: { id: 'a-1', status: 'SIGNED' },
    });
    expect(() =>
      computeInvalidations(minimalSchema, session, 'company-confirm', {
        legalName: 'New Legal Name',
      }),
    ).toThrow(LockViolationError);
  });

  it('LockViolationError carries the offending dot-paths', () => {
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'ACME LLC', tin: '12-3456789' } },
      agreement: { id: 'a-1', status: 'SIGNED' },
    });
    try {
      computeInvalidations(minimalSchema, session, 'company-confirm', {
        legalName: 'Changed',
        tin: '99-9999999',
      });
      fail('expected LockViolationError');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(LockViolationError);
      const err = e as LockViolationError;
      expect(err.lockedFields).toEqual(expect.arrayContaining(['company.legalName', 'company.tin']));
      expect(err.stepId).toBe('company-confirm');
    }
  });

  it('does not throw when an agreement is signed but the change is to a non-locked field', () => {
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'ACME LLC' } },
      agreement: { id: 'a-1', status: 'SIGNED' },
    });
    // dbaName is not in LOCKS_FIELDS — should be allowed.
    expect(() =>
      computeInvalidations(minimalSchema, session, 'company-confirm', { dbaName: 'Acme Express' }),
    ).not.toThrow();
  });

  it('does not throw when the agreement is PENDING (only SIGNED locks)', () => {
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'ACME LLC' } },
      agreement: { id: 'a-1', status: 'PENDING' },
    });
    expect(() =>
      computeInvalidations(minimalSchema, session, 'company-confirm', { legalName: 'Changed' }),
    ).not.toThrow();
  });

  it('does not throw when the changed step is outside the company phase', () => {
    const session = makeSession({
      answers: { 'equipment-entry': { vehicles: [] } },
      agreement: { id: 'a-1', status: 'SIGNED' },
    });
    // equipment-entry isn't a company step → locks don't apply.
    expect(() =>
      computeInvalidations(minimalSchema, session, 'equipment-entry', { vehicles: ['x'] }),
    ).not.toThrow();
  });

  it('allows re-writing a locked field with its existing value (idempotent)', () => {
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'ACME LLC' } },
      agreement: { id: 'a-1', status: 'SIGNED' },
    });
    expect(() =>
      computeInvalidations(minimalSchema, session, 'company-confirm', { legalName: 'ACME LLC' }),
    ).not.toThrow();
  });
});

// ============================================================
// LOCKS_FIELDS parity / shape
// ============================================================

describe('LOCKS_FIELDS', () => {
  it('contains exactly 8 entries', () => {
    expect(LOCKS_FIELDS).toHaveLength(8);
  });

  it('includes all expected locked paths', () => {
    expect(LOCKS_FIELDS).toEqual([
      'company.legalName',
      'company.mcNumber',
      'company.dotNumber',
      'company.signatoryName',
      'company.signatoryTitle',
      'company.taxClassification',
      'company.tinType',
      'company.tin',
    ]);
  });
});
