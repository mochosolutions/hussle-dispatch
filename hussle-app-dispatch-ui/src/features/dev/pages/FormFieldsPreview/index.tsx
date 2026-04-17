import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import {
  TextField,
  EmailField,
  PasswordField,
  CheckboxField,
  SelectField,
  DateField,
  TimeField,
  PhoneField,
  CurrencyField,
  NumericField,
  PercentField,
  StateField,
  ZipCodeField,
  CharCounterField,
  MultiSelectChipField,
  ContentSelectorField,
} from '@mocho/ui/components/form-fields';
import {
  HomeOutlined,
  ShopOutlined,
  BankOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';

const previewSchema = Yup.object({
  // Text fields
  firstName: Yup.string().nullable(),
  lastName: Yup.string().nullable(),
  email: Yup.string().email().nullable(),
  password: Yup.string().nullable(),
  notes: Yup.string().nullable(),
  bio: Yup.string().nullable(),

  // Selections
  equipmentType: Yup.string().nullable(),
  endorsements: Yup.array().of(Yup.string()).nullable(),
  agreeToTerms: Yup.boolean(),

  // Phone
  phone: Yup.string().nullable(),
  emergencyPhone: Yup.string().nullable(),

  // Currency
  customerRate: Yup.number().nullable().min(0),
  adjustmentAmount: Yup.number().nullable(),

  // Numeric
  loadedMiles: Yup.number().nullable().min(0),
  weight: Yup.number().nullable().min(0),
  pieceCount: Yup.number().nullable(),
  gallons: Yup.number().nullable(),

  // Percent
  companyMargin: Yup.number().nullable().min(0).max(100),
  carrierPercent: Yup.number().nullable().min(0).max(100),

  // State
  licenseState: Yup.string().nullable(),
  customerState: Yup.string().nullable(),

  // ZIP
  zip: Yup.string().nullable(),
  facilityZip: Yup.string().nullable(),

  // Date
  licenseExpiry: Yup.string().nullable(),
  appointmentDate: Yup.string().nullable(),

  // Time
  appointmentTime: Yup.string().nullable(),
  facilityOpenTime: Yup.string().nullable(),

  // Content Selector
  stopType: Yup.string().nullable(),
  propertyType: Yup.string().nullable(),
  schedulingType: Yup.string().nullable(),

  // Time Ranges — Facility Hours
  facilityMonOpen: Yup.string().nullable(),
  facilityMonClose: Yup.string().nullable(),
  facilityMonClosed: Yup.boolean(),
  facilityTueOpen: Yup.string().nullable(),
  facilityTueClose: Yup.string().nullable(),
  facilityTueClosed: Yup.boolean(),
  facilityWedOpen: Yup.string().nullable(),
  facilityWedClose: Yup.string().nullable(),
  facilityWedClosed: Yup.boolean(),
  facilityThuOpen: Yup.string().nullable(),
  facilityThuClose: Yup.string().nullable(),
  facilityThuClosed: Yup.boolean(),
  facilityFriOpen: Yup.string().nullable(),
  facilityFriClose: Yup.string().nullable(),
  facilityFriClosed: Yup.boolean(),
  facilitySatOpen: Yup.string().nullable(),
  facilitySatClose: Yup.string().nullable(),
  facilitySatClosed: Yup.boolean(),
  facilitySunOpen: Yup.string().nullable(),
  facilitySunClose: Yup.string().nullable(),
  facilitySunClosed: Yup.boolean(),

  // Time Ranges — Driver HOS
  driverAvailStart: Yup.string().nullable(),
  driverAvailEnd: Yup.string().nullable(),
  driverDriveRemaining: Yup.number().nullable(),
  driverOnDutyRemaining: Yup.number().nullable(),
  driverCycleRemaining: Yup.number().nullable(),

  // Disabled variants
  disabledText: Yup.string().nullable(),
  disabledEmail: Yup.string().nullable(),
  disabledSelect: Yup.string().nullable(),
  disabledPhone: Yup.string().nullable(),
  disabledCurrency: Yup.number().nullable(),
  disabledNumeric: Yup.number().nullable(),
  disabledPercent: Yup.number().nullable(),
  disabledState: Yup.string().nullable(),
  disabledZip: Yup.string().nullable(),
  disabledDate: Yup.string().nullable(),
  disabledTime: Yup.string().nullable(),
}).required();

const EQUIPMENT_OPTIONS = [
  { value: 'DRY_VAN', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'STEP_DECK', label: 'Step Deck' },
  { value: 'BOX_TRUCK', label: 'Box Truck' },
];

const ENDORSEMENT_OPTIONS = [
  { value: 'H', label: 'H — Hazmat' },
  { value: 'N', label: 'N — Tanker' },
  { value: 'X', label: 'X — Hazmat + Tanker' },
  { value: 'T', label: 'T — Doubles/Triples' },
  { value: 'P', label: 'P — Passenger' },
  { value: 'S', label: 'S — School Bus' },
];

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
  <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
    <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {description}
    </Typography>
    <Divider sx={{ mb: 3 }} />
    {children}
  </Paper>
);

