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
  // Driver pack
  [DocumentType.MEDICAL_CARD]: { label: 'DOT Medical Card', onePer: true, compliance: true },
  [DocumentType.MVR]: { label: 'Motor Vehicle Record', onePer: false, compliance: false },
  [DocumentType.DRUG_TEST]: { label: 'Drug Test Result', onePer: false, compliance: false },
  [DocumentType.ROAD_TEST_CERT]: { label: 'Road Test Certificate', onePer: false, compliance: false },
  [DocumentType.DRIVER_APPLICATION]: { label: 'Driver Application', onePer: false, compliance: false },
  [DocumentType.PSP_REPORT]: { label: 'PSP Report', onePer: false, compliance: false },
  [DocumentType.BACKGROUND_CHECK]: { label: 'Background Check', onePer: false, compliance: false },
  [DocumentType.ANNUAL_REVIEW]: { label: 'Annual Review', onePer: false, compliance: false },
  [DocumentType.HAZMAT_ENDORSEMENT]: { label: 'HazMat Endorsement', onePer: true, compliance: true },
  [DocumentType.TWIC_CARD]: { label: 'TWIC Card', onePer: true, compliance: true },
  // Carrier pack
  [DocumentType.MC_AUTHORITY]: { label: 'MC / Operating Authority', onePer: true, compliance: true },
  [DocumentType.VOIDED_CHECK]: { label: 'Voided Check', onePer: false, compliance: false },
  [DocumentType.NOTICE_OF_ASSIGNMENT]: { label: 'Notice of Assignment', onePer: false, compliance: false },
  [DocumentType.BOC3]: { label: 'BOC-3', onePer: true, compliance: true },
  [DocumentType.IFTA_LICENSE]: { label: 'IFTA License', onePer: true, compliance: true },
  // Vehicle pack
  [DocumentType.TITLE]: { label: 'Vehicle Title', onePer: true, compliance: true },
  [DocumentType.IFTA_DECAL]: { label: 'IFTA Decal', onePer: true, compliance: true },
  [DocumentType.IRP_CAB_CARD]: { label: 'IRP Cab Card', onePer: true, compliance: true },
  [DocumentType.MAINTENANCE_RECORD]: { label: 'Maintenance Record', onePer: false, compliance: false },
  [DocumentType.LEASE_AGREEMENT]: { label: 'Lease Agreement', onePer: true, compliance: true },
  [DocumentType.BIT_INSPECTION]: { label: 'BIT Inspection (CA)', onePer: true, compliance: true },
  // Load pack
  [DocumentType.TEMPERATURE_LOG]: { label: 'Temperature Log', onePer: false, compliance: false },
  [DocumentType.TONU_DOC]: { label: 'TONU Documentation', onePer: false, compliance: false },
  [DocumentType.FUEL_RECEIPT]: { label: 'Fuel Receipt', onePer: false, compliance: false },
  [DocumentType.LOAD_PHOTO]: { label: 'Load Photo', onePer: false, compliance: false },
};

