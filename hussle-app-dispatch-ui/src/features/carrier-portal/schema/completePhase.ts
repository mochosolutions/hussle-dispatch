import type { Phase } from '../engine';

export const completePhase: Phase = {
  id: 'complete',
  label: 'Complete',
  steps: [
    {
      id: 'complete',
      type: 'complete',
      title: "You're ready to dispatch!",
      subtitle: 'Your onboarding is complete. We will be in touch shortly.',
    },
  ],
};
