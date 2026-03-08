import type { FC } from 'react';

import type { ModalState, PopupComponentMap } from '../../types/popup';

interface ModalManagerProps {
  activeModal: ModalState | null;
  componentLookup: PopupComponentMap;
  onClose: () => void;
}

export const ModalManager: FC<ModalManagerProps> = ({ activeModal, componentLookup, onClose }) => {
  if (!activeModal) {
    return null;
  }

  const Component = componentLookup[activeModal.modalType];

  if (!Component) {
    return null;
  }

  return <Component onClose={onClose} {...activeModal.modalProps} />;
};