export const DOCUMENT_CONTEXTS: Record<DocumentContext, readonly DocumentType[]> = {
  'create-load': [
    DocumentType.BROKER_RATE_CON,
    DocumentType.BOL_UNSIGNED,
    DocumentType.HAZMAT,
    DocumentType.LOA,
    DocumentType.LUMPER_RECEIPT,
    DocumentType.SCALE_TICKET,
    DocumentType.OTHER,
  ],
  'load-detail': [
    DocumentType.BROKER_RATE_CON,
    DocumentType.BOL_UNSIGNED,
    DocumentType.BOL_SIGNED,
    DocumentType.POD,
    DocumentType.LUMPER_RECEIPT,
    DocumentType.SCALE_TICKET,
    DocumentType.DETENTION,
    DocumentType.HAZMAT,
    DocumentType.INVOICE,
    DocumentType.LOA,
    DocumentType.TEMPERATURE_LOG,
    DocumentType.TONU_DOC,
    DocumentType.FUEL_RECEIPT,
    DocumentType.LOAD_PHOTO,
    DocumentType.OTHER,
  ],
  'carrier-detail': [
    DocumentType.DISPATCH_AGREEMENT,
    DocumentType.INSURANCE_CERT,
    DocumentType.W9,
    DocumentType.CARRIER_PACKET,
    DocumentType.MC_AUTHORITY,
    DocumentType.VOIDED_CHECK,
    DocumentType.NOTICE_OF_ASSIGNMENT,
    DocumentType.BOC3,
    DocumentType.IFTA_LICENSE,
    DocumentType.OTHER,
  ],
  'driver-profile': [
    DocumentType.LICENSE,
    DocumentType.INSURANCE_CERT,
    DocumentType.MEDICAL_CARD,
    DocumentType.MVR,
    DocumentType.DRUG_TEST,
    DocumentType.ROAD_TEST_CERT,
    DocumentType.DRIVER_APPLICATION,
    DocumentType.PSP_REPORT,
    DocumentType.BACKGROUND_CHECK,
    DocumentType.ANNUAL_REVIEW,
    DocumentType.HAZMAT_ENDORSEMENT,
    DocumentType.TWIC_CARD,
    DocumentType.OTHER,
  ],
  'vehicle-detail': [
    DocumentType.REGISTRATION,
    DocumentType.INSURANCE_CERT,
    DocumentType.INSPECTION_CERT,
    DocumentType.TITLE,
    DocumentType.IFTA_DECAL,
    DocumentType.IRP_CAB_CARD,
    DocumentType.MAINTENANCE_RECORD,
    DocumentType.LEASE_AGREEMENT,
    DocumentType.BIT_INSPECTION,
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
  // Driver pack
  [DocumentType.MEDICAL_CARD]: { shortLabel: 'Medical Card', description: 'DOT medical examiner card' },
  [DocumentType.MVR]: { shortLabel: 'MVR', description: 'Motor vehicle record' },
  [DocumentType.DRUG_TEST]: { shortLabel: 'Drug Test', description: 'Drug screen result' },
  [DocumentType.ROAD_TEST_CERT]: { shortLabel: 'Road Test', description: 'Road test certificate' },
  [DocumentType.DRIVER_APPLICATION]: { shortLabel: 'Driver App', description: 'Driver application form' },
  [DocumentType.PSP_REPORT]: { shortLabel: 'PSP', description: 'Pre-employment screening report' },
  [DocumentType.BACKGROUND_CHECK]: { shortLabel: 'Background', description: 'Background check report' },
  [DocumentType.ANNUAL_REVIEW]: { shortLabel: 'Annual Review', description: 'Annual driving record review' },
  [DocumentType.HAZMAT_ENDORSEMENT]: { shortLabel: 'HazMat End.', description: 'HazMat endorsement' },
  [DocumentType.TWIC_CARD]: { shortLabel: 'TWIC', description: 'TWIC card' },
  // Carrier pack
  [DocumentType.MC_AUTHORITY]: { shortLabel: 'MC Authority', description: 'Operating authority' },
  [DocumentType.VOIDED_CHECK]: { shortLabel: 'Voided Check', description: 'Voided check for ACH' },
  [DocumentType.NOTICE_OF_ASSIGNMENT]: { shortLabel: 'NOA', description: 'Notice of assignment' },
  [DocumentType.BOC3]: { shortLabel: 'BOC-3', description: 'Process agent designation' },
  [DocumentType.IFTA_LICENSE]: { shortLabel: 'IFTA License', description: 'IFTA license' },
  // Vehicle pack
  [DocumentType.TITLE]: { shortLabel: 'Title', description: 'Vehicle title' },
  [DocumentType.IFTA_DECAL]: { shortLabel: 'IFTA Decal', description: 'IFTA decal' },
  [DocumentType.IRP_CAB_CARD]: { shortLabel: 'IRP Cab Card', description: 'IRP cab card' },
  [DocumentType.MAINTENANCE_RECORD]: { shortLabel: 'Maintenance', description: 'Maintenance record' },
  [DocumentType.LEASE_AGREEMENT]: { shortLabel: 'Lease', description: 'Lease agreement' },
  [DocumentType.BIT_INSPECTION]: { shortLabel: 'BIT', description: 'BIT inspection (CA)' },
  // Load pack
  [DocumentType.TEMPERATURE_LOG]: { shortLabel: 'Temp Log', description: 'Temperature log' },
  [DocumentType.TONU_DOC]: { shortLabel: 'TONU Doc', description: 'TONU documentation' },
  [DocumentType.FUEL_RECEIPT]: { shortLabel: 'Fuel Receipt', description: 'Fuel receipt' },
  [DocumentType.LOAD_PHOTO]: { shortLabel: 'Load Photo', description: 'Load photo' },
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
