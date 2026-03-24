import type { CustomerType, CustomerStatus } from '../types';

export const CUSTOMER_TYPE_OPTIONS: readonly { value: CustomerType; label: string }[] = [
  { value: 'BROKER', label: 'Broker' },
  { value: 'DIRECT_SHIPPER', label: 'Direct Shipper' },
  { value: 'THREE_PL', label: '3PL' },
];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  BROKER: 'Broker',
  DIRECT_SHIPPER: 'Direct Shipper',
  THREE_PL: '3PL',
};

export const CUSTOMER_STATUS_OPTIONS: readonly { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Quick Pay', label: 'Quick Pay' },
];

export const CUSTOMER_DETAIL_TAB_ITEMS: readonly { value: string; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'loadHistory', label: 'Load History' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'notes', label: 'Notes' },
];
