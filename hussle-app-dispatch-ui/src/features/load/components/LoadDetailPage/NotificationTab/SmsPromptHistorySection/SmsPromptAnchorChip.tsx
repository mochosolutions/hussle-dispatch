import { Chip } from '@mui/material';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';

type Anchor = SmsPromptScheduleResponse['anchor'];

type ChipColor = 'default' | 'primary' | 'info' | 'warning' | 'error' | 'success';

const COLOR_MAP: Record<Anchor, ChipColor> = {
  DISPATCHED: 'info',
  PRE_PICKUP: 'warning',
  POST_PICKUP: 'error',
  TRANSIT_INTERVAL: 'default',
  MANUAL: 'primary',
};

const LABEL_MAP: Record<Anchor, string> = {
  DISPATCHED: 'Dispatched',
  PRE_PICKUP: 'Pre-Pickup',
  POST_PICKUP: 'Post-Pickup',
  TRANSIT_INTERVAL: 'Transit Check-in',
  MANUAL: 'Manual',
};

interface SmsPromptAnchorChipProps {
  anchor: Anchor;
}

export const SmsPromptAnchorChip: React.FC<SmsPromptAnchorChipProps> = ({ anchor }) => (
  <Chip label={LABEL_MAP[anchor]} color={COLOR_MAP[anchor]} size="small" variant="outlined" />
);

export default SmsPromptAnchorChip;
