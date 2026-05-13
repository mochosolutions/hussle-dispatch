import { Avatar, Box, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Person as PersonIcon } from '@mui/icons-material';

import { MetaStrong, Timestamp } from 'components/Typography';
import { PayType } from 'features/carrier-portal/types';
import type { DriverEntry } from 'features/carrier-portal/types';

interface DriverSummaryCardProps {
  driver: DriverEntry;
  onEdit: () => void;
  onRemove: () => void;
}

const PAY_TYPE_LABEL: Record<PayType, string> = {
  [PayType.PERCENTAGE]: '%',
  [PayType.PER_MILE]: '/ mi',
  [PayType.FLAT_RATE]: '/ load',
};

const formatPay = (driver: DriverEntry): string | null => {
  if (driver.payRate == null || !driver.payType) {
    return null;
  }
  if (driver.payType === PayType.PERCENTAGE) {
    return `${driver.payRate}${PAY_TYPE_LABEL[driver.payType]}`;
  }
  return `$${driver.payRate.toLocaleString()}${PAY_TYPE_LABEL[driver.payType]}`;
};

const DriverSummaryCard: React.FC<DriverSummaryCardProps> = ({ driver, onEdit, onRemove }) => {
  const fullName = `${driver.firstName} ${driver.lastName}`.trim();
  const pay = formatPay(driver);
  const details = [driver.phone, driver.email, pay].filter(Boolean);

  return (
    <Box
      onClick={onEdit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        px: 2,
        bgcolor: 'grey.100',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'grey.50' },
        '&:hover .summary-actions': { opacity: 1 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.200', borderRadius: 1 }}>
          <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Avatar>
        <Box>
          <MetaStrong sx={{ color: 'text.primary' }}>{fullName}</MetaStrong>
          {details.length > 0 ? <Timestamp>{details.join(' · ')}</Timestamp> : null}
        </Box>
      </Box>
      <Stack
        direction="row"
        spacing={0.5}
        className="summary-actions"
        sx={{ opacity: 0, transition: 'opacity 0.15s' }}
      >
        <IconButton
          size="small"
          aria-label="Edit driver"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Remove driver"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          sx={{ color: 'error.main' }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default DriverSummaryCard;
