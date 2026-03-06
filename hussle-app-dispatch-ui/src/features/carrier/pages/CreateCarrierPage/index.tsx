import { useCallback, useState } from 'react';
import { Form, Formik, type FormikHelpers } from 'formik';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { CONTACT_ROLES, EQUIPMENT_OPTIONS } from '../../constants';
import type { CreateMode, DriverFormEntry, LookupStatus, SubmitStatus, VehicleFormEntry } from '../../types';
import { DriverInlineForm } from '../../components/DriverInlineForm';
import { DriverSummaryCard } from '../../components/DriverSummaryCard';
import { EmptyState } from '../../components/EmptyState';
import { MCLookupIndicator } from '../../components/MCLookupIndicator';
import { SectionCard } from '../../components/SectionCard';
import { SuccessView } from '../../components/SuccessView';
import { VehicleInlineForm } from '../../components/VehicleInlineForm';
import { VehicleSummaryCard } from '../../components/VehicleSummaryCard';
import type { CarrierFormValues } from '../../validators/carrierSchema';
import { carrierSchema } from '../../validators/carrierSchema';

const isCreateMode = (value: string): value is CreateMode => value === 'full' || value === 'quick';
const isSubmitStatus = (value: string): value is SubmitStatus =>
  value === 'active' || value === 'pending';

const carrierInitialValues: CarrierFormValues = {
  mcNumber: '',
  dotNumber: '',
  legalName: '',
  address: '',
  contactName: '',
  contactRole: '',
  contactPhone: '',
  contactEmail: '',
  equipmentTypes: [],
  fleetSize: '',
  notes: '',
};

