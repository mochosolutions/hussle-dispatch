export interface RequiredCarrierDocument {
  type: 'DISPATCH_AGREEMENT' | 'INSURANCE_CERT' | 'W_9' | 'CARRIER_PACKET';
  label: string;
  hint: string;
}

export const REQUIRED_CARRIER_DOCUMENTS: readonly RequiredCarrierDocument[] = [
  {
    type: 'DISPATCH_AGREEMENT',
    label: 'Dispatch Agreement',
    hint: 'You will review and sign this electronically inside the portal.',
  },
  {
    type: 'INSURANCE_CERT',
    label: 'Certificate of Insurance (COI)',
    hint: 'Upload your COI showing required coverage minimums.',
  },
  {
    type: 'W_9',
    label: 'W-9 Form',
    hint: 'Required for year-end 1099 filing.',
  },
  {
    type: 'CARRIER_PACKET',
    label: 'Carrier Packet',
    hint: 'Upload your completed carrier packet.',
  },
];
