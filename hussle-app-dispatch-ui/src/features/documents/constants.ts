import { DocumentType } from './types';
import type { DocTypeCardConfig } from 'components/DocumentPicker';

export type DocumentContext =
  | 'create-load'
  | 'load-detail'
  | 'carrier-detail'
  | 'driver-profile'
  | 'vehicle-detail';

export const DOC_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; onePer: boolean; compliance: boolean; metadataFields?: readonly string[] }
> = {
  [DocumentType.BROKER_RATE_CON]: { label: 'Rate Confirmation', onePer: true, compliance: false },
  [DocumentType.BOL_UNSIGNED]: { label: 'BOL (Unsigned)', onePer: true, compliance: false },
  [DocumentType.BOL_SIGNED]: { label: 'BOL (Signed)', onePer: true, compliance: false },
  [DocumentType.POD]: { label: 'Proof of Delivery', onePer: true, compliance: false },
  [DocumentType.LUMPER_RECEIPT]: { label: 'Lumper Receipt', onePer: false, compliance: false },
  [DocumentType.SCALE_TICKET]: { label: 'Scale Ticket', onePer: false, compliance: false },
  [DocumentType.DETENTION]: { label: 'Detention', onePer: false, compliance: false },
  [DocumentType.HAZMAT]: { label: 'HazMat', onePer: false, compliance: false },
  [DocumentType.INVOICE]: { label: 'Invoice', onePer: false, compliance: false },
  [DocumentType.DISPATCH_AGREEMENT]: {
    label: 'Dispatch Agreement',
    onePer: true,
    compliance: false,
  },
  [DocumentType.INSURANCE_CERT]: {
    label: 'Insurance Certificate',
    onePer: false,
    compliance: true,
    metadataFields: ['policyNumber'] as const,
  },
  [DocumentType.W9]: { label: 'W-9', onePer: true, compliance: false },
  [DocumentType.CARRIER_PACKET]: { label: 'Carrier Packet', onePer: true, compliance: false },
  [DocumentType.LICENSE]: {
    label: 'License',
    onePer: true,
    compliance: true,
    metadataFields: ['licenseNumber', 'issuingState', 'cdlClass'] as const,
  },
  [DocumentType.REGISTRATION]: { label: 'Registration', onePer: true, compliance: true },
  [DocumentType.INSPECTION_CERT]: {
    label: 'Inspection Certificate',
    onePer: true,
    compliance: true,
  },
  [DocumentType.LOA]: { label: 'Letter of Authority', onePer: true, compliance: false },
  [DocumentType.OTHER]: { label: 'Other', onePer: false, compliance: false },
};

export const DOCUMENT_CONTEXTS: Record<DocumentContext, readonly DocumentType[]> = {
  'create-load': [
    DocumentType.BROKER_RATE_CON,
    DocumentType.BOL_UNSIGNED,
    DocumentType.HAZMAT,
    DocumentType.LOA,
    DocumentType.LUMPER_RECEIPT,
    DocumentType.SCALE_TICKET,
  ],
  'load-detail': [
    DocumentType.BOL_UNSIGNED,
    DocumentType.BOL_SIGNED,
    DocumentType.POD,
    DocumentType.LUMPER_RECEIPT,
    DocumentType.SCALE_TICKET,
    DocumentType.DETENTION,
    DocumentType.HAZMAT,
    DocumentType.INVOICE,
  ],
  'carrier-detail': [
    DocumentType.DISPATCH_AGREEMENT,
    DocumentType.INSURANCE_CERT,
    DocumentType.W9,
    DocumentType.CARRIER_PACKET,
    DocumentType.OTHER,
  ],
  'driver-profile': [DocumentType.LICENSE, DocumentType.INSURANCE_CERT, DocumentType.OTHER],
  'vehicle-detail': [
    DocumentType.REGISTRATION,
    DocumentType.INSURANCE_CERT,
    DocumentType.INSPECTION_CERT,
    DocumentType.OTHER,
  ],
};

// ---------------------------------------------------------------------------
// Short labels & descriptions for DocumentPicker card UI
// ---------------------------------------------------------------------------

const DOC_TYPE_SHORT_LABELS: Record<DocumentType, { shortLabel: string; description: string }> = {
  [DocumentType.BROKER_RATE_CON]: { shortLabel: 'Rate Con', description: 'Broker rate confirmation' },
  [DocumentType.BOL_UNSIGNED]: { shortLabel: 'BOL', description: 'Bill of lading (unsigned)' },
  [DocumentType.BOL_SIGNED]: { shortLabel: 'Signed BOL', description: 'Bill of lading (signed)' },
  [DocumentType.POD]: { shortLabel: 'POD', description: 'Proof of delivery' },
  [DocumentType.LUMPER_RECEIPT]: { shortLabel: 'Lumper Receipt', description: 'Lumper reimbursement' },
  [DocumentType.SCALE_TICKET]: { shortLabel: 'Weight Ticket', description: 'Scale weight ticket' },
  [DocumentType.DETENTION]: { shortLabel: 'Detention', description: 'Detention documentation' },
  [DocumentType.HAZMAT]: { shortLabel: 'Hazmat', description: 'Hazmat documentation' },
  [DocumentType.INVOICE]: { shortLabel: 'Invoice', description: 'Invoice document' },
  [DocumentType.DISPATCH_AGREEMENT]: { shortLabel: 'Dispatch Agmt', description: 'Dispatch agreement' },
  [DocumentType.INSURANCE_CERT]: { shortLabel: 'Insurance', description: 'Insurance certificate' },
  [DocumentType.W9]: { shortLabel: 'W-9', description: 'W-9 tax form' },
  [DocumentType.CARRIER_PACKET]: { shortLabel: 'Carrier Packet', description: 'Carrier onboarding packet' },
  [DocumentType.LICENSE]: { shortLabel: 'License', description: 'Driver license' },
  [DocumentType.REGISTRATION]: { shortLabel: 'Registration', description: 'Vehicle registration' },
  [DocumentType.INSPECTION_CERT]: { shortLabel: 'Inspection', description: 'Inspection certificate' },
  [DocumentType.LOA]: { shortLabel: 'LOA / Special', description: 'Letter of authority' },
  [DocumentType.OTHER]: { shortLabel: 'Other', description: 'Other document' },
};

/**
 * Builds DocTypeCardConfig arrays for each DocumentContext.
 * Used by DocumentUploadDrawer to pass to DocumentPicker.
 */
const buildDocCardConfigs = (): Record<DocumentContext, readonly DocTypeCardConfig[]> => {
  const entries = Object.entries(DOCUMENT_CONTEXTS) as [DocumentContext, readonly DocumentType[]][];
  const result = {} as Record<DocumentContext, readonly DocTypeCardConfig[]>;
  entries.forEach(([context, types]) => {
    result[context] = types.map((type) => ({
      type,
      ...DOC_TYPE_SHORT_LABELS[type],
    }));
  });
  return result;
};

export const DOC_CARD_CONFIGS: Record<DocumentContext, readonly DocTypeCardConfig[]> =
  buildDocCardConfigs();

export const METADATA_FIELD_LABELS: Record<string, string> = {
  licenseNumber: 'License Number',
  issuingState: 'Issuing State',
  cdlClass: 'CDL Class',
  policyNumber: 'Policy Number',
  issuingAuthority: 'Issuing Authority',
};
