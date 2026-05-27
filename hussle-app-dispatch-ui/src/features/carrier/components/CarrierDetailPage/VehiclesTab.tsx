import { useEffect, useMemo } from 'react';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import { Box, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AgGridTable from '../../../../mocho/components/NewDataGrid';
import SectionCard from 'components/SectionCard';
import { useDispatch, useSelector } from 'store';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { selectVehiclesByCarrierId } from '../../store/selectors/carrierSelectors';
import { fetchCarrierVehiclesRequest } from '../../store/reducers';
import { EQUIPMENT_OPTIONS } from '../../constants';
import type { Vehicle } from '../../types';

interface VehiclesTabProps {
  carrierId: string;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const vehiclesSelector = useMemo(() => selectVehiclesByCarrierId(carrierId), [carrierId]);
  const vehicles = useSelector(vehiclesSelector);

  const handleAddVehicle = () => {
    openDrawer('vehicleCreate', { onClose: () => undefined, initialCarrierId: carrierId });
  };

  useEffect(() => {
    dispatch(fetchCarrierVehiclesRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const columnDefs = useMemo<ColDef<Vehicle>[]>(
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
        valueGetter: (params: ValueGetterParams<Vehicle>) => {
          if (!params.data) return '';
          return (
            EQUIPMENT_OPTIONS.find((e) => e.value === params.data?.type)?.label ?? params.data.type
          );
        },
      },
      {
        field: 'ownership',
        headerName: 'Ownership',
        width: 120,
        valueGetter: (params: ValueGetterParams<Vehicle>) =>
          params.data?.ownership === 'OWNED' ? 'Owned' : 'Leased',
      },
      {
        colId: 'yearMakeModel',
        headerName: 'Year / Make / Model',
        flex: 1,
        minWidth: 180,
        valueGetter: (params: ValueGetterParams<Vehicle>) =>
          params.data
            ? [params.data.year, params.data.make, params.data.model].filter(Boolean).join(' ') ||
              '—'
            : '—',
      },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 100,
        valueGetter: (params: ValueGetterParams<Vehicle>) =>
          params.data?.isActive ? 'Active' : 'Inactive',
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
      title="Vehicles"
      actions={
        <Tooltip title="Add vehicle">
          <IconButton
            size="small"
            onClick={handleAddVehicle}
            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
            aria-label="Add vehicle"
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      }
    >
      <Box sx={{ height: 400 }}>
        <AgGridTable
          columnDefs={columnDefs}
          rowData={vehicles}
          defaultColDef={defaultColDef}
          noDataMessage="No vehicles assigned to this carrier."
          gridOptions={{ domLayout: 'normal' }}
        />
      </Box>
    </SectionCard>
  );
};
