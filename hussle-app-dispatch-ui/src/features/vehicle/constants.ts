import type { VehicleType, VehicleOwnership } from 'features/carrier/types';

export const VEHICLE_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Load History', value: 'load-history' },
  { label: 'Documents', value: 'documents' },
];

export const VEHICLE_LIST_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Owned', value: 'OWNED' },
  { label: 'Leased', value: 'LEASED' },
];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  DRY_VAN: 'Dry Van',
  REEFER: 'Reefer',
  FLATBED: 'Flatbed',
  STEP_DECK: 'Step Deck',
  BOX_TRUCK: 'Box Truck',
  HOTSHOT: 'Hotshot',
  POWER_ONLY: 'Power Only',
};

export const OWNERSHIP_LABELS: Record<VehicleOwnership, string> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
};
