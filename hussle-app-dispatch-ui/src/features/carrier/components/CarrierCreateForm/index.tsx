import { forwardRef, useCallback, useState } from 'react';
import { useFormik } from 'formik';
import {
  Box,
  Button,
  Grid,
  OutlinedInput,
  Stack,
} from '@mui/material';
// import { Meta, MetaStrong, SectionTitle } from 'components/Typography';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import {
  AddressField,
  CurrencyField,
  EINField,
  PercentField,
  PhoneField,
  SelectField,
  TextField,
  EmailField,
  BaseFieldWrapper,
  CharCounterField,
} from '../../../../mocho/components';
import SectionCard from 'components/SectionCard';
import type { AddressSearchResult } from 'features/place/types';
import type { DispatchFeeType } from '../../types';
import { CARRIER_TYPE_OPTIONS } from '../../constants';
import { DriverFormEntry, LookupStatus, SubmitStatus, VehicleFormEntry } from '../../types';
import { DriverInlineForm } from '../DriverInlineForm';
import { DriverSummaryCard } from '../DriverSummaryCard';
import { EmptyState } from '../EmptyState';
// import { MCLookupIndicator } from '../MCLookupIndicator';
// import { SectionCard } from '../SectionCard';
import { VehicleInlineForm } from '../VehicleInlineForm';
import { VehicleSummaryCard } from '../VehicleSummaryCard';
import type { CarrierFormValues } from '../../validators/carrierSchema';
import { carrierSchema } from '../../validators/carrierSchema';
import { useFormHandle } from '../../../../mocho/hooks/useFormHandle';
import type { FormHandle, FormStateChangeCallback } from '../../../../mocho/types/form';
import { FEE_TYPE_OPTIONS } from '../../constants';

// const isSubmitStatus = (value: string): value is SubmitStatus =>
//   value === 'ACTIVE' || value === 'PENDING';

export interface CarrierCreateFormWithAssets extends CarrierFormValues {
  drivers: DriverFormEntry[];
  vehicles: VehicleFormEntry[];
}

const carrierInitialValues: CarrierFormValues = {
  name: '',
  type: 'EXTERNAL_CARRIER' as const,
  mcNumber: '',
  dotNumber: '',
  ein: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  lat: null,
  lng: null,
  notes: '',
  dispatchFeeType: 'PERCENTAGE' as const,
  companyMarginPercent: undefined,
  dispatchFeeAmount: undefined,
};

interface CarrierCreateFormProps {
  onSubmit: (values: CarrierCreateFormWithAssets) => void;
  onStateChange?: FormStateChangeCallback;
}

const CarrierCreateForm = forwardRef<FormHandle, CarrierCreateFormProps>(
  ({ onSubmit, onStateChange }, ref) => {
    const [mcLookup, setMcLookup] = useState<LookupStatus>('idle');
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('ACTIVE');
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

    const feeType: DispatchFeeType = formik.values.dispatchFeeType ?? 'PERCENTAGE';

    // console.log('render CarrierCreateForm', { values, errors, touched });

    return (
      <form onSubmit={formik.handleSubmit}>
        <Box
          sx={{
            mx: 'auto',
            px: 4,
            py: 3,
          }}
        >
          <SectionCard title="Company Information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <SelectField
                  required
                  name="type"
                  label="Carrier Type"
                  data={CARRIER_TYPE_OPTIONS}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  name="name"
                  label="Legal Name"
                  placeholder="Legal business name"
                  formik={formik}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <PhoneField required name="phone" label="Phone Number" formik={formik} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EmailField required name="email" label="Email" formik={formik} />
              </Grid>

              <Grid item xs={12} sm={6}>
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
                    onChange={handleChange}
                    error={Boolean(touched.mcNumber && errors.mcNumber)}
                    fullWidth
                  />
                </BaseFieldWrapper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="dotNumber"
                  label="DOT Number"
                  placeholder="Auto-filled or manual"
                  formik={formik}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <EINField name="ein" label="EIN" formik={formik} />
              </Grid>
              <Grid item xs={12} sm={6} />

              <Grid item xs={12}>
                <AddressField
                  required
                  name="address"
                  label="Address"
                  placeholder="Search a business address"
                  mode="address"
                  formik={formik}
                  getSelectionState={(v) => {
                    const head = [v.address, v.city, v.state].filter(Boolean).join(', ');
                    let display = head;
                    if (v.zip) {
                      display = head ? `${head} ${v.zip}` : v.zip;
                    }
                    return {
                      display,
                      hasSelection:
                        (v.lat !== null && v.lat !== undefined && v.lng !== null && v.lng !== undefined) ||
                        Boolean(v.city && v.state && v.zip),
                    };
                  }}
                  onResolve={(r: AddressSearchResult, f) => {
                    void f.setFieldValue('address', r.address);
                    void f.setFieldValue('city', r.city);
                    void f.setFieldValue('state', r.state);
                    void f.setFieldValue('zip', r.zip);
                    void f.setFieldValue('lat', r.lat);
                    void f.setFieldValue('lng', r.lng);
                  }}
                  onClear={(f) => {
                    void f.setFieldValue('address', '');
                    void f.setFieldValue('city', '');
                    void f.setFieldValue('state', '');
                    void f.setFieldValue('zip', '');
                    void f.setFieldValue('lat', null);
                    void f.setFieldValue('lng', null);
                  }}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Financial Terms">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <SelectField
                  required
                  name="dispatchFeeType"
                  label="Dispatch Fee Type"
                  data={FEE_TYPE_OPTIONS}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {feeType === 'PERCENTAGE' ? (
                  <PercentField
                    required
                    name="companyMarginPercent"
                    label="Company Margin"
                    formik={formik}
                  />
                ) : (
                  <CurrencyField
                    required
                    name="dispatchFeeAmount"
                    label="Dispatch Fee Amount"
                    formik={formik}
                  />
                )}
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="Vehicles"
            subtitle={
              vehicles.length > 0
                ? `${vehicles.length} added`
                : "Add trucks to this carrier's roster"
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
                    setVehicles((prev) => prev.filter((item) => item.localId !== vehicle.localId))
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
                    setDrivers((prev) => prev.filter((item) => item.localId !== driver.localId))
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

          <SectionCard title="Notes" subtitle="Optional notes about this carrier">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <CharCounterField
                  name="notes"
                  label="Notes"
                  placeholder="e.g. Runs NJ→OH reefer lanes, has team drivers available…"
                  maxLength={500}
                  rows={3}
                  formik={formik}
                />
              </Box>
            </Box>
          </SectionCard>
        </Box>
      </form>
    );
  },
);

CarrierCreateForm.displayName = 'CarrierCreateForm';

export { CarrierCreateForm };
