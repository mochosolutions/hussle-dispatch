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

export const DriverKPI: React.FC<DriverKPIProps> = ({ driver: d }) => (
  <>
    <KpiCell label="Location" value={formatLocation(d.currentCity, d.currentState)} />
    <KpiCell label="Vehicle" value={'\u2014'} />
    <KpiCell label="Hours Available" value={d.availableHours ? `${d.availableHours}h` : '\u2014'} />
    <KpiCell label="Days Out" value={d.maxDaysOut !== null ? `${d.maxDaysOut}` : '\u2014'} />
    <KpiCell label="Weekly Gross" value={'\u2014'} />
    <KpiCell label="Last Delivered" value={'\u2014'} />
    <KpiCell label="Total Loads" value={'\u2014'} />
    <KpiCell label="On-Time Delivery" value={'\u2014'} />
    <KpiCell label="Avg Rate/Mile" value={'\u2014'} />
    <KpiCell label="Total Revenue" value={'\u2014'} />
  </>
);
