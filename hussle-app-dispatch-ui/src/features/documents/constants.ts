import type { DocumentType } from './types';

export type DocumentContext =
  | 'create-load'
  | 'load-detail'
  | 'carrier-detail'
  | 'driver-profile'
  | 'vehicle-detail';

export const DOC_TYPE_CONFIG = {
  BROKER_RATE_CON: { label: 'Rate Confirmation', onePer: true, compliance: false },
  BOL_UNSIGNED: { label: 'BOL (Unsigned)', onePer: true, compliance: false },
  BOL_SIGNED: { label: 'BOL (Signed)', onePer: true, compliance: false },
  POD: { label: 'Proof of Delivery', onePer: true, compliance: false },
  LUMPER_RECEIPT: { label: 'Lumper Receipt', onePer: false, compliance: false },
  SCALE_TICKET: { label: 'Scale Ticket', onePer: false, compliance: false },
  DETENTION: { label: 'Detention', onePer: false, compliance: false },
  HAZMAT: { label: 'HazMat', onePer: false, compliance: false },
  INVOICE: { label: 'Invoice', onePer: false, compliance: false },
  DISPATCH_AGREEMENT: { label: 'Dispatch Agreement', onePer: true, compliance: false },
  INSURANCE_CERT: {
    label: 'Insurance Certificate',
    onePer: false,
    compliance: true,
    metadataFields: ['policyNumber'] as const,
  },
  W9: { label: 'W-9', onePer: true, compliance: false },
  CARRIER_PACKET: { label: 'Carrier Packet', onePer: true, compliance: false },
  LICENSE: {
    label: 'License',
    onePer: true,
    compliance: true,
    metadataFields: ['licenseNumber', 'issuingState', 'cdlClass'] as const,
  },
  REGISTRATION: { label: 'Registration', onePer: true, compliance: true },
  INSPECTION_CERT: { label: 'Inspection Certificate', onePer: true, compliance: true },
  LOA: { label: 'Letter of Authority', onePer: true, compliance: false },
  OTHER: { label: 'Other', onePer: false, compliance: false },
} as const;

export const DOCUMENT_CONTEXTS: Record<DocumentContext, readonly DocumentType[]> = {
  'create-load': [
    'BROKER_RATE_CON',
    'BOL_UNSIGNED',
    'HAZMAT',
    'LOA',
    'LUMPER_RECEIPT',
    'SCALE_TICKET',
  ],
  'load-detail': [
    'BOL_UNSIGNED',
    'BOL_SIGNED',
    'POD',
    'LUMPER_RECEIPT',
    'SCALE_TICKET',
    'DETENTION',
    'HAZMAT',
    'INVOICE',
  ],
  'carrier-detail': ['DISPATCH_AGREEMENT', 'INSURANCE_CERT', 'W9', 'CARRIER_PACKET', 'OTHER'],
  'driver-profile': ['LICENSE', 'INSURANCE_CERT', 'OTHER'],
  'vehicle-detail': ['REGISTRATION', 'INSURANCE_CERT', 'INSPECTION_CERT', 'OTHER'],
};
