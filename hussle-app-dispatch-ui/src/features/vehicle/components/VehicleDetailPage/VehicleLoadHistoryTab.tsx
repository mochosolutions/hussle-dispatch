import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { Box } from '@mui/material';
import { MetaStrong } from 'components/Typography';
import { format } from 'date-fns';
import { EmptyState, NewDataGrid } from '@mocho/ui/components';
import SectionCard from 'components/SectionCard';
import { StatusCell } from 'components/Statusbadge';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';

const RPM_TARGET = 2;

const currencyFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

interface VehicleLoadHistoryTabProps {
  vehicleLoads: VehicleLoad[];
  isLoading?: boolean;
}

const formatPickupDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return format(date, 'MMM d, yyyy');
};

export const VehicleLoadHistoryTab: React.FC<VehicleLoadHistoryTabProps> = ({
  vehicleLoads,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClicked = useCallback(
    (params: { data?: VehicleLoad }) => {
      if (params.data) {
        navigate(`/loads/${params.data.id}`);
      }
    },
    [navigate],
  );

  const columnDefs = useMemo<ColDef<VehicleLoad>[]>(
    () => [
      {
        field: 'referenceNumber',
        headerName: 'Reference',
        flex: 1,
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<VehicleLoad>) => (
          <MetaStrong sx={{ color: 'primary.main' }}>
            {params.data?.referenceNumber ?? '—'}
          </MetaStrong>
        ),
      },
      {
        field: 'origin',
        headerName: 'Origin',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'destination',
        headerName: 'Destination',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        cellRenderer: (params: ICellRendererParams<VehicleLoad>) => {
          const status = params.data?.status;
          if (!status) {
            return '—';
          }
          return <StatusCell status={String(status).toUpperCase()} size="small" />;
        },
      },
      {
        field: 'rate',
        headerName: 'Rate',
        width: 120,
        valueGetter: (params: ValueGetterParams<VehicleLoad>) =>
          params.data ? currencyFull.format(parseFloat(params.data.rate)) : '—',
      },
      {
        field: 'miles',
        headerName: 'Miles',
        width: 100,
        valueGetter: (params: ValueGetterParams<VehicleLoad>) =>
          params.data ? params.data.miles.toLocaleString() : '—',
      },
      {
        colId: 'rpm',
        headerName: 'RPM',
        width: 100,
        cellRenderer: (params: ICellRendererParams<VehicleLoad>) => {
          if (!params.data || params.data.miles <= 0) {
            return '—';
          }
          const rate = parseFloat(params.data.rate);
          const rpm = rate / params.data.miles;
          const color = rpm >= RPM_TARGET ? 'success.main' : 'error.main';
          return (
            <MetaStrong sx={{ color }}>
              ${rpm.toFixed(2)}
            </MetaStrong>
          );
        },
      },
      {
        field: 'pickupDate',
        headerName: 'Pickup',
        width: 130,
        valueGetter: (params: ValueGetterParams<VehicleLoad>) =>
          params.data ? formatPickupDate(params.data.pickupDate) : '—',
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    [],
  );

  return (
    <SectionCard title="Load History">
      <Box sx={{ minHeight: { xs: 300, md: 420 } }}>
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={vehicleLoads}
          defaultColDef={defaultColDef}
          loading={isLoading}
          showRowCountFooter
          totalRowCount={vehicleLoads.length}
          rowCountLabel="loads"
          noDataComponent={<EmptyState variant="no-results" entityName="Loads" compact />}
          gridOptions={{
            domLayout: 'normal',
            pagination: true,
            paginationPageSize: 25,
            suppressCellFocus: true,
            headerHeight: 44,
            rowHeight: 56,
            onRowClicked: handleRowClicked,
          }}
        />
      </Box>
    </SectionCard>
  );
};
