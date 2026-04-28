import React from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  Stack,
  TextField as MuiTextField,
} from '@mui/material';
import {
  TextField,
  SelectField,
  EmailField,
  DateField,
  PhoneField,
  StateField,
} from '@mocho/ui/components';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch, useSelector } from 'store';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import { createDriverRequest, updateDriverRequest } from '../../store/reducers';
import {
  DRIVER_LICENSE_TYPE_OPTIONS,
  ENDORSEMENT_OPTIONS,
} from 'features/carrier/types';
import type { DriverPayType, EndorsementCode } from 'features/carrier/types';
import { PAY_TYPE_OPTIONS } from '../../constants';

const toDriverPayType = (val: string): DriverPayType => {
  if (val === 'PERCENTAGE' || val === 'PER_MILE' || val === 'PER_HOUR' || val === 'FLAT_RATE') {
    return val;
  }
  return 'PERCENTAGE';
};
import CarrierAutocomplete from 'features/carrier/components/CarrierAutocomplete';
import { selectDriverWithCarrier } from '../../store/selectors/driverSelectors';

interface DriverFormDrawerProps {
  driverId?: string;
  initialCarrierId?: string;
  onClose: () => void;
}

const EMPTY_VALUES = {
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
  payType: 'PERCENTAGE' as DriverPayType,
  payRate: 30 as number,
  notes: '',
};

export const DriverFormDrawer: React.FC<DriverFormDrawerProps> = ({
  driverId,
  initialCarrierId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const isEditing = Boolean(driverId);
  const driverSelector = React.useMemo(
    () => (driverId ? selectDriverWithCarrier(driverId) : () => undefined),
    [driverId],
  );
  const driver = useSelector(driverSelector);

  if (isEditing && !driver) {
    return null;
  }

  const initialValues =
    isEditing && driver
      ? {
          carrierId: driver.carrierId ?? null,
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone ?? '',
          email: driver.email ?? '',
          licenseType: driver.licenseType ?? 'CLASS_D',
          licenseNumber: driver.licenseNumber ?? '',
          licenseState: driver.licenseState ?? '',
          licenseExpiry: driver.licenseExpiry ?? '',
          endorsements: driver.endorsements ?? ([] as EndorsementCode[]),
          homeBaseCity: driver.homeBaseCity ?? '',
          homeBaseState: driver.homeBaseState ?? '',
          payType: (driver.payType ?? 'PERCENTAGE') as DriverPayType,
          payRate: driver.payRate ?? 30,
          notes: driver.notes ?? '',
        }
      : {
          ...EMPTY_VALUES,
          ...(initialCarrierId ? { carrierId: initialCarrierId } : {}),
        };

  const handleSubmit = (values: typeof initialValues) => {
    const payType = toDriverPayType(String(values.payType));
    const payRate = parseFloat(String(values.payRate));

    if (isEditing && driverId) {
      dispatch(updateDriverRequest({ id: driverId, data: { ...values, payType, payRate } }));
    } else {
      dispatch(
        createDriverRequest({
          data: {
            ...values,
            carrierId: values.carrierId || null,
            homeBaseCity: values.homeBaseCity || null,
            homeBaseState: values.homeBaseState || null,
            payType,
            payRate,
          },
        }),
      );
    }
  };

  const subtitle = isEditing && driver ? getDriverDisplayName(driver) : undefined;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title={isEditing ? 'Edit Driver Information' : 'Create Driver'}
      subtitle={subtitle}
      initialValues={initialValues}
      validationSchema={driverInfoSchema}
      onSubmit={handleSubmit}
      saveLabel={isEditing ? 'Save Changes' : 'Create'}
      savingLabel={isEditing ? 'Saving\u2026' : 'Creating\u2026'}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          {!isEditing && <CarrierAutocomplete formik={formik} />}

          <DrawerSection label="Personal Info">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="firstName" label="First Name" formik={formik} required />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField name="lastName" label="Last Name" formik={formik} required />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <PhoneField name="phone" label="Phone" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <EmailField name="email" label="Email" formik={formik} />
              </Box>
            </Box>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          <DrawerSection label="License Information">
            <SelectField
              name="licenseType"
              label="License Type"
              data={DRIVER_LICENSE_TYPE_OPTIONS}
              formik={formik}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="licenseNumber" label="License Number" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StateField name="licenseState" label="License State" formik={formik} />
              </Box>
            </Box>
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="homeBaseCity" label="City" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StateField name="homeBaseState" label="State" formik={formik} />
              </Box>
            </Box>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          <DrawerSection label="Compensation">
            <SelectField
              name="payType"
              label="Pay Type"
              data={PAY_TYPE_OPTIONS}
              formik={formik}
              required
            />
            <TextField name="payRate" label="Pay Rate" formik={formik} type="number" required />
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          <DrawerSection label="Notes">
            <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
