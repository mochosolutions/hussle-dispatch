import { useCallback } from 'react';
import { Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { useDispatch } from 'store';
import { SplitButton, type SplitButtonItem } from 'components/SplitButton';
import { openModal } from 'features/ui/store/reducers/uiSlice';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { getDriverPortalLink } from 'utils/api/driver-portal/driverPortalDispatcherApi';
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

const STATUS_BUTTON_ALTS: readonly LoadStatus[] = ['EXCEPTION', 'TONU'];

export const LoadDetailActions = ({
  load,
  onCreateInvoice,
  onCheckCall,
}: LoadDetailActionsProps) => {
  const dispatch = useDispatch();
  const { openModal: openModalAction } = useModalActions();

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

  const handleCopyPortalLink = useCallback(async () => {
    try {
      const url = await getDriverPortalLink(load.id);
      await navigator.clipboard.writeText(url);
      dispatch(notify({ message: 'Portal link copied', variant: 'success' }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to copy driver portal link';
      dispatch(notify({ message, variant: 'error' }));
    }
  }, [load.id, dispatch]);

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

  const handleSendSms = useCallback(
    () => openModalAction('loadSendSmsPrompt', { loadId: load.id }),
    [openModalAction, load.id],
  );

  const canCheckCall = CHECK_CALL_STATUSES.includes(load.status);
  const canSendSms = SMS_PROMPT_STATUSES.includes(load.status);
  const canCopyPortalLink = SMS_PROMPT_STATUSES.includes(load.status);
  const driverPhone = load.assignment?.driver?.phone ?? null;
  const invoiceReadiness = load.tracking?.invoiceReadiness;
  const invoiceReady = invoiceReadiness === 'READY' || invoiceReadiness === 'INVOICE_CREATED';
  const createInvoiceDisabledReason = invoiceReady
    ? ''
    : 'Required documents (Rate Con, signed BOL, POD) must be confirmed before creating the invoice.';

  const statusButtonAltItems: SplitButtonItem[] = altStatuses
    .filter((status) => STATUS_BUTTON_ALTS.includes(status))
    .map((status) => ({
      key: `status-${status}`,
      label: STATUS_LABELS[status],
      onClick: () => openStatusChangeDialog(status),
    }));

  const altStatusItems: SplitButtonItem[] = altStatuses
    .filter((status) => !STATUS_BUTTON_ALTS.includes(status))
    .map((status) => ({
      key: `status-${status}`,
      label: STATUS_LABELS[status],
      onClick: () => openStatusChangeDialog(status),
    }));

  const commItems: SplitButtonItem[] = [];
  if (canCheckCall) {
    commItems.push({
      key: 'check-call',
      label: 'Check Call',
      icon: <PhoneInTalkIcon fontSize="small" />,
      onClick: onCheckCall,
    });
  }
  if (canSendSms) {
    commItems.push({
      key: 'send-sms',
      label: 'Send Check-in SMS',
      icon: <SmsOutlinedIcon fontSize="small" />,
      onClick: handleSendSms,
      disabled: driverPhone === null,
      disabledReason: 'Driver has no phone number',
    });
  }
  if (load.status === 'DELIVERED') {
    commItems.push({
      key: 'create-invoice',
      label: 'Create Invoice',
      icon: <ReceiptLongIcon fontSize="small" />,
      onClick: onCreateInvoice,
      disabled: !invoiceReady,
      disabledReason: createInvoiceDisabledReason,
    });
  }

  const utilityItems: SplitButtonItem[] = [];
  if (canCopyPortalLink) {
    utilityItems.push({
      key: 'copy-portal',
      label: 'Copy Driver Portal Link',
      icon: <ContentCopyIcon fontSize="small" />,
      onClick: handleCopyPortalLink,
    });
  }

  const destructiveItems: SplitButtonItem[] = [
    {
      key: 'delete',
      label: 'Delete Load',
      icon: <DeleteOutlineIcon fontSize="small" />,
      onClick: handleDeleteClick,
      danger: true,
    },
  ];

  const groups = [altStatusItems, commItems, utilityItems, destructiveItems].filter(
    (group) => group.length > 0,
  );

  const items: SplitButtonItem[] = groups.flatMap((group, groupIdx) => {
    const isLastGroup = groupIdx === groups.length - 1;
    if (isLastGroup) {
      return group;
    }
    return group.map((item, idx) =>
      idx === group.length - 1 ? { ...item, dividerAfter: true } : item,
    );
  });

  const primaryStatusLabel = nextStatus
    ? (NEXT_STATUS_LABELS[load.status] ?? STATUS_LABELS[nextStatus])
    : '';

  const renderStatusButton = () => {
    if (!nextStatus) {
      return null;
    }
    if (statusButtonAltItems.length === 0) {
      return (
        <Button variant="contained" onClick={handlePrimaryAction}>
          {primaryStatusLabel}
        </Button>
      );
    }
    return (
      <SplitButton
        variant="action"
        ariaLabel="status change"
        primary={{
          key: 'next-status',
          label: primaryStatusLabel,
          onClick: handlePrimaryAction,
        }}
        items={statusButtonAltItems}
      />
    );
  };

  return (
    <>
      {renderStatusButton()}
      <SplitButton
        variant="menu"
        triggerLabel="Actions"
        ariaLabel="load actions"
        items={items}
      />
    </>
  );
};