const FormFieldsPreview = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      notes: '',
      bio: '',
      equipmentType: '',
      endorsements: [],
      agreeToTerms: false,
      phone: '',
      emergencyPhone: '',
      customerRate: null,
      adjustmentAmount: null,
      loadedMiles: null,
      weight: null,
      pieceCount: null,
      gallons: null,
      companyMargin: null,
      carrierPercent: null,
      licenseState: '',
      customerState: '',
      zip: '',
      facilityZip: '',
      licenseExpiry: '',
      appointmentDate: '',
      appointmentTime: '',
      facilityOpenTime: '',
      stopType: 'PICKUP',
      propertyType: '',
      schedulingType: 'APPOINTMENT',
      facilityMonOpen: '06:00',
      facilityMonClose: '18:00',
      facilityMonClosed: false,
      facilityTueOpen: '06:00',
      facilityTueClose: '18:00',
      facilityTueClosed: false,
      facilityWedOpen: '06:00',
      facilityWedClose: '18:00',
      facilityWedClosed: false,
      facilityThuOpen: '06:00',
      facilityThuClose: '18:00',
      facilityThuClosed: false,
      facilityFriOpen: '06:00',
      facilityFriClose: '18:00',
      facilityFriClosed: false,
      facilitySatOpen: '08:00',
      facilitySatClose: '12:00',
      facilitySatClosed: false,
      facilitySunOpen: '',
      facilitySunClose: '',
      facilitySunClosed: true,
      driverAvailStart: '05:00',
      driverAvailEnd: '17:00',
      driverDriveRemaining: 8,
      driverOnDutyRemaining: 11,
      driverCycleRemaining: 54,
      disabledText: 'John Doe',
      disabledEmail: 'john@example.com',
      disabledSelect: 'DRY_VAN',
      disabledPhone: '5551234567',
      disabledCurrency: 4500,
      disabledNumeric: 42000,
      disabledPercent: 15,
      disabledState: 'TX',
      disabledZip: '90210',
      disabledDate: '2026-12-31',
      disabledTime: '14:30',
    },
    validationSchema: previewSchema,
    onSubmit: () => {},
  });

  const rawValues = JSON.stringify(formik.values, null, 2);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1060, mx: 'auto', px: 4, py: 5 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Form Fields Preview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Complete visual reference of every form field component. Interactive — type in any field.
          Raw Formik values at the bottom.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* ── Standard Text Fields ── */}
          <Section
            title="TextField"
            description="Standard text input. Supports text, number, and tel types. Multiline for textareas."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <TextField name="firstName" label="First Name" required formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="lastName" label="Last Name" formik={formik} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  multiline
                  minRows={3}
                  placeholder="Add any notes here..."
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── Email & Password ── */}
          <Section
            title="EmailField & PasswordField"
            description="Specialized text inputs for email addresses and passwords."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <EmailField
                  name="email"
                  label="Email Address"
                  placeholder="john@example.com"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <PasswordField name="password" label="Password" required formik={formik} />
              </Grid>
            </Grid>
          </Section>

          {/* ── Selection Fields ── */}
          <Section
            title="SelectField, MultiSelectChipField & CheckboxField"
            description="Dropdowns, multi-select with chips, and boolean toggles."
          >
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <SelectField
                  name="equipmentType"
                  label="Equipment Type"
                  data={EQUIPMENT_OPTIONS}
                  placeholder="Select type"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <MultiSelectChipField
                  name="endorsements"
                  label="Endorsements"
                  options={ENDORSEMENT_OPTIONS}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ pt: 3 }}>
                  <CheckboxField name="agreeToTerms" label="I agree to terms" formik={formik} />
                </Box>
              </Grid>
            </Grid>
          </Section>

          {/* ── ContentSelectorField ── */}
          <Section
            title="ContentSelectorField"
            description="Segmented toggle button group for single-choice selection. Supports text-only and icon+text variants."
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  With Icons
                </Typography>
                <ContentSelectorField
                  name="propertyType"
                  label="Property Type"
                  options={[
                    { value: 'RESIDENTIAL', label: 'Residential', icon: <HomeOutlined /> },
                    { value: 'COMMERCIAL', label: 'Commercial', icon: <ShopOutlined /> },
                    { value: 'INDUSTRIAL', label: 'Industrial', icon: <BankOutlined /> },
                  ]}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Without Icons
                </Typography>
                <ContentSelectorField
                  name="stopType"
                  label="Stop Type"
                  required
                  options={[
                    { value: 'PICKUP', label: 'Pickup' },
                    { value: 'DELIVERY', label: 'Delivery' },
                    { value: 'STOP_OFF', label: 'Stop Off' },
                    { value: 'DROP_HOOK', label: 'Drop Hook' },
                    { value: 'LIVE_UNLOAD', label: 'Live Unload' },
                  ]}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Disabled
                </Typography>
                <ContentSelectorField
                  name="schedulingType"
                  label="Scheduling Type"
                  disabled
                  options={[
                    { value: 'APPOINTMENT', label: 'Appointment' },
                    { value: 'FCFS', label: 'FCFS' },
                    { value: 'OPEN', label: 'Open' },
                  ]}
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── CharCounterField ── */}
          <Section
            title="CharCounterField"
            description="Multiline textarea with live character count display."
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <CharCounterField
                  name="bio"
                  label="Bio"
                  maxLength={200}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── PhoneField ── */}
          <Section
            title="PhoneField"
            description="Masked phone input: (###) ###-####. Stores raw digits. Phone icon adornment."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <PhoneField name="phone" label="Driver Phone" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <PhoneField
                  name="emergencyPhone"
                  label="Emergency Contact Phone"
                  required
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── CurrencyField ── */}
          <Section
            title="CurrencyField"
            description="Currency input with dollar icon, thousand separators, fixed 2 decimal places. Stores number."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <CurrencyField
                  name="customerRate"
                  label="Customer Rate"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <CurrencyField
                  name="adjustmentAmount"
                  label="Adjustment Amount"
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── NumericField ── */}
          <Section
            title="NumericField"
            description="Numeric input with number icon, thousand separators, configurable decimals, and uppercase unit suffix."
          >
            <Grid container spacing={3}>
              <Grid item xs={3}>
                <NumericField
                  name="loadedMiles"
                  label="Loaded Miles"
                  suffix="mi"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={3}>
                <NumericField
                  name="weight"
                  label="Weight"
                  suffix="lbs"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={3}>
                <NumericField name="pieceCount" label="Piece Count" formik={formik} />
              </Grid>
              <Grid item xs={3}>
                <NumericField
                  name="gallons"
                  label="Gallons"
                  decimalScale={1}
                  suffix="gal"
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── PercentField ── */}
          <Section
            title="PercentField"
            description="Percent input with % icon, clamped 0–100, 1 decimal place. Stores raw number."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <PercentField
                  name="companyMargin"
                  label="Company Margin"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <PercentField name="carrierPercent" label="Carrier %" formik={formik} />
              </Grid>
            </Grid>
          </Section>

          {/* ── StateField ── */}
          <Section
            title="StateField"
            description="US state dropdown — 50 states + DC. Shows 'TX — Texas', stores 2-letter code."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <StateField name="licenseState" label="License State" required formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <StateField name="customerState" label="Customer State" formik={formik} />
              </Grid>
            </Grid>
          </Section>

          {/* ── ZipCodeField ── */}
          <Section
            title="ZipCodeField"
            description="Masked 5-digit ZIP with location icon. Stores raw digits."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <ZipCodeField name="zip" label="ZIP Code" required formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <ZipCodeField name="facilityZip" label="Facility ZIP" formik={formik} />
              </Grid>
            </Grid>
          </Section>

          {/* ── DateField ── */}
          <Section
            title="DateField"
            description="MUI DatePicker with calendar popup. Stores ISO string (YYYY-MM-DD)."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <DateField name="licenseExpiry" label="License Expiry" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <DateField
                  name="appointmentDate"
                  label="Appointment Date"
                  required
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── TimeField ── */}
          <Section
            title="TimeField"
            description="MUI TimePicker with 30-min intervals and AM/PM. Stores 24h string (HH:mm)."
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <TimeField
                  name="appointmentTime"
                  label="Appointment Time"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <TimeField name="facilityOpenTime" label="Facility Open Time" formik={formik} />
              </Grid>
            </Grid>
          </Section>

          {/* ── Time Ranges — Facility Hours ── */}
          <Section
            title="Time Ranges — Facility Hours of Service"
            description="Weekly operating hours for a facility/warehouse. Each day has an open and close time with a closed toggle. Used on places and stop scheduling."
          >
            {[
              { day: 'Mon', key: 'facilityMon' },
              { day: 'Tue', key: 'facilityTue' },
              { day: 'Wed', key: 'facilityWed' },
              { day: 'Thu', key: 'facilityThu' },
              { day: 'Fri', key: 'facilityFri' },
              { day: 'Sat', key: 'facilitySat' },
              { day: 'Sun', key: 'facilitySun' },
            ].map(({ day, key }) => {
              const isClosed = formik.values[`${key}Closed`] as boolean;

              return (
                <Grid
                  container
                  spacing={2}
                  key={key}
                  alignItems="center"
                  sx={{
                    mb: 1.5,
                    opacity: isClosed ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Grid item xs={1.5}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, pt: 3.5 }}
                    >
                      {day}
                    </Typography>
                  </Grid>
                  <Grid item xs={3.5}>
                    <TimeField
                      name={`${key}Open`}
                      label="Opens"
                      disabled={isClosed}
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={0.5} sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  </Grid>
                  <Grid item xs={3.5}>
                    <TimeField
                      name={`${key}Close`}
                      label="Closes"
                      disabled={isClosed}
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ pt: 3 }}>
                      <CheckboxField
                        name={`${key}Closed`}
                        label="Closed"
                        formik={formik}
                      />
                    </Box>
                  </Grid>
                </Grid>
              );
            })}
          </Section>

          {/* ── Time Ranges — Driver HOS ── */}
          <Section
            title="Time Ranges — Driver Hours of Service"
            description="Driver availability window and remaining HOS hours. Available start/end defines the daily window. Remaining hours track FMCSA compliance (drive, on-duty, 70h cycle)."
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Availability Window
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <TimeField
                  name="driverAvailStart"
                  label="Available From"
                  required
                  formik={formik}
                />
              </Grid>
              <Grid
                item
                xs={1}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: 3 }}
              >
                <Typography variant="body2" color="text.secondary">
                  to
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <TimeField
                  name="driverAvailEnd"
                  label="Available Until"
                  required
                  formik={formik}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Remaining HOS Hours
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <NumericField
                  name="driverDriveRemaining"
                  label="Drive Time Left"
                  suffix="hrs"
                  decimalScale={1}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <NumericField
                  name="driverOnDutyRemaining"
                  label="On-Duty Left"
                  suffix="hrs"
                  decimalScale={1}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <NumericField
                  name="driverCycleRemaining"
                  label="70h Cycle Left"
                  suffix="hrs"
                  decimalScale={1}
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── Disabled States ── */}
          <Section
            title="Disabled States"
            description="Every field type in its disabled state with pre-filled values. cursor: not-allowed, muted background."
          >
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <TextField
                  name="disabledText"
                  label="Name (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <EmailField
                  name="disabledEmail"
                  label="Email (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <SelectField
                  name="disabledSelect"
                  label="Equipment (disabled)"
                  data={EQUIPMENT_OPTIONS}
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <PhoneField
                  name="disabledPhone"
                  label="Phone (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <CurrencyField
                  name="disabledCurrency"
                  label="Rate (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <NumericField
                  name="disabledNumeric"
                  label="Weight (disabled)"
                  suffix="lbs"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <PercentField
                  name="disabledPercent"
                  label="Margin (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <StateField
                  name="disabledState"
                  label="State (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={4}>
                <ZipCodeField
                  name="disabledZip"
                  label="ZIP (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <DateField
                  name="disabledDate"
                  label="Date (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <TimeField
                  name="disabledTime"
                  label="Time (disabled)"
                  disabled
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Section>

          {/* ── Raw Formik Values ── */}
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
              Raw Formik Values
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              What gets stored and submitted — no formatting artifacts. This is what the API
              receives.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              component="pre"
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'grey.100',
                fontSize: 13,
                fontFamily: 'monospace',
                overflow: 'auto',
                maxHeight: 400,
              }}
            >
              {rawValues}
            </Box>
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FormFieldsPreview;
