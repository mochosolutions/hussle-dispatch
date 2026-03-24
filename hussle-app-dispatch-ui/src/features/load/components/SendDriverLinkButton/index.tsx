import { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSnackbar } from 'notistack';
import axiosInstance from 'utils/axios';

interface SendDriverLinkButtonProps {
  loadId: string;
  loadStatus: string;
  hasDriver: boolean;
  hasDriverPhone: boolean;
}

const DISPATCHED_OR_LATER = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
];

export const SendDriverLinkButton: React.FC<SendDriverLinkButtonProps> = ({
  loadId,
  loadStatus,
  hasDriver,
  hasDriverPhone,
}) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  if (!DISPATCHED_OR_LATER.includes(loadStatus) || !hasDriver) {
    return null;
  }

  const handleSend = async () => {
    setSending(true);
    try {
      await axiosInstance.post(`/driver-portal/loads/${loadId}/send-driver-link`);
      setSent(true);
      enqueueSnackbar('Driver portal link sent successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to send driver link', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const buttonLabel = sent ? 'Resend Link' : 'Send to Driver';
  const disabled = sending || !hasDriverPhone;
  const tooltipTitle = !hasDriverPhone ? 'Driver has no phone number on file' : '';

  return (
    <Tooltip title={tooltipTitle}>
      <span>
        <Button
          variant="outlined"
          size="small"
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={handleSend}
          disabled={disabled}
        >
          {buttonLabel}
        </Button>
      </span>
    </Tooltip>
  );
};
