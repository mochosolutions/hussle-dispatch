import { DocumentType } from 'features/documents/types';

import type { Phase } from '../engine';

export const signingPhase: Phase = {
  id: 'signing',
  label: 'Sign & upload',
  steps: [
    {
      id: 'sign-agreement',
      type: 'signing',
      title: 'Sign your dispatch agreement',
      subtitle: 'Upload your supporting documents, then sign electronically to complete onboarding.',
      templates: [{ key: 'DISPATCH_AGREEMENT' }],
      documents: [
        {
          id: 'coi',
          label: 'Certificate of Insurance',
          required: true,
          documentType: DocumentType.INSURANCE_CERT,
        },
      ],
    },
  ],
};
