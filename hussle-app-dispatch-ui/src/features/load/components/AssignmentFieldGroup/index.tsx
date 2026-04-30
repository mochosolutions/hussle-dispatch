import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Chip, Grid, InputAdornment } from '@mui/material';

import { Meta, MetaStrong } from 'components/Typography';
import SearchIcon from '@mui/icons-material/Search';
import type { CarrierListItem, Driver, Vehicle } from 'features/carrier/types';
import type { FormikFieldProps, TypeaheadOption } from '@mocho/ui/forms';
import { TypeaheadField } from '@mocho/ui/components';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useDispatch } from 'store';
import { carrierActions } from 'features/carrier/store/reducers/carrierEntitySlice';
import { getCarriers } from 'utils/api/fleet/carrierApi';
import { getDrivers } from 'utils/api/fleet/driverApi';
import { getVehicles } from 'utils/api/fleet/vehicleApi';
import getDriverDisplayName from 'utils/getDriverDisplayName';

const DEBOUNCE_MS = 300;

interface AssignmentFieldGroupProps {
  formik: AssignmentFieldGroupFormik;
}

interface AssignmentFieldGroupValues {
  carrierId?: string;
  driverId?: string;
  vehicleId?: string;
}

interface AssignmentFieldGroupMeta {
  touched?: boolean;
  error?: string;
}

interface AssignmentFieldGroupFormik {
  values: AssignmentFieldGroupValues;
  setFieldValue: (field: string, value: unknown) => Promise<unknown> | undefined;
  getFieldMeta: (field: string) => AssignmentFieldGroupMeta;
  setFieldTouched: (field: string, touched?: boolean) => Promise<unknown> | undefined;
}

const formatDriverMeta = (driver: Driver): string => {
  const parts = [
    driver.status,
    driver.currentCity && driver.currentState
      ? `${driver.currentCity}, ${driver.currentState}`
      : null,
  ].filter(Boolean);

  return parts.join(' · ');
};

const formatVehicleMeta = (vehicle: Vehicle): string => {
  const parts = [vehicle.type.replace(/_/g, ' '), vehicle.make, vehicle.model].filter(Boolean);
  return parts.join(' · ');
};

const mapCarriersToOptions = (carriers: CarrierListItem[]): TypeaheadOption[] =>
  carriers.map((carrier) => ({
    value: carrier.id,
    label: carrier.name,
    description: `${carrier.driverCount} drivers · ${carrier.vehicleCount} vehicles`,
    metadata: { type: carrier.type.replace(/_/g, ' ') },
  }));

const mapDriversToOptions = (drivers: Driver[]): TypeaheadOption[] =>
  drivers.map((driver) => ({
    value: driver.id,
    label: getDriverDisplayName(driver),
    description: formatDriverMeta(driver) || 'No current driver details',
    metadata: { isAvailable: driver.isAvailable ? 'Available' : 'Unavailable' },
  }));

const getVehicleAvailabilityLabel = (activeLoadCount: number | undefined): string =>
  activeLoadCount ? `${activeLoadCount} active load${activeLoadCount > 1 ? 's' : ''}` : 'Available';

const mapVehiclesToOptions = (vehicles: Vehicle[]): TypeaheadOption[] =>
  vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: vehicle.unitNumber,
    description: formatVehicleMeta(vehicle) || 'No vehicle details',
    metadata: {
      type: vehicle.type.replace(/_/g, ' '),
      availability: getVehicleAvailabilityLabel(vehicle.activeLoadCount),
      isAvailable: !vehicle.activeLoadCount,
    },
  }));

const searchAdornment = (
  <InputAdornment position="start">
    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
  </InputAdornment>
);

