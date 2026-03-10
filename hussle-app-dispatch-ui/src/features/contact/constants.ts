import type { ContactType } from './types';

export const CONTACT_TYPE_OPTIONS: readonly { value: ContactType; label: string }[] = [
  { value: 'BROKER', label: 'Broker' },
  { value: 'SHIPPER', label: 'Shipper' },
  { value: 'CONSIGNEE', label: 'Consignee' },
  { value: 'FACTORING', label: 'Factoring' },
];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  BROKER: 'Broker',
  SHIPPER: 'Shipper',
  CONSIGNEE: 'Consignee',
  FACTORING: 'Factoring',
};

export const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  BROKER: 'primary',
  SHIPPER: 'success',
  CONSIGNEE: 'warning',
  FACTORING: 'info',
};

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Quick Pay', label: 'Quick Pay' },
];
