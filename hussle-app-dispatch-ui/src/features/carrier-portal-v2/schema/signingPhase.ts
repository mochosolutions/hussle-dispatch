import { LOCKS_FIELDS, type Phase } from '../engine';

export const locksFields: string[] = [...LOCKS_FIELDS];

export const signingPhase: Phase = {
  id: 'signing',
  label: 'Sign Agreement',
  steps: [
    {
      id: 'sign-agreement',
      type: 'signing',
      title: 'Sign your dispatch agreement',
      subtitle: 'Review and sign electronically to lock in your company details.',
      template: 'dispatch_v1',
      locksFields,
    },
  ],
};
