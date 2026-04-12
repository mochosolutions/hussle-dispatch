import { Grid, Stack, Typography, Link, Box } from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormattedLoadSummary, SummaryStopInfo } from '../../types';
import { formatEquipmentType } from '../../constants';
import { StopColumn, ShipmentColumn } from './Columns';

interface LoadSummaryBarProps {
  summary: FormattedLoadSummary;
}

const ICON_SX = { fontSize: 14, color: 'text.secondary' } as const;

const PRIMARY_SX = { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 } as const;

const SECONDARY_SX = {
  fontSize: '0.75rem',
  lineHeight: 1.4,
  textTransform: 'uppercase',
} as const;

const COLUMN_LABEL_SX = {
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: '0.65rem',
  letterSpacing: 0.5,
} as const;

const VALUE_SX = {
  ...PRIMARY_SX,
  width: 120,
  flexShrink: 0,
};

const BOX_SX = {
  ...PRIMARY_SX,
  display: 'flex',
  gap: 1,
  mb: 1,
};

type DotInput = Record<string, boolean | string>;

const formatDotNodes = (input: DotInput): React.ReactNode[] => {
  const items = Object.entries(input)
    .map(([key, value]): string | null => {
      if (typeof value === 'boolean') {
        return value ? key : null;
      }
      const clean = value.trim();
      return clean ? clean : null;
    })
    .filter((item): item is string => Boolean(item));

  // intersperse with your separator component
  const separator = (
    <Box component="span" sx={{ px: 0.5 }}>
      &middot;
    </Box>
  );
  return items.flatMap((item, index) => (index === 0 ? [item] : [separator, item]));
};

export const LoadSummaryBar: React.FC<LoadSummaryBarProps> = ({ summary }) => {
  // console.log('Summary', { summary });

  const referenceDetails = [
    { label: 'Ref#', value: 'N/A' },
    { label: 'Driver', value: summary.driver.name, link: '/drivers' },
    { label: 'Equipment', value: summary.driver.vehicle },
    { label: 'Carrier', value: summary.driver.carrier, link: '/carrier' },
  ];
  const summaryTags = formatDotNodes({
    // active: true,
    hazmat: summary.load.isHazmat ? 'Hazmat' : '',
    tarp: summary.load.isTarp ? 'Tarp' : '',
    weight: summary.load.weight ? `${summary.load.weight}lbs` : '',
  });

  return (
    <Grid container spacing={2}>
      <Grid item sm={6} md={3}>
        <StopColumn
          icon={<WarehouseOutlinedIcon sx={ICON_SX} />}
          label="Ship From"
          stop={summary.pickup}
        />
      </Grid>

      <Grid item sm={6} md={3}>
        <StopColumn
          icon={<PlaceOutlinedIcon sx={ICON_SX} />}
          label="Ship To"
          stop={summary.delivery}
        />
      </Grid>

      <Grid item sm={6} md={3}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
          <InventoryOutlinedIcon sx={ICON_SX} />
          <Typography variant="body1" color="text.secondary" sx={COLUMN_LABEL_SX}>
            Shipment Details
          </Typography>
        </Stack>

        <Box sx={BOX_SX}>
          <Typography sx={VALUE_SX} color="text.secondary">
            Total Miles:
          </Typography>

          <Typography sx={PRIMARY_SX}>
            {summary.load.miles ? `${summary.load.miles} miles` : '-'}
          </Typography>
        </Box>

        <Box sx={BOX_SX}>
          <Typography sx={VALUE_SX} color="text.secondary">
            Commodity:
          </Typography>
          <Typography sx={PRIMARY_SX}>{summary.load.cargo || '-'}</Typography>
        </Box>

        <Box sx={BOX_SX}>
          <Typography sx={VALUE_SX} color="text.secondary">
            Commodity Details:
          </Typography>

          <Typography sx={PRIMARY_SX}>{summaryTags}</Typography>
        </Box>
      </Grid>

      <Grid item sm={6} md={3}>
        <ShipmentColumn
          Icon={<PersonOutlinedIcon sx={ICON_SX} />}
          columnLabel="References"
          values={referenceDetails}
        />
      </Grid>
    </Grid>
  );
};
