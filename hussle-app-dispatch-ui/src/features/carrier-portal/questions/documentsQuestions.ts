import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';
import { DocumentType } from '../types';

const PHASE = 4;

export const documentsQuestions: QuestionDefinition[] = [
  {
    id: 'docs.dispatchAgreement',
    phase: PHASE,
    inputType: 'documentSign',
    documentType: DocumentType.DISPATCH_AGREEMENT,
    label: 'Sign the Dispatch Agreement',
    hint: 'Review and sign the dispatch agreement electronically.',
    required: true,
  },
  {
    id: 'docs.insuranceCert',
    phase: PHASE,
    inputType: 'documentUpload',
    documentType: DocumentType.INSURANCE_CERT,
    label: 'Upload Certificate of Insurance',
    hint: 'Upload your COI showing required coverage minimums.',
    required: true,
  },
  {
    id: 'docs.w9',
    phase: PHASE,
    inputType: 'documentUpload',
    documentType: DocumentType.W_9,
    label: 'Upload W-9 Form',
    hint: 'Required for year-end 1099 filing.',
    required: true,
  },
  {
    id: 'docs.carrierPacket',
    phase: PHASE,
    inputType: 'documentUpload',
    documentType: DocumentType.CARRIER_PACKET,
    label: 'Upload Carrier Packet',
    hint: 'Upload your completed carrier packet.',
    required: true,
  },
];
