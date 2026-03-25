import React from 'react';
import {
  Autocomplete,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { TextField, SelectField } from '@mocho/ui/components';
import { useDispatch } from 'store';
import { createDriverRequest } from '../../store/reducers';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import {
  DRIVER_LICENSE_TYPE_OPTIONS,
  ENDORSEMENT_OPTIONS,
} from 'features/carrier/types';
import type { EndorsementCode } from 'features/carrier/types';
import CarrierAutocomplete from 'features/carrier/components/CarrierAutocomplete';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';

interface DriverCreateDrawerProps {
  onClose: () => void;
  initialCarrierId?: string;
}

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const INITIAL_VALUES = {
  carrierId: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  licenseType: 'CLASS_D' as const,
  licenseNumber: '',
  licenseState: '',
  licenseExpiry: '',
  endorsements: [] as EndorsementCode[],
  homeBaseCity: '',
  homeBaseState: '',
};

export const DriverCreateDrawer: React.FC<DriverCreateDrawerProps> = ({
  onClose,
  initialCarrierId,
}) => {
  const dispatch = useDispatch();

  const initialValues = initialCarrierId
    ? { ...INITIAL_VALUES, carrierId: initialCarrierId }
    : INITIAL_VALUES;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Create Driver"
      initialValues={initialValues}
      validationSchema={driverInfoSchema}
      onSubmit={(values) => {
        dispatch(
          createDriverRequest({
            data: {
              ...values,
              carrierId: values.carrierId || null,
              homeBaseCity: values.homeBaseCity || null,
              homeBaseState: values.homeBaseState || null,
            },
          }),
        );
      }}
      saveLabel="Create"
      savingLabel="Creating…"
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <CarrierAutocomplete
            value={formik.values.carrierId}
            onChange={(carrierId) => {
              void formik.setFieldValue('carrierId', carrierId);
            }}
            onBlur={() => {
              void formik.setFieldTouched('carrierId', true);
            }}
            label="Carrier"
          />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Personal Info
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="firstName" label="First Name" formik={formik} required />
            </Grid>
            <Grid item xs={6}>
              <TextField name="lastName" label="Last Name" formik={formik} required />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="email" label="Email" formik={formik} />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            License Information
          </Typography>
          <SelectField name="licenseType" label="License Type" formik={formik} required>
            {DRIVER_LICENSE_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </SelectField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="licenseNumber" label="License Number" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="licenseState" label="License State" formik={formik} />
            </Grid>
          </Grid>
          <TextField name="licenseExpiry" label="License Expiry" formik={formik} />
          {formik.values.licenseType.startsWith('CDL_') && (
            <Autocomplete
              multiple
              options={ENDORSEMENT_OPTIONS}
              getOptionLabel={(opt) => `${opt.value} — ${opt.label}`}
              value={ENDORSEMENT_OPTIONS.filter((o) =>
                (formik.values.endorsements ?? []).includes(o.value),
              )}
              onChange={(_, selected) => {
                void formik.setFieldValue(
                  'endorsements',
                  selected.map((s) => s.value),
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.value}
                    label={option.value}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => <MuiTextField {...params} label="Endorsements" />}
            />
          )}

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Home Base
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="homeBaseCity" label="City" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="homeBaseState" label="State" formik={formik} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </FormDrawer>
  );
};
