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
  | 'carrierNote'
  | 'customerCompanyInfo'
  | 'vehicleInfo'
  | 'vehicleCreate'
  | 'driverInfo'
  | 'driverCreate'
  | 'carrierForm'
  | 'contactCreate'
  | 'loadDetail'
  | 'documentUpload';

export interface DrawerTypeMap {
  carrierCompanyInfo: { carrierId: string };
  carrierDispatchTerms: { carrierId: string };
  carrierNote: { carrierId: string };
  customerCompanyInfo: { customerId: string };
  vehicleInfo: { vehicleId: string };
  driverInfo: { driverId: string };
  loadDetail: { loadId: string };
  vehicleCreate: { onClose: () => void };
  driverCreate: { onClose: () => void };
  carrierForm: {
    open: boolean;
    onClose: () => void;
    carrier?: unknown;
    onSubmit: (values: Record<string, unknown>) => void;
  };
  contactCreate: {
    defaultType?: string;
    initialCompanyName?: string;
    onClose: () => void;
  };
  documentUpload: {
    context: import('../../documents/constants').DocumentContext;
    entityType: import('../../documents/types').DocumentEntityType;
    entityId: string;
    preselectedDocType?: import('../../documents/types').DocumentType;
    lockDocType?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export type ModalType = 'dirtyFormConfirm' | 'createLoadModal';

export interface ModalTypeMap {
  dirtyFormConfirm: { onConfirm: () => void; onCancel: () => void };
  createLoadModal: {
    onSelect: (loadType: string, template?: import('../../load/types').LoadTemplate) => void;
    onCancel?: () => void;
  };
}
