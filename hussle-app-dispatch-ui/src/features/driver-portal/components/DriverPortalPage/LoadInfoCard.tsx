import { Box, Card, CardContent, Stack } from '@mui/material';

import { Body, BodyMuted, MetaStrong } from 'components/Typography';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';

interface LoadInfoCardProps {
  load: DriverPortalLoad;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack
    direction="row"
    alignItems="baseline"
    justifyContent="space-between"
    spacing={2}
    sx={{ py: 1, borderBottom: '1px dashed', borderColor: 'grey.200', '&:last-of-type': { borderBottom: 'none' } }}
  >
    <BodyMuted sx={{ flexShrink: 0 }}>{label}</BodyMuted>
    <Body sx={{ fontWeight: 600, textAlign: 'right' }}>{value}</Body>
  </Stack>
);

// Load summary using only the fields the driver-portal payload exposes.
export const LoadInfoCard: React.FC<LoadInfoCardProps> = ({ load }) => {
  const rows: { label: string; value: string }[] = [];

  if (load.equipmentType) {
    rows.push({ label: 'Equipment', value: load.equipmentType.replace(/_/g, ' ') });
  }
  if (load.commodity) {
    rows.push({ label: 'Commodity', value: load.commodity });
  }
  if (load.weight) {
    rows.push({ label: 'Total weight', value: `${load.weight.toLocaleString()} lb` });
  }
  if (load.pieceCount) {
    rows.push({ label: 'Pieces', value: load.pieceCount.toLocaleString() });
  }
  if (load.isTempControlled) {
    rows.push({ label: 'Temperature', value: 'Temp-controlled' });
  }
  if (load.isHazmat) {
    rows.push({ label: 'Hazmat', value: 'Yes' });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <MetaStrong sx={{ color: 'text.primary', mb: 1, display: 'block' }}>Load info</MetaStrong>
        <Box>
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoadInfoCard;
