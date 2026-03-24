import type { FC } from 'react';

import ConfirmDialog from '../../../../mocho/components/ConfirmDialog';

interface DirtyFormConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export const DirtyFormConfirmModal: FC<DirtyFormConfirmModalProps> = ({
  onConfirm,
  onCancel,
  onClose,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <ConfirmDialog
      open
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      confirmLabel="Leave"
      cancelLabel="Stay"
      severity="warning"
      onConfirm={handleConfirm}
      onClose={handleCancel}
    />
  );
};
