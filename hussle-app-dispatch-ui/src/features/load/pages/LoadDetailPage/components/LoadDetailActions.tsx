import { useState, useCallback } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useDispatch } from 'store';
import { openModal } from 'features/ui/store/reducers/uiSlice';
import {
  STATUS_LABELS,
  NEXT_STATUS,
  NEXT_STATUS_LABELS,
  ALTERNATIVE_STATUSES,
} from '../../../constants';
import type { LoadDetail, LoadStatus } from '../../../types';

interface LoadDetailActionsProps {
  load: LoadDetail;
  onCreateInvoice: () => void;
}

export const LoadDetailActions = ({ load, onCreateInvoice }: LoadDetailActionsProps) => {
  const dispatch = useDispatch();
  const [alternativesAnchor, setAlternativesAnchor] = useState<null | HTMLElement>(null);

  const nextStatus = NEXT_STATUS[load.status];
  const altStatuses = ALTERNATIVE_STATUSES[load.status] ?? [];

  const openStatusChangeDialog = useCallback(
    (targetStatus: LoadStatus) => {
      dispatch(
        openModal({
          modalType: 'statusChangeDialog',
          modalProps: { loadId: load.id, targetStatus },
        }),
      );
    },
    [dispatch, load.id],
  );

  const handlePrimaryAction = useCallback(() => {
    if (nextStatus) {
      openStatusChangeDialog(nextStatus);
    }
  }, [nextStatus, openStatusChangeDialog]);

  const handleAlternativeClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAlternativesAnchor(event.currentTarget);
  }, []);

  const handleAlternativeSelect = useCallback(
    (status: LoadStatus) => {
      setAlternativesAnchor(null);
      openStatusChangeDialog(status);
    },
    [openStatusChangeDialog],
  );

  const handleCloseMenu = useCallback(() => {
    setAlternativesAnchor(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    dispatch(
      openModal({
        modalType: 'confirmDeleteLoadDialog',
        modalProps: {
          open: true,
          loadId: load.id,
          loadNumber: load.loadNumber,
        },
      }),
    );
  }, [dispatch, load.id, load.loadNumber]);

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={handleDeleteClick}
      >
        Delete
      </Button>
      {load.status === 'DELIVERED' && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ReceiptLongIcon />}
          onClick={onCreateInvoice}
        >
          Create Invoice
        </Button>
      )}
      {nextStatus && (
        <Button variant="contained" onClick={handlePrimaryAction}>
          {NEXT_STATUS_LABELS[load.status] ?? STATUS_LABELS[nextStatus]}
        </Button>
      )}
      {altStatuses.length > 0 && (
        <>
          <Button
            variant="contained"
            size="small"
            onClick={handleAlternativeClick}
            endIcon={<ArrowDropDownIcon />}
          >
            More
          </Button>
          <Menu
            anchorEl={alternativesAnchor}
            open={Boolean(alternativesAnchor)}
            onClose={handleCloseMenu}
          >
            {altStatuses.map((status) => (
              <MenuItem key={status} onClick={() => handleAlternativeSelect(status)}>
                {STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </>
  );
};
