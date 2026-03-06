import React from 'react';
import { Formik, Form } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import { EditDrawer } from '../../components/EditDrawer';
import { companyInfoSchema } from '../../validators/fleetSchema';
import { EQUIPMENT_OPTIONS } from '../../constants';
import { CarrierData } from '../../types';

export const CompanyInfoDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  data: CarrierData;
  onSave: (values: Partial<CarrierData>) => void;
}> = ({ open, onClose, data, onSave }) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Company Information"
    subtitle={data.legalName}
  >
    <Formik
      initialValues={{
        legalName: data.legalName,
        mcNumber: data.mcNumber,
        dotNumber: data.dotNumber,
        address: data.address,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        equipmentTypes: data.equipmentTypes,
      }}
      validationSchema={companyInfoSchema}
      onSubmit={(values, { setSubmitting }) => {
        // In production: dispatch API call here
        setTimeout(() => {
          onSave(values);
          setSubmitting(false);
          onClose();
        }, 600);
      }}
      enableReinitialize
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        setFieldValue,
        isSubmitting,
        isValid,
        dirty,
      }) => (
        <Form>
          <Stack spacing={2.5}>
            {/* Company Details */}
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
                letterSpacing: 0.5,
              }}
            >
              Company Details
            </Typography>
            <TextField
              fullWidth
              name="legalName"
              label="Legal Name"
              value={values.legalName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.legalName && Boolean(errors.legalName)}
              helperText={touched.legalName && errors.legalName}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="mcNumber"
                  label="MC Number"
                  value={values.mcNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.mcNumber && Boolean(errors.mcNumber)}
                  helperText={touched.mcNumber && errors.mcNumber}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="dotNumber"
                  label="DOT Number"
                  value={values.dotNumber}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              name="address"
              label="Address"
              value={values.address}
              onChange={handleChange}
            />

            <Divider sx={{ my: 0.5 }} />

            {/* Contact Info */}
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
                letterSpacing: 0.5,
              }}
            >
              Primary Contact
            </Typography>
            <TextField
              fullWidth
              name="contactName"
              label="Contact Name"
              value={values.contactName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.contactName && Boolean(errors.contactName)}
              helperText={touched.contactName && errors.contactName}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="contactPhone"
                  label="Phone"
                  type="tel"
                  value={values.contactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.contactPhone && Boolean(errors.contactPhone)}
                  helperText={touched.contactPhone && errors.contactPhone}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="contactEmail"
                  label="Email"
                  type="email"
                  value={values.contactEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.contactEmail && Boolean(errors.contactEmail)}
                  helperText={touched.contactEmail && errors.contactEmail}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* Equipment */}
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
                letterSpacing: 0.5,
              }}
            >
              Equipment Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = values.equipmentTypes.includes(eq.value);
                return (
                  <Chip
                    key={eq.value}
                    label={selected ? `${eq.label} ✓` : eq.label}
                    variant={selected ? 'filled' : 'outlined'}
                    color={selected ? 'primary' : 'default'}
                    onClick={() => {
                      const next = selected
                        ? values.equipmentTypes.filter((v) => v !== eq.value)
                        : [...values.equipmentTypes, eq.value];
                      setFieldValue('equipmentTypes', next);
                    }}
                    sx={{ cursor: 'pointer', fontWeight: selected ? 600 : 500 }}
                  />
                );
              })}
            </Box>
            {touched.equipmentTypes && errors.equipmentTypes && (
              <Typography variant="caption" color="error">
                {errors.equipmentTypes as string}
              </Typography>
            )}

            {/* Footer */}
            <Box
              sx={{
                pt: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                mt: 1,
              }}
            >
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || !dirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Form>
      )}
    </Formik>
  </EditDrawer>
);
