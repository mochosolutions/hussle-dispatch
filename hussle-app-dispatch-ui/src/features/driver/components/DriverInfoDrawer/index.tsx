import React from 'react';
import {
  Autocomplete,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField as MuiTextField,
} from '@mui/material';
import { TextField, SelectField, EmailField, DateField } from '../../../../mocho/components';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import {
  DRIVER_LICENSE_TYPE_OPTIONS,
  ENDORSEMENT_OPTIONS,
} from 'features/carrier/types';
import type { EndorsementCode } from 'features/carrier/types';
import type { Driver, UpdateDriverInput } from 'features/carrier/types';

interface DriverInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Driver;
  onSave: (values: UpdateDriverInput) => void;
}

export const DriverInfoDrawer: React.FC<DriverInfoDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <FormDrawer
    open={open}
    onClose={onClose}
    title="Edit Driver Information"
    subtitle={getDriverDisplayName(data)}
    initialValues={{
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '',
      email: data.email ?? '',
      licenseType: data.licenseType ?? 'CLASS_D',
      licenseNumber: data.licenseNumber ?? '',
      licenseState: data.licenseState ?? '',
      licenseExpiry: data.licenseExpiry ?? '',
      endorsements: data.endorsements ?? ([] as EndorsementCode[]),
      homeBaseCity: data.homeBaseCity ?? '',
      homeBaseState: data.homeBaseState ?? '',
      notes: data.notes ?? '',
    }}
    validationSchema={driverInfoSchema}
    onSubmit={(values) => {
      onSave(values);
    }}
  >
    {(formik) => (
      <Stack spacing={2.5} sx={{ p: 3 }}>
        <DrawerSection label="Personal Info">
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="firstName" label="First Name" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="lastName" label="Last Name" formik={formik} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="email" label="Email" formik={formik} />
            </Grid>
          </Grid>
        </DrawerSection>

        <Divider sx={{ my: 0.5 }} />

        <DrawerSection label="License Information">
          <SelectField
            name="licenseType"
            label="License Type"
            data={DRIVER_LICENSE_TYPE_OPTIONS}
            formik={formik}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="licenseNumber" label="License Number" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="licenseState" label="License State" formik={formik} />
            </Grid>
          </Grid>
          <DateField name="licenseExpiry" label="License Expiry" formik={formik} />
          {String(formik.values.licenseType).startsWith('CDL_') && (
            <Autocomplete
              multiple
              options={ENDORSEMENT_OPTIONS}
              getOptionLabel={(opt) => `${opt.value} — ${opt.label}`}
              value={ENDORSEMENT_OPTIONS.filter((o) =>
                ((formik.values.endorsements as EndorsementCode[]) ?? []).includes(o.value),
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
        </DrawerSection>

        <Divider sx={{ my: 0.5 }} />

        <DrawerSection label="Home Base">
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="homeBaseCity" label="City" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="homeBaseState" label="State" formik={formik} />
            </Grid>
          </Grid>
        </DrawerSection>

        <Divider sx={{ my: 0.5 }} />

        <DrawerSection label="Notes">
          <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
        </DrawerSection>
      </Stack>
    )}
  </FormDrawer>
);
