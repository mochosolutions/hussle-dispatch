import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 6;

export const documentsQuestions: QuestionDefinition[] = [
  {
    id: 'docs.dispatchAgreement',
    phase: PHASE,
    inputType: 'text',
    label: 'Sign the Dispatch Agreement',
    hint: 'Review and sign the dispatch agreement electronically',
  },
  {
    id: 'docs.insuranceCert',
    phase: PHASE,
    inputType: 'text',
    label: 'Upload Certificate of Insurance',
    hint: 'Upload your COI showing required coverage minimums',
  },
  {
    id: 'docs.w9',
    phase: PHASE,
    inputType: 'text',
    label: 'Upload W-9 Form',
    hint: 'Required for year-end 1099 filing',
  },
  {
    id: 'docs.carrierPacket',
    phase: PHASE,
    inputType: 'text',
    label: 'Upload Carrier Packet',
    hint: 'Upload your completed carrier packet',
  },
];
