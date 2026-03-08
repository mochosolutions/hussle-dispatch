import { forwardRef, useCallback, useState } from 'react';
import { useFormik } from 'formik';
import {
  Box,
  Button,
  Card,
  Grid,
  OutlinedInput,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { BaseFieldWrapper } from '../../../../mocho/components/form-fields/BaseFieldWrapper';
import { CharCounterField } from '../../../../mocho/components/form-fields/CharCounterField';
import { SelectField } from '../../../../mocho/components/form-fields/SelectField';
import { TextField } from '../../../../mocho/components/form-fields/TextField';
import { CARRIER_TYPE_OPTIONS } from '../../constants';
import type {
  CreateMode,
  DriverFormEntry,
  LookupStatus,
  SubmitStatus,
  VehicleFormEntry,
} from '../../types';
import { DriverInlineForm } from '../DriverInlineForm';
import { DriverSummaryCard } from '../DriverSummaryCard';
import { EmptyState } from '../EmptyState';
import { MCLookupIndicator } from '../MCLookupIndicator';
import { SectionCard } from '../SectionCard';
import { VehicleInlineForm } from '../VehicleInlineForm';
import { VehicleSummaryCard } from '../VehicleSummaryCard';
import type { CarrierFormValues } from '../../validators/carrierSchema';
import { carrierSchema } from '../../validators/carrierSchema';
import { useFormHandle } from '../../../../mocho/hooks/useFormHandle';
import type { FormHandle, FormStateChangeCallback } from '../../../../mocho/types/form';

const isCreateMode = (value: string): value is CreateMode => value === 'full' || value === 'quick';
const isSubmitStatus = (value: string): value is SubmitStatus =>
  value === 'active' || value === 'pending';

export interface CarrierCreateFormWithAssets extends CarrierFormValues {
  drivers: DriverFormEntry[];
  vehicles: VehicleFormEntry[];
}

const carrierInitialValues: CarrierFormValues = {
  name: '',
  type: 'EXTERNAL_CARRIER' as const,
  mcNumber: '',
  dotNumber: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

interface CarrierCreateFormProps {
  onSubmit: (values: CarrierCreateFormWithAssets) => void;
  onStateChange?: FormStateChangeCallback;
}

const CarrierCreateForm = forwardRef<FormHandle, CarrierCreateFormProps>(
  ({ onSubmit, onStateChange }, ref) => {
    const [mcLookup, setMcLookup] = useState<LookupStatus>('idle');
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('active');
    const [vehicles, setVehicles] = useState<VehicleFormEntry[]>([]);
    const [drivers, setDrivers] = useState<DriverFormEntry[]>([]);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<VehicleFormEntry | null>(null);
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState<DriverFormEntry | null>(null);

    const formik = useFormik<CarrierFormValues>({
      initialValues: carrierInitialValues,
      validationSchema: carrierSchema,
      validateOnBlur: true,
      validateOnChange: true,
      onSubmit: (values) => {
        onSubmit({ ...values, drivers, vehicles });
      },
    });

    useFormHandle({ ref, formik, onStateChange });

    const handleMcLookup = useCallback(
      (mcNumber: string) => {
        if (mcNumber.length < 5) {
          return;
        }

        setMcLookup('searching');

        setTimeout(() => {
          const found = !mcNumber.includes('9');
          setMcLookup(found ? 'found' : 'not_found');

          if (found) {
            void formik.setFieldValue(
              'dotNumber',
              `DOT-${Math.floor(Math.random() * 9000000 + 1000000).toString()}`,
            );
            void formik.setFieldValue('name', 'Auto-Filled Carrier LLC');
            void formik.setFieldValue('address', '789 Carrier Way, Elizabeth, NJ 07201');
          }
        }, 1500);
      },
      [formik],
    );

    const handleSaveVehicle = (vehicle: VehicleFormEntry) => {
      setVehicles((prev) =>
        editingVehicle
          ? prev.map((item) => (item.localId === vehicle.localId ? vehicle : item))
          : [...prev, vehicle],
      );
      setShowVehicleForm(false);
      setEditingVehicle(null);
    };

    const handleSaveDriver = (driver: DriverFormEntry) => {
      setDrivers((prev) =>
        editingDriver
          ? prev.map((item) => (item.localId === driver.localId ? driver : item))
          : [...prev, driver],
      );
      setShowDriverForm(false);
      setEditingDriver(null);
    };

    const { values, errors, touched, handleBlur, handleChange } = formik;

    const assetCount = vehicles.length + drivers.length;
    const hasAssets = assetCount > 0;
    const assetLabel = hasAssets ? `${assetCount} Asset${assetCount > 1 ? 's' : ''}` : '';

    const submitLabel = hasAssets ? `Create Carrier + ${assetLabel}` : 'Create Carrier';

    return (
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 4, py: 3 }}>
          {/* <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value: string | null) => {
              if (value && isCreateMode(value)) {
                setMode(value);
              }
            }}
            fullWidth
            sx={{
              mb: 3,
              bgcolor: 'grey.200',
              borderRadius: 1,
              p: 0.375,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1,
                py: 1.25,
                flexDirection: 'column',
                alignItems: 'flex-start',
              },
            }}
          >
            <ToggleButton value="full">
              <Typography variant="body2" sx={{ fontWeight: mode === 'full' ? 600 : 500 }}>
                Full Onboarding
              </Typography>
              <Typography variant="caption">Carrier + Vehicles + Drivers</Typography>
            </ToggleButton>
            <ToggleButton value="quick">
              <Typography variant="body2" sx={{ fontWeight: mode === 'quick' ? 600 : 500 }}>
                Quick Add + Invite
              </Typography>
              <Typography variant="caption">Carrier shell → send invite</Typography>
            </ToggleButton>
          </ToggleButtonGroup> */}

          <SectionCard title="Company Information" subtitle="MC/DOT auto-lookups from FMCSA">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <BaseFieldWrapper
                  name="mcNumber"
                  label="MC Number"
                  error={errors.mcNumber}
                  touched={touched.mcNumber}
                >
                  <OutlinedInput
                    id="mcNumber"
                    name="mcNumber"
                    placeholder="MC-0000000"
                    value={values.mcNumber}
                    onChange={(event) => {
                      handleChange(event);
                      setMcLookup('idle');
                    }}
                    onBlur={(event) => {
                      handleBlur(event);
                      handleMcLookup(event.target.value);
                    }}
                    error={Boolean(touched.mcNumber && errors.mcNumber)}
                    fullWidth
                  />
                </BaseFieldWrapper>
                <MCLookupIndicator status={mcLookup} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="dotNumber" label="DOT Number" placeholder="Auto-filled or manual" formik={formik} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="name" label="Legal Name" placeholder="Legal business name" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <SelectField
                  name="type"
                  label="Carrier Type"
                  data={CARRIER_TYPE_OPTIONS}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField name="address" label="Address" placeholder="789 Carrier Way, Elizabeth, NJ 07201" formik={formik} />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Notes" subtitle="Optional notes about this carrier">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CharCounterField
                  name="notes"
                  label="Notes"
                  placeholder="e.g. Runs NJ→OH reefer lanes, has team drivers available…"
                  maxLength={500}
                  rows={3}
                  formik={formik}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="Vehicles"
            subtitle={
              vehicles.length > 0 ? `${vehicles.length} added` : "Add trucks to this carrier's roster"
            }
            actions={
              !showVehicleForm && !editingVehicle ? (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setShowVehicleForm(true);
                    setEditingVehicle(null);
                  }}
                  sx={{
                    borderRadius: 5,
                    border: 1,
                    borderStyle: 'dashed',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    fontWeight: 600,
                    px: 2,
                  }}
                >
                  Add Vehicle
                </Button>
              ) : undefined
            }
          >
            <Stack spacing={1}>
              {vehicles.map((vehicle) => (
                <VehicleSummaryCard
                  key={vehicle.localId}
                  vehicle={vehicle}
                  onEdit={() => {
                    setEditingVehicle(vehicle);
                    setShowVehicleForm(false);
                  }}
                  onRemove={() =>
                    setVehicles((prev) =>
                      prev.filter((item) => item.localId !== vehicle.localId),
                    )
                  }
                />
              ))}

              {editingVehicle && (
                <VehicleInlineForm
                  initial={editingVehicle}
                  onSave={handleSaveVehicle}
                  onCancel={() => setEditingVehicle(null)}
                />
              )}

              {showVehicleForm && !editingVehicle && (
                <VehicleInlineForm
                  onSave={handleSaveVehicle}
                  onCancel={() => setShowVehicleForm(false)}
                />
              )}

              {vehicles.length === 0 && !showVehicleForm && !editingVehicle && (
                <EmptyState
                  icon={<LocalShippingIcon sx={{ fontSize: 32, color: 'text.disabled' }} />}
                  label="No vehicles yet"
                  buttonLabel="Add First Vehicle"
                  onAdd={() => setShowVehicleForm(true)}
                />
              )}
            </Stack>
          </SectionCard>

          <SectionCard
            title="Drivers"
            subtitle={
              drivers.length > 0 ? `${drivers.length} added` : 'Add drivers to this carrier'
            }
            actions={
              !showDriverForm && !editingDriver ? (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setShowDriverForm(true);
                    setEditingDriver(null);
                  }}
                  sx={{
                    borderRadius: 5,
                    border: 1,
                    borderStyle: 'dashed',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    fontWeight: 600,
                    px: 2,
                  }}
                >
                  Add Driver
                </Button>
              ) : undefined
            }
          >
            <Stack spacing={1}>
              {drivers.map((driver) => (
                <DriverSummaryCard
                  key={driver.localId}
                  driver={driver}
                  onEdit={() => {
                    setEditingDriver(driver);
                    setShowDriverForm(false);
                  }}
                  onRemove={() =>
                    setDrivers((prev) =>
                      prev.filter((item) => item.localId !== driver.localId),
                    )
                  }
                />
              ))}

              {editingDriver && (
                <DriverInlineForm
                  initial={editingDriver}
                  onSave={handleSaveDriver}
                  onCancel={() => setEditingDriver(null)}
                />
              )}

              {showDriverForm && !editingDriver && (
                <DriverInlineForm
                  onSave={handleSaveDriver}
                  onCancel={() => setShowDriverForm(false)}
                />
              )}

              {drivers.length === 0 && !showDriverForm && !editingDriver && (
                <EmptyState
                  icon={<PersonIcon sx={{ fontSize: 32, color: 'text.disabled' }} />}
                  label="No drivers yet"
                  buttonLabel="Add First Driver"
                  onAdd={() => setShowDriverForm(true)}
                />
              )}
            </Stack>
          </SectionCard>

          <Card sx={{ mb: 2 }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}
                >
                  Carrier status after creation
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                  Choose based on readiness
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={submitStatus}
                exclusive
                onChange={(_, value: string | null) => {
                  if (value && isSubmitStatus(value)) {
                    setSubmitStatus(value);
                  }
                }}
                size="small"
                sx={{
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  p: 0.25,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 0.5,
                    px: 2,
                  },
                }}
              >
                <ToggleButton value="active">
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: submitStatus === 'active' ? 'success.main' : 'text.disabled',
                    }}
                  >
                    ● Approved
                  </Typography>
                </ToggleButton>
                <ToggleButton value="pending">
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: submitStatus === 'pending' ? 'warning.main' : 'text.disabled',
                    }}
                  >
                    ● Pending Review
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Card>
        </Box>
      </form>
    );
  },
);

CarrierCreateForm.displayName = 'CarrierCreateForm';

export { CarrierCreateForm };
