import type { PopupComponentMap } from '../../mocho/types/popup';
import { DirtyFormConfirmModal } from './components/DirtyFormConfirmModal';
import { ConfirmDeleteLoadDialog } from 'features/load/components/ConfirmDeleteLoadDialog';
import { CreateLoadModal } from 'features/load/components/CreateLoadModal';
import { StatusChangeDialog } from 'features/load/components/StatusChangeDialog';

const modalRegistry: PopupComponentMap = {
  createLoadModal: CreateLoadModal,
  confirmDeleteLoadDialog: ConfirmDeleteLoadDialog,
  statusChangeDialog: StatusChangeDialog,
  dirtyFormConfirm: DirtyFormConfirmModal,
};

export default modalRegistry;
