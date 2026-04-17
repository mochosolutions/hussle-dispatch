import type { PopupComponentMap } from '../../mocho/types/popup';
import { DirtyFormConfirmModal } from './components/DirtyFormConfirmModal';
import { ConfirmDeleteLoadDialog } from 'features/load/components/ConfirmDeleteLoadDialog';
import { CreateLoadModal } from 'features/load/components/CreateLoadModal';
import { StatusChangeDialog } from 'features/load/components/StatusChangeDialog';
import { InviteMemberDialog } from '../settings/components/InviteMemberDialog';
import { GenerateSettlementDialog } from '../accounting/components/GenerateSettlementDialog';
import { CarrierNoteDrawer } from '../carrier/components/CarrierNoteDrawer';
import { ConfirmDeleteInvoiceModal } from '../invoices/components/ConfirmDeleteInvoiceModal';
import { SendInvoiceModal } from '../invoices/components/SendInvoiceModal';
import { PaymentDrawer } from '../invoices/components/PaymentDrawer';

const modalRegistry: PopupComponentMap = {
  createLoadModal: CreateLoadModal,
  confirmDeleteLoadDialog: ConfirmDeleteLoadDialog,
  statusChangeDialog: StatusChangeDialog,
  dirtyFormConfirm: DirtyFormConfirmModal,
  inviteMember: InviteMemberDialog,
  generateSettlement: GenerateSettlementDialog,
  carrierNote: CarrierNoteDrawer,
  confirmDeleteInvoice: ConfirmDeleteInvoiceModal,
  sendInvoice: SendInvoiceModal,
  markInvoicePaid: PaymentDrawer,
};

export default modalRegistry;
