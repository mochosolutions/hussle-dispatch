import React from 'react';
import { Formik, Form } from 'formik';
import { Box, TextField, Button, Stack, CircularProgress } from '@mui/material';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { vehicleTargetsSchema } from '../../validators/vehicleTargetsSchema';
import type { Vehicle, UpdateVehicleInput } from 'features/carrier/types';

interface VehicleTargetsDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Vehicle;
  onSave: (values: UpdateVehicleInput) => void;
}

export const VehicleTargetsDrawer: React.FC<VehicleTargetsDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Vehicle Targets"
    subtitle={data.unitNumber}
  >
    <Formik
      initialValues={{
        monthlyGrossTarget: data.monthlyGrossTarget ?? '',
        monthlyMilesTarget: data.monthlyMilesTarget ?? '',
        workingDaysPerMonth: data.workingDaysPerMonth ?? '',
      }}
      validationSchema={vehicleTargetsSchema}
      onSubmit={(values, { setSubmitting }) => {
        const transformed: UpdateVehicleInput = {
          monthlyGrossTarget: values.monthlyGrossTarget !== '' ? String(values.monthlyGrossTarget) : null,
          monthlyMilesTarget: values.monthlyMilesTarget !== '' ? Number(values.monthlyMilesTarget) : null,
          workingDaysPerMonth: values.workingDaysPerMonth !== '' ? Number(values.workingDaysPerMonth) : null,
        };
        onSave(transformed);
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
        <Form>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              name="monthlyGrossTarget"
              label="Monthly Gross Target ($)"
              value={values.monthlyGrossTarget}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.monthlyGrossTarget && Boolean(errors.monthlyGrossTarget)}
              helperText={touched.monthlyGrossTarget && errors.monthlyGrossTarget}
            />
            <TextField
              fullWidth
              name="monthlyMilesTarget"
              label="Monthly Miles Target"
              value={values.monthlyMilesTarget}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.monthlyMilesTarget && Boolean(errors.monthlyMilesTarget)}
              helperText={touched.monthlyMilesTarget && errors.monthlyMilesTarget}
            />
            <TextField
              fullWidth
              name="workingDaysPerMonth"
              label="Working Days Per Month"
              value={values.workingDaysPerMonth}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.workingDaysPerMonth && Boolean(errors.workingDaysPerMonth)}
              helperText={touched.workingDaysPerMonth && errors.workingDaysPerMonth}
            />

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
                {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Form>
      )}
    </Formik>
  </EditDrawer>
);
