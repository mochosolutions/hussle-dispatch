import React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, EmailField, PhoneField, StateField, ZipCodeField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { SectionLabel } from 'components/Typography';
import { companyInfoSchema } from '../../validators/fleetSchema';
import { selectCarrierById } from '../../store/selectors/carrierSelectors';
import { updateCarrierRequest } from '../../store/reducers';

interface CompanyInfoDrawerProps {
  carrierId: string;
  onClose: () => void;
}

export const CompanyInfoDrawer: React.FC<CompanyInfoDrawerProps> = ({ carrierId, onClose }) => {
  const dispatch = useDispatch();
  const carrier = useSelector(selectCarrierById(carrierId));

  if (!carrier) {
    return null;
  }

  const initialValues = {
    name: carrier.name,
    mcNumber: carrier.mcNumber ?? '',
    dotNumber: carrier.dotNumber ?? '',
    ein: carrier.ein ?? '',
    phone: carrier.phone ?? '',
    email: carrier.email ?? '',
    address: carrier.address ?? '',
    city: carrier.city ?? '',
    state: carrier.state ?? '',
    zip: carrier.zip ?? '',
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Company Information"
      subtitle={carrier.name}
      initialValues={initialValues}
      validationSchema={companyInfoSchema}
      onSubmit={(values) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
      }}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <SectionLabel>Company Details</SectionLabel>
          <TextField name="name" label="Legal Name" formik={formik} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField name="mcNumber" label="MC Number" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField name="dotNumber" label="DOT Number" formik={formik} />
            </Box>
          </Box>
          <TextField name="ein" label="EIN" formik={formik} />
          <TextField name="address" label="Address" formik={formik} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 5 }}>
              <TextField name="city" label="City" formik={formik} />
            </Box>
            <Box sx={{ flex: 3 }}>
              <StateField name="state" label="State" formik={formik} />
            </Box>
            <Box sx={{ flex: 4 }}>
              <ZipCodeField name="zip" label="ZIP" formik={formik} />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Primary Contact</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <PhoneField name="phone" label="Phone" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <EmailField name="email" label="Email" formik={formik} />
            </Box>
          </Box>
        </Stack>
      )}
    </FormDrawer>
  );
};
