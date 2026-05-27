import { Button, Tooltip } from '@mui/material';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import type { CarrierStatus, DispatchableStatus } from '../../types';

interface ActivateCarrierButtonProps {
  carrierId: string;
  carrierName: string;
  status: CarrierStatus;
  dispatchableStatus: DispatchableStatus;
}

const HIDDEN_STATUSES: ReadonlySet<CarrierStatus> = new Set([
  'ACTIVE',
  'ACTION_REQUIRED',
  'SUSPENDED',
]);

export const ActivateCarrierButton: React.FC<ActivateCarrierButtonProps> = ({
  carrierId,
  carrierName,
  status,
  dispatchableStatus,
}) => {
  const { openModal } = useModalActions();

  if (HIDDEN_STATUSES.has(status)) {
    return null;
  }

  const ready = dispatchableStatus.ready;
  const tooltip = ready
    ? 'All requirements met — ready to activate'
    : `Missing: ${dispatchableStatus.missing.join(', ')}`;

  const button = (
    <Button
      variant="contained"
      color="success"
      startIcon={<CheckCircleOutlineOutlined />}
      disabled={!ready}
      onClick={() => openModal('activateCarrier', { carrierId, carrierName })}
    >
      Activate Carrier
    </Button>
  );

  return (
    <Tooltip title={tooltip} arrow>
      <span>{button}</span>
    </Tooltip>
  );
};
