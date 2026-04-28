import { Chip } from '@mui/material';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { differenceInCalendarDays } from 'date-fns';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ExpiryBadgeProps {
  expiresAt: Date | string | null | undefined;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIBLE_THRESHOLD_DAYS = 30;
const ERROR_THRESHOLD_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildLabel = (daysRemaining: number): string => {
  if (daysRemaining < 0) {
    return 'Expired';
  }
  if (daysRemaining === 0) {
    return 'Expires today';
  }
  if (daysRemaining === 1) {
    return 'Expires in 1 day';
  }
  return `Expires in ${daysRemaining} days`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiresAt }) => {
  if (expiresAt === null || expiresAt === undefined) {
    return null;
  }

  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const daysRemaining = differenceInCalendarDays(expiryDate, new Date());

  if (daysRemaining > VISIBLE_THRESHOLD_DAYS) {
    return null;
  }

  const color: 'error' | 'warning' = daysRemaining <= ERROR_THRESHOLD_DAYS ? 'error' : 'warning';
  const label = buildLabel(daysRemaining);
  const icon =
    color === 'error' ? (
      <ExclamationCircleOutlined aria-hidden="true" />
    ) : (
      <WarningOutlined aria-hidden="true" />
    );

  return (
    <Chip
      size="small"
      variant="filled"
      color={color}
      icon={icon}
      label={label}
      aria-label={label}
    />
  );
};
