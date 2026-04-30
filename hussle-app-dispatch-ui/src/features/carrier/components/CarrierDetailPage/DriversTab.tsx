import { useEffect, useMemo } from 'react';
import type { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { Box, Chip } from '@mui/material';
import AgGridTable from '../../../../mocho/components/NewDataGrid';
import SectionCard from 'components/SectionCard';
import { StatusCell } from 'components/Statusbadge';
import { useDispatch, useSelector } from 'store';
import { selectDriversByCarrierId } from '../../store/selectors/carrierSelectors';
import { fetchCarrierDriversRequest } from '../../store/reducers';
import type { Driver } from '../../types';

interface DriversTabProps {
  carrierId: string;
}

export const DriversTab: React.FC<DriversTabProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const driversSelector = useMemo(() => selectDriversByCarrierId(carrierId), [carrierId]);
  const drivers = useSelector(driversSelector);

  useEffect(() => {
    dispatch(fetchCarrierDriversRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const columnDefs = useMemo<ColDef<Driver>[]>(
    () => [
      {
        colId: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 180,
        valueGetter: (params: ValueGetterParams<Driver>) =>
          params.data ? `${params.data.firstName} ${params.data.lastName}` : '',
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 150,
        valueGetter: (params: ValueGetterParams<Driver>) => params.data?.phone ?? '—',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        cellRenderer: (params: ICellRendererParams<Driver>) => {
          const status = params.data?.status;
          if (!status) return '—';
          return <StatusCell status={`DRIVER_${String(status).toUpperCase()}`} size="small" />;
        },
      },
      {
        field: 'licenseNumber',
        headerName: 'License',
        width: 180,
        valueGetter: (params: ValueGetterParams<Driver>) => {
          if (!params.data) return '—';
          const typeOpt = params.data.licenseType;
          const num = params.data.licenseNumber;
          if (!num) return '—';
          return `${typeOpt} · ${num}`;
        },
      },
      {
        colId: 'homeBase',
        headerName: 'Home Base',
        width: 160,
        valueGetter: (params: ValueGetterParams<Driver>) =>
          params.data
            ? [params.data.homeBaseCity, params.data.homeBaseState].filter(Boolean).join(', ') ||
              '—'
            : '—',
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
    <SectionCard
      title="Drivers"
      actions={
        <Chip
          label={drivers.length}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.75rem' }}
        />
      }
    >
      <Box sx={{ height: 400 }}>
        <AgGridTable
          columnDefs={columnDefs}
          rowData={drivers}
          defaultColDef={defaultColDef}
          noDataMessage="No drivers assigned to this carrier."
          gridOptions={{ domLayout: 'normal' }}
        />
      </Box>
    </SectionCard>
  );
};
