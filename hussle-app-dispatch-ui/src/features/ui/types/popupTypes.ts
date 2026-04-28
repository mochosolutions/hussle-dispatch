/**
 * App-specific popup type maps for the global drawer/modal manager system.
 *
 * These types constrain the drawerType/modalType strings and enforce
 * the correct props shape for each popup via DrawerTypeMap/ModalTypeMap.
 *
 * Generic popup interfaces live in mocho/types/popup.ts.
 */

import type { DocumentContext } from '../../documents/constants';
import type { DocumentEntityType, DocumentType } from '../../documents/types';
import type { LoadDetail, LoadStatus, LoadTemplate } from '../../load/types';

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
  | 'documentDetail'
  | 'disputeSettlement'
  | 'addAdjustment'
  | 'expenseQuickAdd'
  | 'paySettlement'
  | 'loadAccessorial'
  | 'loadCheckCall';

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
    context: DocumentContext;
    entityType: DocumentEntityType;
    entityId: string;
    preselectedDocType?: DocumentType;
    lockDocType?: boolean;
  };
  documentDetail: { documentId: string };
  disputeSettlement: { settlementId: string };
  addAdjustment: { settlementId: string };
  expenseQuickAdd: { onSuccess: () => void };
  paySettlement: { settlementId: string };
  loadAccessorial: { loadId: string; accessorialId?: string };
  loadCheckCall: { loadId: string };
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export type ModalType =
  | 'dirtyFormConfirm'
  | 'createLoadModal'
  | 'statusChangeDialog'
  | 'confirmDeleteLoadDialog'
  | 'inviteMember'
  | 'generateSettlement'
  | 'carrierNote'
  | 'confirmDeleteInvoice'
  | 'sendInvoice'
  | 'markInvoicePaid'
  | 'loadSendSmsPrompt'
  | 'dispatchOverride'
  | 'confirmDeleteDocument';

export interface ModalTypeMap {
  dirtyFormConfirm: { onConfirm: () => void; onCancel: () => void };
  createLoadModal: {
    onSelect: (loadType: string, template?: LoadTemplate) => void;
    onCancel?: () => void;
  };
  statusChangeDialog: {
    load: LoadDetail;
    targetStatus: LoadStatus;
  };
  confirmDeleteLoadDialog: {
    open: boolean;
    loadId: string;
    loadNumber: string;
  };
  inviteMember: { organizationId: string };
  generateSettlement: Record<string, never>;
  carrierNote: { carrierId: string };
  confirmDeleteInvoice: { invoiceId: string };
  sendInvoice: { invoiceId: string };
  markInvoicePaid: { invoiceId: string; balanceDue: number };
  loadSendSmsPrompt: { loadId: string };
  dispatchOverride: {
    carrierId: string;
    carrierName: string;
    loadId: string;
    missingDocuments: string[];
  };
  confirmDeleteDocument: { documentId: string; fileName: string; type: DocumentType };
}
