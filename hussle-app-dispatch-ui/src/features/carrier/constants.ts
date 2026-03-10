import type { VehicleType, CarrierStatus } from './types';

export const EQUIPMENT_OPTIONS: readonly { value: VehicleType; label: string }[] = [
  { value: 'DRY_VAN', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'STEP_DECK', label: 'Step Deck' },
  { value: 'BOX_TRUCK', label: 'Box Truck' },
  { value: 'HOTSHOT', label: 'Hotshot' },
  { value: 'POWER_ONLY', label: 'Power Only' },
];

export const CDL_CLASSES = [
  { value: 'A', label: 'Class A' },
  { value: 'B', label: 'Class B' },
  { value: 'C', label: 'Class C' },
] as const;

export const VEHICLE_MAKES = [
  'Freightliner',
  'Kenworth',
  'Peterbilt',
  'Volvo',
  'International',
  'Mack',
  'Western Star',
  'Hino',
  'Isuzu',
  'Other',
] as const;

export const CONTACT_ROLES = [
  { value: 'owner', label: 'Owner / Operator' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'driver', label: 'Driver' },
  { value: 'office', label: 'Office Manager' },
] as const;

export const PAYMENT_TERMS_OPTIONS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Quick Pay'];

export const STATUS_OPTIONS: { value: CarrierStatus; label: string; color: string }[] = [
  { value: 'approved', label: 'Approved', color: 'success.main' },
  { value: 'pending', label: 'Pending Review', color: 'warning.main' },
  { value: 'suspended', label: 'Suspended', color: 'error.main' },
  { value: 'draft', label: 'Draft', color: 'text.disabled' },
];



export const CARRIER_TYPE_OPTIONS = [
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'OWNER_OPERATOR', label: 'Owner Operator' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
];

export const CARRIER_DETAIL_TAB_ITEMS: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'dispatchTerms', label: 'Dispatch Terms' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'loadHistory', label: 'Load History' },
  { key: 'documents', label: 'Documents' },
  { key: 'notes', label: 'Notes' },
];

export const ONBOARDING_ITEMS = [
  { key: 'dispatchAgreementOnFile', label: 'Dispatch Agreement' },
  { key: 'insuranceCertOnFile', label: 'Certificate of Insurance' },
  { key: 'w9OnFile', label: 'W-9' },
  { key: 'carrierPacketOnFile', label: 'Carrier Packet' },
] as const;