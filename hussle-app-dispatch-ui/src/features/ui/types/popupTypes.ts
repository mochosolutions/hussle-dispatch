/**
 * App-specific popup type maps for the global drawer/modal manager system.
 *
 * These types constrain the drawerType/modalType strings and enforce
 * the correct props shape for each popup via DrawerTypeMap/ModalTypeMap.
 *
 * Generic popup interfaces live in mocho/types/popup.ts.
 */

// ---------------------------------------------------------------------------
// Drawers
// ---------------------------------------------------------------------------

export type DrawerType =
  | 'carrierCompanyInfo'
  | 'carrierDispatchTerms'
  | 'vehicleInfo'
  | 'driverInfo';

export interface DrawerTypeMap {
  carrierCompanyInfo: { carrierId: string };
  carrierDispatchTerms: { carrierId: string };
  vehicleInfo: { vehicleId: string };
  driverInfo: { driverId: string };
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export type ModalType = 'dirtyFormConfirm';

export interface ModalTypeMap {
  dirtyFormConfirm: { onConfirm: () => void; onCancel: () => void };
}