export const AssignmentFieldGroup: React.FC<AssignmentFieldGroupProps> = ({ formik }) => {
  const dispatch = useDispatch();
  const [carriers, setCarriers] = useState<CarrierListItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [carrierInputValue, setCarrierInputValue] = useState('');
  const [driverInputValue, setDriverInputValue] = useState('');
  const [vehicleInputValue, setVehicleInputValue] = useState('');
  const [carriersLoading, setCarriersLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const requestIdRef = useRef(0);
  const prevCarrierIdRef = useRef<string | undefined>(undefined);
  const driverSearchRef = useRef('');
  const vehicleSearchRef = useRef('');

  const { openDrawer } = useDrawerActions();

  const fetchDriversAndVehicles = useCallback(
    (carrierId: string, driverSearch: string, vehicleSearch: string) => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setDriversLoading(true);
      setVehiclesLoading(true);

      void Promise.all([
        getDrivers({ carrierId, limit: 20, search: driverSearch || undefined }),
        getVehicles({ carrierId, limit: 20, search: vehicleSearch || undefined }),
      ])
        .then(([driversResponse, vehiclesResponse]) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setDrivers(driversResponse.data);
          setVehicles(vehiclesResponse.data);
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setDrivers([]);
          setVehicles([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setDriversLoading(false);
            setVehiclesLoading(false);
          }
        });
    },
    [],
  );

  // Debounced carrier search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setCarriersLoading(true);

      void getCarriers({ limit: 20, search: carrierInputValue || undefined })
        .then((response) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setCarriers(response.data);
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setCarriers([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setCarriersLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [carrierInputValue]);

  // Effect 1: React to carrierId changes — fetch drivers/vehicles for the new carrier
  useEffect(() => {
    const carrierId = formik.values.carrierId;

    if (carrierId === prevCarrierIdRef.current) {
      return;
    }
    prevCarrierIdRef.current = carrierId;

    if (!carrierId) {
      driverSearchRef.current = '';
      vehicleSearchRef.current = '';
      return;
    }

    fetchDriversAndVehicles(carrierId, '', '');
  }, [formik.values.carrierId, fetchDriversAndVehicles]);

  // Effect 2: Debounced search when user types in driver/vehicle inputs
  useEffect(() => {
    const carrierId = formik.values.carrierId;

    if (!carrierId) {
      return;
    }

    // Skip if search hasn't actually changed (prevents Autocomplete display triggers)
    if (
      driverInputValue === driverSearchRef.current &&
      vehicleInputValue === vehicleSearchRef.current
    ) {
      return;
    }
    driverSearchRef.current = driverInputValue;
    vehicleSearchRef.current = vehicleInputValue;

    const timer = setTimeout(() => {
      fetchDriversAndVehicles(carrierId, driverInputValue, vehicleInputValue);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [formik.values.carrierId, driverInputValue, vehicleInputValue, fetchDriversAndVehicles]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === formik.values.driverId) ?? null,
    [drivers, formik.values.driverId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === formik.values.vehicleId) ?? null,
    [vehicles, formik.values.vehicleId],
  );

  const carrierMeta = formik.getFieldMeta('carrierId');
  const driverMeta = formik.getFieldMeta('driverId');
  const vehicleMeta = formik.getFieldMeta('vehicleId');

  const pairingWarning = useMemo(() => {
    if (!selectedDriver || !selectedVehicle) {
      return null;
    }

    if (!selectedVehicle.driverId || selectedVehicle.driverId === selectedDriver.id) {
      return null;
    }

    const pairedDriver = drivers.find((driver) => driver.id === selectedVehicle.driverId);

    if (!pairedDriver) {
      return 'This vehicle is currently paired to another driver. Saving this load will create a per-load override.';
    }

    return `${selectedVehicle.unitNumber} is currently paired to ${getDriverDisplayName(pairedDriver)}. Saving this load will create a per-load override.`;
  }, [drivers, selectedDriver, selectedVehicle]);

  const carrierOptions = useMemo(() => mapCarriersToOptions(carriers), [carriers]);
  const driverOptions = useMemo(() => mapDriversToOptions(drivers), [drivers]);
  const vehicleOptions = useMemo(() => mapVehiclesToOptions(vehicles), [vehicles]);

  const handleFieldBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const field = e?.target?.name;
      if (field) {
        void formik.setFieldTouched(field, true);
      }
    },
    [formik],
  );

  const handleSetFieldValue = useCallback(
    (field: string, value: unknown) => {
      void formik.setFieldValue(field, value);
      void formik.setFieldTouched(field, true, false);
    },
    [formik],
  );

  const carrierError = carrierMeta.touched && carrierMeta.error ? carrierMeta.error : undefined;
  const driverError = driverMeta.touched && driverMeta.error ? driverMeta.error : undefined;
  const vehicleError = vehicleMeta.touched && vehicleMeta.error ? vehicleMeta.error : undefined;

  const typeaheadFormik: FormikFieldProps<Record<string, unknown>> = useMemo(
    () => ({
      values: {
        carrierId: formik.values.carrierId ?? '',
        driverId: formik.values.driverId ?? '',
        vehicleId: formik.values.vehicleId ?? '',
      },
      errors: {
        ...(carrierError ? { carrierId: carrierError } : {}),
        ...(driverError ? { driverId: driverError } : {}),
        ...(vehicleError ? { vehicleId: vehicleError } : {}),
      },
      touched: {
        ...(carrierMeta.touched ? { carrierId: true } : {}),
        ...(driverMeta.touched ? { driverId: true } : {}),
        ...(vehicleMeta.touched ? { vehicleId: true } : {}),
      },
      handleChange: () => undefined,
      handleBlur: handleFieldBlur,
      setFieldValue: handleSetFieldValue,
    }),
    [
      formik.values.carrierId,
      formik.values.driverId,
      formik.values.vehicleId,
      carrierError,
      driverError,
      vehicleError,
      carrierMeta.touched,
      driverMeta.touched,
      vehicleMeta.touched,
      handleFieldBlur,
      handleSetFieldValue,
    ],
  );

  const handleCarrierSelect = useCallback(
    (option: TypeaheadOption | null) => {
      void formik.setFieldValue('driverId', '');
      void formik.setFieldValue('vehicleId', '');
      setDrivers([]);
      setVehicles([]);
      setDriverInputValue('');
      setVehicleInputValue('');
      driverSearchRef.current = '';
      vehicleSearchRef.current = '';

      // Add selected carrier to entity store so financial components can read its config
      if (option) {
        const carrier = carriers.find((c) => c.id === option.value);
        if (carrier) {
          dispatch(carrierActions.addOne(carrier));
        }
      }
    },
    [formik, carriers, dispatch],
  );

  const handleDriverSelect = useCallback(
    (option: TypeaheadOption | null) => {
      if (option) {
        driverSearchRef.current = option.label;
      }
      if (option && !formik.values.vehicleId) {
        const pairedVehicle = vehicles.find((vehicle) => vehicle.driverId === option.value);
        if (pairedVehicle) {
          void formik.setFieldValue('vehicleId', pairedVehicle.id);
          vehicleSearchRef.current = pairedVehicle.unitNumber;
        }
      }
    },
    [formik, vehicles],
  );

  const handleVehicleSelect = useCallback(
    (option: TypeaheadOption | null) => {
      if (option) {
        vehicleSearchRef.current = option.label;
      }
      if (option && !formik.values.driverId) {
        const vehicle = vehicles.find((v) => v.id === option.value);
        if (vehicle?.driverId) {
          void formik.setFieldValue('driverId', vehicle.driverId);
          const driver = drivers.find((d) => d.id === vehicle.driverId);
          if (driver) {
            driverSearchRef.current = getDriverDisplayName(driver);
          }
        }
      }
    },
    [formik, vehicles, drivers],
  );

  const handleOpenDriverDrawer = useCallback(() => {
    openDrawer('driverCreate', {
      initialCarrierId: formik.values.carrierId,
      onClose: () => {
        if (formik.values.carrierId) {
          fetchDriversAndVehicles(
            formik.values.carrierId,
            driverSearchRef.current,
            vehicleSearchRef.current,
          );
        }
      },
    });
  }, [openDrawer, formik.values.carrierId, fetchDriversAndVehicles]);

  const handleOpenVehicleDrawer = useCallback(() => {
    openDrawer('vehicleCreate', {
      initialCarrierId: formik.values.carrierId,
      onClose: () => {
        if (formik.values.carrierId) {
          fetchDriversAndVehicles(
            formik.values.carrierId,
            driverSearchRef.current,
            vehicleSearchRef.current,
          );
        }
      },
    });
  }, [openDrawer, formik.values.carrierId, fetchDriversAndVehicles]);

  const renderCarrierOption = useCallback(
    (option: TypeaheadOption) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MetaStrong sx={{ color: 'text.primary' }}>
            {option.label}
          </MetaStrong>
          {option.metadata?.type ? (
            <Chip
              label={option.metadata.type}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.625rem' }}
            />
          ) : null}
        </Box>
        <Meta>
          {option.description}
        </Meta>
      </Box>
    ),
    [],
  );

  const renderDriverOption = useCallback(
    (option: TypeaheadOption) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MetaStrong sx={{ color: 'text.primary' }}>
            {option.label}
          </MetaStrong>
          <Chip
            label={option.metadata?.isAvailable ?? 'Unavailable'}
            color={option.metadata?.isAvailable === 'Available' ? 'success' : 'default'}
            size="small"
            sx={{ height: 20, fontSize: '0.625rem' }}
          />
        </Box>
        <Meta>
          {option.description}
        </Meta>
      </Box>
    ),
    [],
  );

  const renderVehicleOption = useCallback(
    (option: TypeaheadOption) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MetaStrong sx={{ color: 'text.primary' }}>
            {option.label}
          </MetaStrong>
          {option.metadata?.type ? (
            <Chip
              label={option.metadata.type}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.625rem' }}
            />
          ) : null}
          <Chip
            label={option.metadata?.availability ?? 'Available'}
            color={option.metadata?.isAvailable ? 'success' : 'warning'}
            size="small"
            sx={{ height: 20, fontSize: '0.625rem' }}
          />
        </Box>
        <Meta>
          {option.description}
        </Meta>
      </Box>
    ),
    [],
  );

  return (
    <>
      <Grid item xs={12}>
        <TypeaheadField
          name="carrierId"
          label="Carrier"
          options={carrierOptions}
          formik={typeaheadFormik}
          placeholder="Search carrier by name"
          loading={carriersLoading}
          onInputValueChange={setCarrierInputValue}
          onOptionSelect={handleCarrierSelect}
          renderOptionContent={renderCarrierOption}
          startAdornment={searchAdornment}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TypeaheadField
          name="driverId"
          label="Driver"
          options={driverOptions}
          formik={typeaheadFormik}
          placeholder="Search driver..."
          disabled={!formik.values.carrierId}
          loading={driversLoading}
          noOptionsText={formik.values.carrierId ? 'No drivers found' : 'Select a carrier first'}
          helperText={
            !driverMeta.touched && !formik.values.carrierId
              ? 'Select a carrier to load drivers'
              : undefined
          }
          actionButtonLabel="Add New Driver"
          onActionButtonClick={handleOpenDriverDrawer}
          onInputValueChange={setDriverInputValue}
          onOptionSelect={handleDriverSelect}
          renderOptionContent={renderDriverOption}
          startAdornment={searchAdornment}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TypeaheadField
          name="vehicleId"
          label="Vehicle / Trailer"
          options={vehicleOptions}
          formik={typeaheadFormik}
          placeholder="Select vehicle..."
          disabled={!formik.values.carrierId}
          loading={vehiclesLoading}
          noOptionsText={formik.values.carrierId ? 'No vehicles found' : 'Select a carrier first'}
          helperText={
            !vehicleMeta.touched && !formik.values.carrierId
              ? 'Select a carrier to load vehicles'
              : undefined
          }
          actionButtonLabel="Add New Vehicle"
          onActionButtonClick={handleOpenVehicleDrawer}
          onInputValueChange={setVehicleInputValue}
          onOptionSelect={handleVehicleSelect}
          renderOptionContent={renderVehicleOption}
          startAdornment={searchAdornment}
        />
      </Grid>

      {pairingWarning ? (
        <Grid item xs={12}>
          <Alert severity="warning">{pairingWarning}</Alert>
        </Grid>
      ) : null}
    </>
  );
};

export default AssignmentFieldGroup;
