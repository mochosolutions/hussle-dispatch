import { Grid, Stack, Box } from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { KpiLabel, BodyStrong, BodyMuted } from 'components/Typography';
import type { FormattedLoadSummary } from '../../../types';
import { StopColumn, ShipmentColumn } from './Columns';

interface LoadSummaryBarProps {
  summary: FormattedLoadSummary;
}

const ICON_SX = { fontSize: 14, color: 'text.secondary' } as const;

const LABEL_SX = { minWidth: 70, flexShrink: 0 } as const;

const BOX_SX = {
  display: 'flex',
  gap: 1,
  mb: 1,
} as const;

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
  const referenceDetails = [
    { label: 'Ref#', value: summary.load.externalRefNumber ?? 'N/A' },
    {
      label: 'Driver',
      value: summary.driver.name,
      link: summary.driver.driverId ? `/drivers/${summary.driver.driverId}` : undefined,
    },
    {
      label: 'Carrier',
      value: summary.driver.carrier,
      link: summary.driver.carrierId ? `/carriers/${summary.driver.carrierId}` : undefined,
    },
    { label: 'Equipment', value: summary.driver.vehicle },
  ];
  const summaryTags = formatDotNodes({
    hazmat: summary.load.isHazmat ? 'Hazmat' : '',
    tarp: summary.load.isTarp ? 'Tarp' : '',
    weight: summary.load.weight ? `${summary.load.weight}lbs` : '',
  });

  // console.log('summaryTages', summaryTags);

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
          <KpiLabel>Shipment Details</KpiLabel>
        </Stack>

        <Box sx={BOX_SX}>
          <BodyMuted sx={LABEL_SX}>Total Miles:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3, textTransform: 'capitalize' }}>
            {summary.load.miles ? `${summary.load.miles} miles` : '-'}
          </BodyStrong>
        </Box>

        <Box sx={BOX_SX}>
          <BodyMuted sx={LABEL_SX}>Commodity:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3, textTransform: 'capitalize' }}>
            {summary.load.cargo || '-'}
          </BodyStrong>
        </Box>

        {/* {summaryTags.length > 0 && ( */}
        <Box sx={BOX_SX}>
          <BodyMuted sx={LABEL_SX}>Commodity Details:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3, textTransform: 'capitalize' }}>
            {summaryTags.length || '-'}
          </BodyStrong>
        </Box>
        {/* )} */}
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
