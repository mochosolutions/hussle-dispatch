import { useEffect, useMemo } from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';
import AgGridTable from '../../../../../mocho/components/NewDataGrid';
import { useDispatch, useSelector } from 'store';
import { selectVehiclesByCarrierId } from '../../../store/selectors/carrierSelectors';
import { fetchCarrierVehiclesRequest } from '../../../store/reducers';
import { EQUIPMENT_OPTIONS } from '../../../constants';
import type { Vehicle } from '../../../types';

interface VehiclesTabProps {
  carrierId: string;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const vehicles = useSelector(selectVehiclesByCarrierId(carrierId));

  useEffect(() => {
    dispatch(fetchCarrierVehiclesRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const columnDefs = useMemo(
    () => [
      {
        field: 'unitNumber',
        headerName: 'Unit #',
        width: 120,
      },
      {
        field: 'type',
        headerName: 'Type',
        width: 140,
        valueGetter: (params: { data: Vehicle }) =>
          EQUIPMENT_OPTIONS.find((e) => e.value === params.data.type)?.label ?? params.data.type,
      },
      {
        field: 'ownership',
        headerName: 'Ownership',
        width: 120,
        valueGetter: (params: { data: Vehicle }) =>
          params.data.ownership === 'OWNED' ? 'Owned' : 'Leased',
      },
      {
        field: 'yearMakeModel',
        headerName: 'Year / Make / Model',
        flex: 1,
        minWidth: 180,
        valueGetter: (params: { data: Vehicle }) =>
          [params.data.year, params.data.make, params.data.model]
            .filter(Boolean)
            .join(' ') || '—',
      },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 100,
        valueGetter: (params: { data: Vehicle }) =>
          params.data.isActive ? 'Active' : 'Inactive',
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
          Vehicles
        </Typography>
        <Chip
          label={vehicles.length}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.75rem' }}
        />
      </Box>
      <Box sx={{ height: 400 }}>
        <AgGridTable
          columnDefs={columnDefs}
          rowData={vehicles}
          defaultColDef={defaultColDef}
          noDataMessage="No vehicles assigned to this carrier."
          gridOptions={{ domLayout: 'normal' }}
        />
      </Box>
    </Card>
  );
};
