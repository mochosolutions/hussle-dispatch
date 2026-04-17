import { useEffect, useMemo } from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';
import AgGridTable from '../../../../mocho/components/NewDataGrid';
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

  const columnDefs = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 180,
        valueGetter: (params: { data: Driver }) =>
          `${params.data.firstName} ${params.data.lastName}`,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 150,
        valueGetter: (params: { data: Driver }) => params.data.phone ?? '—',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        valueGetter: (params: { data: Driver }) => params.data.status ?? '—',
      },
      {
        field: 'licenseNumber',
        headerName: 'License',
        width: 180,
        valueGetter: (params: { data: Driver }) => {
          const typeOpt = params.data.licenseType;
          const num = params.data.licenseNumber;
          if (!num) return '—';
          return `${typeOpt} · ${num}`;
        },
      },
      {
        field: 'homeBase',
        headerName: 'Home Base',
        width: 160,
        valueGetter: (params: { data: Driver }) =>
          [params.data.homeBaseCity, params.data.homeBaseState]
            .filter(Boolean)
            .join(', ') || '—',
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
    <Card>
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
        >
          Drivers
        </Typography>
        <Chip
          label={drivers.length}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.75rem' }}
        />
      </Box>
      <Box sx={{ height: 400 }}>
        <AgGridTable
          columnDefs={columnDefs}
          rowData={drivers}
          defaultColDef={defaultColDef}
          noDataMessage="No drivers assigned to this carrier."
          gridOptions={{ domLayout: 'normal' }}
        />
      </Box>
    </Card>
  );
};
