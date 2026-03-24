import type { PopupComponentMap } from '../../mocho/types/popup';
import { CreateLoadModal } from '../load/components/CreateLoadModal';
import { DirtyFormConfirmModal } from './components/DirtyFormConfirmModal';

const modalRegistry: PopupComponentMap = {
  createLoadModal: CreateLoadModal,
  dirtyFormConfirm: DirtyFormConfirmModal,
};

export default modalRegistry;
