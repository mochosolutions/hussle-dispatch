import type { PopupComponentMap } from '../../mocho/types/popup';
import { DirtyFormConfirmModal } from './components/DirtyFormConfirmModal';
import { ConfirmDeleteLoadDialog } from 'features/load/components/ConfirmDeleteLoadDialog';
// import { CreateLoadModal } from 'features/load/components/CreateLoadModal';
import { SendSmsPromptModal } from 'features/load/components/SendSmsPromptModal';
import { StatusChangeDialog } from 'features/load/components/StatusChangeDialog';
import { InviteMemberDialog } from '../settings/components/InviteMemberDialog';
import { GenerateSettlementDialog } from '../accounting/components/GenerateSettlementDialog';
import { MissingEstimatedHoursDialog } from '../accounting/components/MissingEstimatedHoursDialog';
import { CarrierNoteDrawer } from '../carrier/components/CarrierNoteDrawer';
import { ConfirmDeleteInvoiceModal } from '../invoices/components/ConfirmDeleteInvoiceModal';
import { SendInvoiceModal } from '../invoices/components/SendInvoiceModal';
import { PaymentDrawer } from '../invoices/components/PaymentDrawer';
import { DispatchOverrideModal } from '../carrier/components/DispatchOverrideModal';
import { AdminActivateModal } from '../carrier/components/AdminActivateModal';
import { ActivateCarrierModal } from '../carrier/components/ActivateCarrierModal';
import { ConfirmDeleteDocumentModal } from '../documents/components/ConfirmDeleteDocumentModal';
import { PortalSaveExitConfirmModal } from '../carrier-portal/components/PortalSaveExitConfirmModal';
import UpgradePlanDialog from 'components/UpgradePlanDialog';

const modalRegistry: PopupComponentMap = {
  confirmDeleteLoadDialog: ConfirmDeleteLoadDialog,
  statusChangeDialog: StatusChangeDialog,
  dirtyFormConfirm: DirtyFormConfirmModal,
  inviteMember: InviteMemberDialog,
  generateSettlement: GenerateSettlementDialog,
  missingEstimatedHours: MissingEstimatedHoursDialog,
  carrierNote: CarrierNoteDrawer,
  confirmDeleteInvoice: ConfirmDeleteInvoiceModal,
  sendInvoice: SendInvoiceModal,
  markInvoicePaid: PaymentDrawer,
  loadSendSmsPrompt: SendSmsPromptModal,
  dispatchOverride: DispatchOverrideModal,
  adminActivateCarrier: AdminActivateModal,
  activateCarrier: ActivateCarrierModal,
  confirmDeleteDocument: ConfirmDeleteDocumentModal,
  upgradePlan: UpgradePlanDialog,
  portalSaveExitConfirm: PortalSaveExitConfirmModal,
};

export default modalRegistry;
