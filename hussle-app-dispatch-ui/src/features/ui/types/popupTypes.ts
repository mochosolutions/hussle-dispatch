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
import type { MissingEstimatedHoursLoad } from '../../accounting/store/reducers/settlementPageSlice';

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
  | 'loadCheckCall'
  | 'loadDispatchTerms'
  | 'uploadAgreement';

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
  vehicleCreate: { onClose: () => void; initialCarrierId?: string };
  driverCreate: { onClose: () => void; initialCarrierId?: string };
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
  expenseQuickAdd: Record<string, never>;
  paySettlement: { settlementId: string };
  loadAccessorial: { loadId: string; accessorialId?: string };
  loadCheckCall: { loadId: string };
  loadDispatchTerms: { loadId: string };
  uploadAgreement: { carrierId: string };
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export type ModalType =
  | 'dirtyFormConfirm'
  | 'statusChangeDialog'
  | 'confirmDeleteLoadDialog'
  | 'inviteMember'
  | 'generateSettlement'
  | 'missingEstimatedHours'
  | 'carrierNote'
  | 'confirmDeleteInvoice'
  | 'sendInvoice'
  | 'markInvoicePaid'
  | 'loadSendSmsPrompt'
  | 'dispatchOverride'
  | 'adminActivateCarrier'
  | 'activateCarrier'
  | 'confirmDeleteDocument'
  | 'upgradePlan'
  | 'voidAgreement';

export interface ModalTypeMap {
  dirtyFormConfirm: { onConfirm: () => void; onCancel: () => void };
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
  missingEstimatedHours: {
    loadIds: string[];
    loads: MissingEstimatedHoursLoad[];
    message: string;
  };
  carrierNote: { carrierId: string };
  confirmDeleteInvoice: { invoiceId: string };
  sendInvoice: { invoiceId: string; recipientContactId?: string };
  markInvoicePaid: { invoiceId: string; balanceDue: number };
  loadSendSmsPrompt: { loadId: string };
  dispatchOverride: {
    carrierId: string;
    carrierName: string;
    loadId: string;
    missingDocuments: string[];
  };
  adminActivateCarrier: { carrierId: string; carrierName: string };
  activateCarrier: { carrierId: string; carrierName: string };
  confirmDeleteDocument: { documentId: string; fileName: string; type: DocumentType };
  upgradePlan: {
    resourceType: 'team members' | 'vehicles';
    limit: number;
  };
  voidAgreement: { agreementId: string; templateLabel: string };
}