const CreateCarrierPage = () => {
  const [mode, setMode] = useState<CreateMode>('full');
  const [mcLookup, setMcLookup] = useState<LookupStatus>('idle');
  const [sendInvite, setSendInvite] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('active');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<CarrierFormValues | null>(null);

  const [vehicles, setVehicles] = useState<VehicleFormEntry[]>([]);
  const [drivers, setDrivers] = useState<DriverFormEntry[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleFormEntry | null>(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverFormEntry | null>(null);

  const handleMcLookup = useCallback(
    (
      mcNumber: string,
      setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => Promise<unknown>,
    ) => {
      if (mcNumber.length < 5) {
        return;
      }

      setMcLookup('searching');

      setTimeout(() => {
        const found = !mcNumber.includes('9');
        setMcLookup(found ? 'found' : 'not_found');

        if (found) {
          void setFieldValue(
            'dotNumber',
            `DOT-${Math.floor(Math.random() * 9000000 + 1000000).toString()}`,
          );
          void setFieldValue('legalName', 'Auto-Filled Carrier LLC');
          void setFieldValue('address', '789 Carrier Way, Elizabeth, NJ 07201');
        }
      }, 1500);
    },
    [],
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

  const handleFormSubmit = (
    values: CarrierFormValues,
    helpers: FormikHelpers<CarrierFormValues>,
  ) => {
    setSuccessData(values);
    setShowSuccess(true);
    helpers.setSubmitting(false);
  };

  const handleReset = () => {
    setShowSuccess(false);
    setSuccessData(null);
    setVehicles([]);
    setDrivers([]);
    setMcLookup('idle');
    setSendInvite(true);
    setSubmitStatus('active');
    setShowVehicleForm(false);
    setShowDriverForm(false);
    setEditingVehicle(null);
    setEditingDriver(null);
  };

  if (showSuccess && successData) {
    return (
      <SuccessView
        companyName={successData.legalName}
        mode={mode}
        submitStatus={submitStatus}
        sendInvite={sendInvite}
        contactEmail={successData.contactEmail}
        vehicleCount={vehicles.length}
        driverCount={drivers.length}
        onAddAnother={handleReset}
        onViewCarrier={() => undefined}
      />
    );
  }

  const assetCount = vehicles.length + drivers.length;

  return (
    <Formik
      initialValues={carrierInitialValues}
      validationSchema={carrierSchema}
      onSubmit={handleFormSubmit}
      validateOnBlur
      validateOnChange={false}
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        setFieldValue,
        isValid,
        dirty,
        handleSubmit,
      }) => {
        const hasAssets = assetCount > 0;
        const assetLabel = hasAssets ? `${assetCount} Asset${assetCount > 1 ? 's' : ''}` : '';

        let submitLabel = 'Create as Draft';

        if (mode === 'full') {
          submitLabel = hasAssets ? `Create Carrier + ${assetLabel}` : 'Create Carrier';
        } else if (sendInvite && values.contactEmail) {
          submitLabel = 'Create & Send Invite';
        }

        const equipmentTypesError =
          touched.equipmentTypes && typeof errors.equipmentTypes === 'string'
            ? errors.equipmentTypes
            : undefined;

        return (
          <Form>
            <Box
              sx={{
                px: 4,
                py: 2,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  size="small"
                  sx={{ color: 'primary.main', minWidth: 'auto' }}
                >
                  Carriers
                </Button>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h5">Add New Carrier</Typography>
                  <Typography variant="caption">
                    {mode === 'full'
                      ? 'Full onboarding — carrier, vehicles & drivers'
                      : 'Quick add — create shell & send invite'}
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined">Cancel</Button>
                <Button
                  variant="contained"
                  disabled={!isValid || !dirty}
                  onClick={() => handleSubmit()}
                >
                  {submitLabel}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ maxWidth: 720, mx: 'auto', px: 4, py: 3 }}>
              <ToggleButtonGroup
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
              </ToggleButtonGroup>

              <SectionCard title="Company Information" subtitle="MC/DOT auto-lookups from FMCSA">
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="mcNumber"
                      label="MC Number"
                      placeholder="MC-0000000"
                      value={values.mcNumber}
                      onChange={(event) => {
                        handleChange(event);
                        setMcLookup('idle');
                      }}
                      onBlur={(event) => {
                        handleBlur(event);
                        handleMcLookup(event.target.value, setFieldValue);
                      }}
                      error={Boolean(touched.mcNumber && errors.mcNumber)}
                      helperText={touched.mcNumber ? errors.mcNumber : undefined}
                    />
                    <MCLookupIndicator status={mcLookup} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="dotNumber"
                      label="DOT Number"
                      placeholder="Auto-filled or manual"
                      value={values.dotNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="legalName"
                      label="Legal Name"
                      placeholder="Legal business name"
                      value={values.legalName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.legalName && errors.legalName)}
                      helperText={touched.legalName ? errors.legalName : undefined}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="address"
                      label="Address"
                      placeholder="789 Carrier Way, Elizabeth, NJ 07201"
                      value={values.address}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard title="Primary Contact" subtitle="Who you'll be dispatching with">
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="contactName"
                      label="Contact Name"
                      placeholder="Full name"
                      value={values.contactName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.contactName && errors.contactName)}
                      helperText={touched.contactName ? errors.contactName : undefined}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      select
                      name="contactRole"
                      label="Role / Title"
                      value={values.contactRole}
                      onChange={handleChange}
                    >
                      <MenuItem value="">—</MenuItem>
                      {CONTACT_ROLES.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="contactPhone"
                      label="Phone"
                      placeholder="(555) 123-4567"
                      type="tel"
                      value={values.contactPhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.contactPhone && errors.contactPhone)}
                      helperText={touched.contactPhone ? errors.contactPhone : undefined}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="contactEmail"
                      label="Email"
                      placeholder="contact@carrier.com"
                      type="email"
                      value={values.contactEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.contactEmail && errors.contactEmail)}
                      helperText={
                        (touched.contactEmail ? errors.contactEmail : undefined) ||
                        (mode === 'quick' ? 'Needed for onboarding invite' : undefined)
                      }
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard title="Equipment & Fleet" subtitle="What do they haul?">
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Equipment Types
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {EQUIPMENT_OPTIONS.map((equipment) => {
                      const selected = values.equipmentTypes.includes(equipment.value);

                      return (
                        <Chip
                          key={equipment.value}
                          label={selected ? `${equipment.label} ✓` : equipment.label}
                          variant={selected ? 'filled' : 'outlined'}
                          color={selected ? 'primary' : 'default'}
                          onClick={() => {
                            const next = selected
                              ? values.equipmentTypes.filter((v) => v !== equipment.value)
                              : [...values.equipmentTypes, equipment.value];
                            void setFieldValue('equipmentTypes', next);
                          }}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: selected ? 600 : 500,
                            ...(selected && {
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              borderColor: 'primary.main',
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                  {equipmentTypesError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {equipmentTypesError}
                    </Typography>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="fleetSize"
                      label="Fleet Size"
                      placeholder="e.g. 12"
                      type="number"
                      value={values.fleetSize}
                      onChange={handleChange}
                      helperText="Total trucks available"
                    />
                  </Grid>
                  <Grid item xs={6} />
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      name="notes"
                      label="Notes"
                      placeholder="e.g. Runs NJ→OH reefer lanes, has team drivers available…"
                      value={values.notes}
                      onChange={handleChange}
                      helperText="Lanes, special capabilities, anything useful"
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              {mode === 'full' && (
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
                        drivers={drivers}
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
                        drivers={drivers}
                        onSave={handleSaveVehicle}
                        onCancel={() => setEditingVehicle(null)}
                      />
                    )}

                    {showVehicleForm && !editingVehicle && (
                      <VehicleInlineForm
                        drivers={drivers}
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
              )}

              {mode === 'full' && (
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
                        vehicles={vehicles}
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
                        vehicles={vehicles}
                        onSave={handleSaveDriver}
                        onCancel={() => setEditingDriver(null)}
                      />
                    )}

                    {showDriverForm && !editingDriver && (
                      <DriverInlineForm
                        vehicles={vehicles}
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
              )}

              {mode === 'quick' && (
                <>
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
                          Send onboarding invite
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                          Carrier gets a link to upload insurance, W9, add drivers & vehicles
                        </Typography>
                      </Box>
                      <Switch
                        checked={sendInvite}
                        onChange={(_, checked) => setSendInvite(checked)}
                      />
                    </Box>
                  </Card>

                  <Collapse in={sendInvite && !values.contactEmail}>
                    <Alert
                      severity="warning"
                      icon={<WarningAmberIcon fontSize="small" />}
                      sx={{ mb: 2 }}
                    >
                      Add an email address above to send the onboarding invite.
                    </Alert>
                  </Collapse>
                </>
              )}

              {mode === 'full' && (
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
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 1,
                }}
              >
                <Typography variant="caption">
                  {mode === 'full' &&
                    `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} · ${drivers.length} driver${drivers.length !== 1 ? 's' : ''}`}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined">Cancel</Button>
                  <Button
                    variant="contained"
                    disabled={!isValid || !dirty}
                    onClick={() => handleSubmit()}
                  >
                    {submitLabel}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
};

export default CreateCarrierPage;
