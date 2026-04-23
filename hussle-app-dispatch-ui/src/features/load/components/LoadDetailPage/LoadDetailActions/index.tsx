import { useState, useCallback } from 'react';
import { Box, Button, Divider, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { useDispatch } from 'store';
import { openModal } from 'features/ui/store/reducers/uiSlice';
import { useModalActions } from 'features/ui/hooks/useModalActions';
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
  onCheckCall: () => void;
}

const CHECK_CALL_STATUSES: readonly LoadStatus[] = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
];

const SMS_PROMPT_STATUSES: readonly LoadStatus[] = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
];

export const LoadDetailActions = ({
  load,
  onCreateInvoice,
  onCheckCall,
}: LoadDetailActionsProps) => {
  const dispatch = useDispatch();
  const { openModal: openModalAction } = useModalActions();
  const [alternativesAnchor, setAlternativesAnchor] = useState<null | HTMLElement>(null);

  const nextStatus = NEXT_STATUS[load.status];
  const altStatuses = ALTERNATIVE_STATUSES[load.status] ?? [];

  const openStatusChangeDialog = useCallback(
    (targetStatus: LoadStatus) => {
      dispatch(
        openModal({
          modalType: 'statusChangeDialog',
          modalProps: { load, targetStatus },
        }),
      );
    },
    [dispatch, load],
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

  const canCheckCall = CHECK_CALL_STATUSES.includes(load.status);
  const canSendSms = SMS_PROMPT_STATUSES.includes(load.status);
  const driverPhone = load.assignment?.driver?.phone ?? null;
  const handleSendSms = () => openModalAction('loadSendSmsPrompt', { loadId: load.id });
  const invoiceReadiness = load.tracking?.invoiceReadiness;
  const invoiceReady = invoiceReadiness === 'READY' || invoiceReadiness === 'INVOICE_CREATED';
  const sendInvoiceDisabledReason = invoiceReady
    ? ''
    : 'Required documents (Rate Con, signed BOL, POD) must be confirmed before sending.';

  return (
    <>
      {canCheckCall && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PhoneInTalkIcon />}
          onClick={onCheckCall}
        >
          Check Call
        </Button>
      )}
      {canSendSms && (
        <Tooltip title={driverPhone === null ? 'Driver has no phone number' : ''} placement="top">
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SmsOutlinedIcon />}
              onClick={handleSendSms}
              disabled={driverPhone === null}
            >
              Send Check-in SMS
            </Button>
          </Box>
        </Tooltip>
      )}
      {load.status === 'DELIVERED' && (
        <Tooltip title={sendInvoiceDisabledReason} placement="top">
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptLongIcon />}
              onClick={onCreateInvoice}
              disabled={!invoiceReady}
            >
              Send Invoice
            </Button>
          </Box>
        </Tooltip>
      )}
      {nextStatus && (
        <Button variant="contained" onClick={handlePrimaryAction}>
          {NEXT_STATUS_LABELS[load.status] ?? STATUS_LABELS[nextStatus]}
        </Button>
      )}
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
        {altStatuses.length > 0 && <Divider />}
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Delete Load
        </MenuItem>
      </Menu>
    </>
  );
};
