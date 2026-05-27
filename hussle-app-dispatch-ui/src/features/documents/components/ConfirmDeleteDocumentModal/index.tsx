import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';

import { useDispatch } from 'store';
import { Body, BodyMuted, BodyStrong, ModalTitle } from 'components/Typography';

import { DOC_TYPE_CONFIG } from '../../constants';
import { archiveDocumentRequest } from '../../store/reducers/documentPageSlice';
import type { DocumentType } from '../../types';

export interface ConfirmDeleteDocumentModalProps {
  documentId: string;
  fileName: string;
  type: DocumentType;
  onClose: () => void;
}

export const ConfirmDeleteDocumentModal: React.FC<ConfirmDeleteDocumentModalProps> = ({
  documentId,
  fileName,
  type,
  onClose,
}) => {
  const dispatch = useDispatch();

  const typeLabel = DOC_TYPE_CONFIG[type]?.label ?? 'Document';

  const handleConfirm = () => {
    dispatch(archiveDocumentRequest({ documentId }));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <ModalTitle>Delete Document</ModalTitle>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Body>Are you sure you want to delete:</Body>
          <Stack spacing={0.25}>
            <BodyStrong>{typeLabel}</BodyStrong>
            <BodyMuted>{fileName}</BodyMuted>
          </Stack>
          <BodyMuted>
            The document will be archived and hidden from the list. An admin can recover it from
            the audit log.
          </BodyMuted>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDocumentModal;
