import type { Session } from '../../engine';
import { getVisibleSteps } from '../../engine';
import { onboardingSchema } from '../onboardingSchema';
import { locksFields, signingPhase } from '../signingPhase';

const emptySession: Session = {
  id: 'test',
  carrierId: 'c1',
  currentStepId: null,
  completedStepIds: [],
  answers: {},
  invitation: { email: null },
};

describe('onboardingSchema', () => {
  it('composes 9 phases in order', () => {
    expect(onboardingSchema.phases).toHaveLength(9);
    expect(onboardingSchema.phases.map((p) => p.id)).toEqual([
      'welcome',
      'company',
      'equipment',
      'drivers',
      'costAnalysis',
      'lanePreferences',
      'signing',
      'documents',
      'complete',
    ]);
  });

  it('declares carrier-onboarding-v2 metadata with 15 estimated minutes', () => {
    expect(onboardingSchema.metadata.name).toBe('carrier-onboarding-v2');
    expect(onboardingSchema.metadata.estimatedMinutes).toBe(15);
  });

  it('traverses without errors for an empty session', () => {
    const visible = getVisibleSteps(onboardingSchema, emptySession);
    expect(visible.length).toBeGreaterThan(0);
  });

  it('returns welcome-segmentation as the first visible step for an empty session', () => {
    const visible = getVisibleSteps(onboardingSchema, emptySession);
    expect(visible[0].id).toBe('welcome-segmentation');
  });

  it('exports locksFields named export from signingPhase with 8 dot-paths', () => {
    expect(locksFields).toHaveLength(8);
    expect(locksFields).toEqual([
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

  it('exposes locksFields on the sign-agreement step inside the composed schema', () => {
    const signing = onboardingSchema.phases.find((p) => p.id === 'signing');
    const step = signing?.steps.find((s) => s.id === 'sign-agreement');
    expect(step?.locksFields).toHaveLength(8);
  });

  it('wires the same locksFields onto the signing step', () => {
    const step = signingPhase.steps.find((s) => s.id === 'sign-agreement');
    expect(step?.locksFields).toHaveLength(8);
  });
});
