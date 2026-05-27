import type { Phase } from '../engine';

export const equipmentPhase: Phase = {
  id: 'equipment',
  label: 'Equipment',
  steps: [
    {
      id: 'equipment-entry',
      type: 'equipmentList',
      title: 'Tell us about your vehicles',
      subtitle: 'Add each vehicle you operate — we use this to verify compliance and calculate rates.',
      questions: [],
    },
  ],
};
