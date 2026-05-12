import React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, EmailField, PhoneField, AddressField } from '../../../../mocho/components';
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
    lat: carrier.lat ?? null,
    lng: carrier.lng ?? null,
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
          <AddressField
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
            onResolve={(r, f) => {
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
