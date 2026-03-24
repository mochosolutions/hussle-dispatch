import React from 'react';
import { Alert, Box, Button, Grid, Stack, CircularProgress } from '@mui/material';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { TextField, CheckboxField } from '@mocho/ui/components';
import { EditDrawer, DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail, LoadStatus } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';

const FINANCIALS_LOCKED_STATUSES: LoadStatus[] = [
  'DISPATCHED',
  'AT_PICKUP',
  'LOADED',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'POD_RECEIVED',
  'INVOICED',
  'PAID',
  'COMPLETE',
];

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
    carrierId: load.carrierId ?? undefined,
    driverId: load.driverId ?? undefined,
    vehicleId: load.vehicleId ?? undefined,
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
      <LoadAssignmentDrawerContent loadNumber={load.loadNumber} loadStatus={load.status} onClose={onClose} />
    </Formik>
  );
};

interface LoadAssignmentDrawerContentProps {
  loadNumber: string;
  loadStatus: LoadStatus;
  onClose: () => void;
}

const LoadAssignmentDrawerContent: React.FC<LoadAssignmentDrawerContentProps> = ({
  loadNumber,
  loadStatus,
  onClose,
}) => {
  const financialsLocked = FINANCIALS_LOCKED_STATUSES.includes(loadStatus);
  const assignmentFormik = useFormikContext<AssignmentFormValues>();
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
  } = assignmentFormik as unknown as ReturnType<typeof useFormikContext<Record<string, unknown>>>;

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
          <DrawerSection label="Assignment">
            <Grid container spacing={2}>
              <AssignmentFieldGroup formik={assignmentFormik} />
            </Grid>
            <CheckboxField name="isTeamDriver" label="Team Driver" formik={formikProps} />
          </DrawerSection>

          <DrawerSection label="Rate">
            {financialsLocked && (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                Financial fields are locked after dispatch
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="customerRate" label="Customer Rate" formik={formikProps} disabled={financialsLocked} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="carrierRate" label="Carrier Rate" formik={formikProps} disabled={financialsLocked} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="dispatchFee" label="Dispatch Fee" formik={formikProps} disabled={financialsLocked} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="partnerSplit" label="Partner Split" formik={formikProps} disabled={financialsLocked} />
              </Grid>
            </Grid>
          </DrawerSection>
        </Stack>
      </Form>
    </EditDrawer>
  );
};
