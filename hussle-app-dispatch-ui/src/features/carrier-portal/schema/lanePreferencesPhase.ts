import type { Phase } from '../engine';

export const lanePreferencesPhase: Phase = {
  id: 'lanePreferences',
  label: 'Lane Preferences',
  steps: [
    {
      id: 'lane-preferences',
      type: 'lanePreferences',
      title: 'Which lanes do you prefer?',
      subtitle: 'Tap to cycle through neutral, preferred, and avoided.',
    },
  ],
};
