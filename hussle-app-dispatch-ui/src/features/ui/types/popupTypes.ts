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
  | 'vehicleExpenses'
  | 'vehicleTargets'
  | 'vehicleCreate'
  | 'driverInfo'
  | 'driverPreferences'
  | 'driverLocation'
  | 'driverWeeklySchedule'
  | 'driverScheduleOverride'
  | 'driverCreate'
  | 'carrierForm'
  | 'contactCreate'
  | 'contactInfo'
  | 'documentUpload'
  | 'disputeSettlement'
  | 'addAdjustment'
  | 'expenseQuickAdd'
  | 'paySettlement';

export interface DrawerTypeMap {
  carrierCompanyInfo: { carrierId: string };
  carrierDispatchTerms: { carrierId: string };
  carrierNote: { carrierId: string };
  customerCompanyInfo: { customerId: string };
  vehicleInfo: { vehicleId: string };
  vehicleExpenses: { vehicleId: string };
  vehicleTargets: { vehicleId: string };
  driverInfo: { driverId: string };
  driverPreferences: { driverId: string };
  driverLocation: { driverId: string };
  driverWeeklySchedule: { driverId: string };
  driverScheduleOverride: { driverId: string };
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
  contactInfo: { contactId: string };
  documentUpload: {
    context: import('../../documents/constants').DocumentContext;
    entityType: import('../../documents/types').DocumentEntityType;
    entityId: string;
    preselectedDocType?: import('../../documents/types').DocumentType;
    lockDocType?: boolean;
  };
  disputeSettlement: { settlementId: string };
  addAdjustment: { settlementId: string };
  expenseQuickAdd: { onSuccess: () => void };
  paySettlement: { settlementId: string };
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export type ModalType =
  | 'dirtyFormConfirm'
  | 'createLoadModal'
  | 'inviteMember'
  | 'generateSettlement'
  | 'carrierNote'
  | 'confirmDeleteInvoice'
  | 'sendInvoice'
  | 'markInvoicePaid';

export interface ModalTypeMap {
  dirtyFormConfirm: { onConfirm: () => void; onCancel: () => void };
  createLoadModal: {
    onSelect: (loadType: string, template?: import('../../load/types').LoadTemplate) => void;
    onCancel?: () => void;
  };
  inviteMember: { organizationId: string };
  generateSettlement: Record<string, never>;
  carrierNote: { carrierId: string };
  confirmDeleteInvoice: { invoiceId: string };
  sendInvoice: { invoiceId: string };
  markInvoicePaid: { invoiceId: string; balanceDue: number };
}
