import type { FC } from 'react';

import ConfirmDialog from 'mocho/components/ConfirmDialog';

interface PortalSaveExitConfirmModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export const PortalSaveExitConfirmModal: FC<PortalSaveExitConfirmModalProps> = ({
  onConfirm,
  onClose,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ConfirmDialog
      open
      title="All set for now"
      content="Your progress is saved. Come back any time using the same invitation link to pick up where you left off."
      confirmLabel="Got it"
      cancelLabel="Keep going"
      severity="info"
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
};

export default PortalSaveExitConfirmModal;
