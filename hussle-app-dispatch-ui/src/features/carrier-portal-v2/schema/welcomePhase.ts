import type { Phase } from '../engine';

export const welcomePhase: Phase = {
  id: 'welcome',
  label: 'Welcome',
  steps: [
    {
      id: 'welcome-segmentation',
      type: 'segmentation',
      title: 'How do you operate?',
      questions: [
        {
          id: 'carrier_type',
          label: 'How do you operate?',
          fieldType: 'cards',
          options: [
            {
              value: 'owner_operator',
              label: 'Owner-operator',
              description: '1 truck, I drive it',
            },
            {
              value: 'small_fleet',
              label: 'Small fleet',
              description: '2–10 trucks',
            },
            {
              value: 'dispatcher_carrier',
              label: 'Dispatcher-carrier',
              description: 'I run trucks and dispatch others',
            },
          ],
        },
      ],
    },
  ],
};
