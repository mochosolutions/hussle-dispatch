import React from 'react';
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { TextField, CheckboxField } from '@mocho/ui/components';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail } from '../../types';

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const assignmentSchema = Yup.object().shape({
  carrierId: Yup.string(),
  driverId: Yup.string(),
  vehicleId: Yup.string(),
  customerRate: Yup.number().min(0).nullable(),
  carrierRate: Yup.number().min(0).nullable(),
  dispatchFee: Yup.number().min(0).nullable(),
  partnerSplit: Yup.number().min(0).nullable(),
  isTeamDriver: Yup.boolean(),
});

type AssignmentFormValues = Yup.InferType<typeof assignmentSchema>;

interface LoadAssignmentDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadAssignmentDrawer: React.FC<LoadAssignmentDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: AssignmentFormValues = {
    carrierId: load.carrierId ?? '',
    driverId: load.driverId ?? '',
    vehicleId: load.vehicleId ?? '',
    customerRate: load.customerRate ? Number(load.customerRate) : undefined,
    carrierRate: load.carrierRate ? Number(load.carrierRate) : undefined,
    dispatchFee: load.dispatchFee ? Number(load.dispatchFee) : undefined,
    partnerSplit: load.partnerSplit ? Number(load.partnerSplit) : undefined,
    isTeamDriver: load.isTeamDriver,
  };

  const handleSubmit = (values: AssignmentFormValues) => {
    dispatch(
      updateLoadRequest({
        id: load.id,
        data: values,
      }),
    );
    onClose();
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={assignmentSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      <LoadAssignmentDrawerContent loadNumber={load.loadNumber} onClose={onClose} />
    </Formik>
  );
};

interface LoadAssignmentDrawerContentProps {
  loadNumber: string;
  onClose: () => void;
}

const LoadAssignmentDrawerContent: React.FC<LoadAssignmentDrawerContentProps> = ({
  loadNumber,
  onClose,
}) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    isSubmitting,
    isValid,
    dirty,
  } = useFormikContext<Record<string, unknown>>();

  const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="load-assignment-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Edit Assignment"
      subtitle={loadNumber}
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="load-assignment-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Assignment
          </Typography>
          <TextField name="carrierId" label="Carrier" formik={formikProps} />
          <TextField name="driverId" label="Driver" formik={formikProps} />
          <TextField name="vehicleId" label="Vehicle" formik={formikProps} />
          <CheckboxField name="isTeamDriver" label="Team Driver" formik={formikProps} />

          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Rate
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="customerRate" label="Customer Rate" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="carrierRate" label="Carrier Rate" formik={formikProps} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="dispatchFee" label="Dispatch Fee" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="partnerSplit" label="Partner Split" formik={formikProps} />
            </Grid>
          </Grid>
        </Stack>
      </Form>
    </EditDrawer>
  );
};
