import { Box, Stack } from '@mui/material';

import { Meta, MetaStrong } from 'components/Typography';
import { DELIVERY_SEQUENCE, STATUS_LABELS } from '../../loadStatus';

interface DeliveryProgressProps {
  status: string;
}

// Resolve a (possibly post-delivery) status to its index in the delivery
// sequence. Terminal statuses collapse to the final "Delivered" stage.
const resolveStageIndex = (status: string): number => {
  const index = DELIVERY_SEQUENCE.indexOf(status);
  if (index >= 0) {
    return index;
  }
  return DELIVERY_SEQUENCE.length - 1;
};

// Segmented progress strip mirroring the dispatcher status flow.
// Completed segments use success, the current segment uses primary, and
// upcoming segments stay muted.
export const DeliveryProgress: React.FC<DeliveryProgressProps> = ({ status }) => {
  const currentIndex = resolveStageIndex(status);
  const total = DELIVERY_SEQUENCE.length;

  const segmentColor = (index: number): string => {
    if (index < currentIndex) {
      return 'success.main';
    }
    if (index === currentIndex) {
      return 'primary.main';
    }
    return 'grey.300';
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <MetaStrong sx={{ color: 'text.primary' }}>{STATUS_LABELS[status] ?? status}</MetaStrong>
        <Meta>
          Stage {currentIndex + 1} of {total}
        </Meta>
      </Stack>
      <Stack direction="row" spacing={0.75}>
        {DELIVERY_SEQUENCE.map((stage, index) => (
          <Box
            key={stage}
            sx={{ flex: 1, height: 4, borderRadius: 999, bgcolor: segmentColor(index) }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default DeliveryProgress;
