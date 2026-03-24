import { useMemo } from 'react';
import { KpiCell } from 'components/Typography';
import type { Vehicle } from 'features/carrier/types';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

interface VehicleKPIProps {
  vehicle: Vehicle & {
    driverName: string | null;
  };
  cpm: number;
  monthlyCost: number;
  vehicleLoads?: VehicleLoad[];
}

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const VehicleKPI: React.FC<VehicleKPIProps> = ({
  vehicle,
  cpm,
  monthlyCost,
  vehicleLoads = [],
}) => {
  const loadMetrics = useMemo(() => {
    const totalLoads = vehicleLoads.length;
    const deliveredLoads = vehicleLoads.filter((load) => load.status === 'DELIVERED');
    const totalRevenue = deliveredLoads.reduce(
      (sum, load) => sum + parseFloat(load.rate),
      0,
    );
    const totalMiles = deliveredLoads.reduce((sum, load) => sum + load.miles, 0);
    const avgRpm = totalMiles > 0 ? totalRevenue / totalMiles : 0;

    return { totalLoads, totalRevenue, totalMiles, avgRpm };
  }, [vehicleLoads]);

  return (
    <>
      <KpiCell
        label="TYPE"
        value={`${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || '\u2014'}
      />
      <KpiCell label="EQUIPMENT" value={VEHICLE_TYPE_LABELS[vehicle.type] ?? '\u2014'} />
      <KpiCell label="OWNERSHIP" value={OWNERSHIP_LABELS[vehicle.ownership] ?? '\u2014'} />
      <KpiCell label="DRIVER" value={vehicle.driverName ?? '\u2014'} />
      <KpiCell
        label="CPM"
        value={Number.isFinite(cpm) ? `$${cpm.toFixed(2)}/mi` : '\u2014'}
      />
      <KpiCell
        label="MONTHLY COST"
        value={Number.isFinite(monthlyCost) ? currencyCompact.format(monthlyCost) : '\u2014'}
      />
      <KpiCell
        label="TOTAL LOADS"
        value={loadMetrics.totalLoads > 0 ? String(loadMetrics.totalLoads) : '\u2014'}
      />
      <KpiCell
        label="TOTAL REVENUE"
        value={loadMetrics.totalRevenue > 0 ? currencyCompact.format(loadMetrics.totalRevenue) : '\u2014'}
      />
      <KpiCell
        label="TOTAL MILES"
        value={loadMetrics.totalMiles > 0 ? loadMetrics.totalMiles.toLocaleString() : '\u2014'}
      />
      <KpiCell
        label="AVG RPM"
        value={loadMetrics.avgRpm > 0 ? `$${loadMetrics.avgRpm.toFixed(2)}` : '\u2014'}
      />
    </>
  );
};
