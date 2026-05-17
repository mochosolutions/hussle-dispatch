import type { Phase } from '../engine';

export const documentsPhase: Phase = {
  id: 'documents',
  label: 'Documents',
  steps: [
    {
      id: 'documents-upload',
      type: 'upload',
      title: 'Upload your documents',
      subtitle: 'Upload your Certificate of Insurance to complete onboarding.',
      documents: [
        {
          id: 'coi',
          label: 'Certificate of Insurance',
          required: true,
        },
      ],
    },
  ],
};
