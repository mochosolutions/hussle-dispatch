import { Box } from '@mui/material';
import { KpiCell } from 'components/Typography';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { Driver } from 'features/carrier/types';

interface DriverWithCarrierInfo extends Driver {
  carrierName: string | null;
  carrierType: string | null;
}

interface DriverKPIProps {
  driver: DriverWithCarrierInfo;
}

const formatLocation = (city: string | null, state: string | null): string => {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '\u2014';
};

export const DriverKPI: React.FC<DriverKPIProps> = ({ driver: d }) => {
  console.log('DriverKPI render', { driver: d });
  const kpis = [
    { label: 'Location', value: formatLocation(d.currentCity, d.currentState) },
    { label: 'Vehicle', value: '\u2014' },
    { label: 'Hours Available', value: d.availableHours ? `${d.availableHours}h` : '\u2014' },
    { label: 'Days Out', value: d.maxDaysOut !== null ? `${d.maxDaysOut}` : '\u2014' },
    { label: 'Weekly Gross', value: '\u2014' },
    { label: 'Last Delivered', value: '\u2014' },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'grey.50',
      }}
    >
      {kpis.map((kpi, i) => (
        <Box
          key={kpi.label}
          sx={{
            px: 2.5,
            py: 1.5,
            borderRight: i < 5 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <KpiCell key={i} label={kpi.label} value={kpi.value} />
        </Box>
      ))}
      {/*  <KpiCell label="Location" value={formatLocation(d.currentCity, d.currentState)} />
      <KpiCell label="Vehicle" value={'\u2014'} />
      <KpiCell
        label="Hours Available"
        value={d.availableHours ? `${d.availableHours}h` : '\u2014'}
      />
      <KpiCell label="Days Out" value={d.maxDaysOut !== null ? `${d.maxDaysOut}` : '\u2014'} />
      <KpiCell label="Weekly Gross" value={'\u2014'} />
      <KpiCell label="Last Delivered" value={'\u2014'} />
     <KpiCell label="Total Loads" value={'\u2014'} />
    <KpiCell label="On-Time Delivery" value={'\u2014'} />
    <KpiCell label="Avg Rate/Mile" value={'\u2014'} />
    <KpiCell label="Total Revenue" value={'\u2014'} /> */}
    </Box>
  );
};
