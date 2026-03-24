import { useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SectionCard from 'components/SectionCard';
import { DetailRow, SectionTitle } from 'components/Typography';

const CardSection = () => {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <Stack spacing={4}>
      {/* SectionCard with header + edit button + DetailRows */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          SectionCard with DetailRows
        </Typography>
        <SectionCard
          title={<SectionTitle>Route Information</SectionTitle>}
          actions={
            <IconButton
              size="small"
              onClick={() => setShowEdit(!showEdit)}
              aria-label="Edit route"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          }
        >
          <DetailRow label="Origin" value="Newark, NJ 07102" />
          <DetailRow label="Destination" value="Dallas, TX 75207" />
          <DetailRow label="Distance" value="1,547 mi" />
          <DetailRow label="Rate per mile" value="$2.75" valueColor="primary.main" />
          <DetailRow label="Total" value="$4,254.25" valueColor="secondary.main" />
          <DetailRow label="Notes" value="None" noBorder />
        </SectionCard>
      </Box>

      {/* DetailRow variants */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          DetailRow Variants
        </Typography>
        <SectionCard title={<SectionTitle>Row Variants</SectionTitle>}>
          <DetailRow label="Default row" value="Standard styling" />
          <DetailRow label="With valueColor" value="$4,250.00" valueColor="secondary.main" />
          <DetailRow label="Error color" value="Overdue" valueColor="error.main" />
          <DetailRow
            label="Warning highlight"
            value="Expiring Soon"
            sx={{ bgcolor: 'warning.lighter' }}
          />
          <DetailRow
            label="Error highlight"
            value="Expired"
            valueColor="error.main"
            sx={{ bgcolor: 'error.lighter' }}
          />
          <DetailRow label="No border row" value="Last item" noBorder />
        </SectionCard>
      </Box>
    </Stack>
  );
};

export default CardSection;
