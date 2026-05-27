import type { Session } from '../../engine';
import { getVisibleSteps, isQuestionLocked } from '../../engine';
import { onboardingSchema } from '../onboardingSchema';

const emptySession: Session = {
  id: 'test',
  carrierId: 'c1',
  currentStepId: null,
  completedStepIds: [],
  answers: {},
  invitation: { email: null },
};

describe('onboardingSchema', () => {
  it('composes 8 phases in order — sign+upload consolidated into signing phase', () => {
    expect(onboardingSchema.phases).toHaveLength(8);
    expect(onboardingSchema.phases.map((p) => p.id)).toEqual([
      'welcome',
      'company',
      'equipment',
      'drivers',
      'costAnalysis',
      'lanePreferences',
      'signing',
      'complete',
    ]);
  });

  it('declares both templates and documents on the sign-agreement step', () => {
    const signing = onboardingSchema.phases.find((p) => p.id === 'signing');
    const step = signing?.steps.find((s) => s.id === 'sign-agreement');
    expect(step?.templates).toEqual([{ key: 'DISPATCH_AGREEMENT' }]);
    expect(step?.documents).toHaveLength(1);
    expect(step?.documents?.[0]).toMatchObject({
      id: 'coi',
      required: true,
      documentType: 'INSURANCE_CERT',
    });
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

  it('declares zero locked questions across all phases (lock primitive dormant)', () => {
    for (const phase of onboardingSchema.phases) {
      for (const step of phase.steps) {
        for (const q of step.questions ?? []) {
          expect(isQuestionLocked(q, emptySession)).toBe(false);
        }
      }
    }
  });
});
