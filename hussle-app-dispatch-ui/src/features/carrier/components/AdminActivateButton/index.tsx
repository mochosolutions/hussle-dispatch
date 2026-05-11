import { Button } from '@mui/material';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import { useSelector } from 'store';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { selectUserRole } from '../../store/selectors/carrierSelectors';
import type { CarrierStatus } from '../../types';

interface AdminActivateButtonProps {
  carrierId: string;
  carrierName: string;
  status: CarrierStatus;
}

const HIDDEN_STATUSES: ReadonlySet<CarrierStatus> = new Set(['ACTIVE']);

export const AdminActivateButton: React.FC<AdminActivateButtonProps> = ({
  carrierId,
  carrierName,
  status,
}) => {
  const role = useSelector(selectUserRole);
  const { openModal } = useModalActions();

  if (role !== 'admin') {
    return null;
  }
  if (HIDDEN_STATUSES.has(status)) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      color="warning"
      startIcon={<VerifiedUserOutlined />}
      onClick={() => openModal('adminActivateCarrier', { carrierId, carrierName })}
      sx={{ color: 'common.white', borderColor: 'warning.light' }}
    >
      Admin Activate
    </Button>
  );
};
