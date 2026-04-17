import React from 'react';
import { Alert, Grid, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField, CheckboxField } from '@mocho/ui/components';
import { PercentSharp } from '@mui/icons-material';
import { DrawerSection } from 'components/EditDrawer';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { useDispatch } from 'store';
import { assignLoadRequest } from '../../store/reducers';
import type { LoadDetail, LoadStatus } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';

const FINANCIALS_LOCKED_STATUSES: LoadStatus[] = [
  'DISPATCHED',
  'AT_PICKUP',
  // 'LOADED',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICED',
  'INVOICE_PENDING',
  'PAID',
];

const assignmentSchema = Yup.object().shape({
  carrierId: Yup.string(),
  driverId: Yup.string(),
  vehicleId: Yup.string(),
  customerRate: Yup.number().min(0).nullable(),
  carrierPayout: Yup.number().min(0).nullable(),
  companyMargin: Yup.number().min(0).nullable(),
  isTeamDriver: Yup.boolean(),
});

type AssignmentFormValues = Yup.InferType<typeof assignmentSchema>;

interface LoadAssignmentDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadAssignmentDrawer: React.FC<LoadAssignmentDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();
  const financialsLocked = FINANCIALS_LOCKED_STATUSES.includes(load.status);

  const initialValues: AssignmentFormValues = {
    carrierId: load.assignment.carrier?.id ?? undefined,
    driverId: load.assignment.driver?.id ?? undefined,
    vehicleId: load.assignment.vehicle?.id ?? undefined,
    customerRate: load.financials.customerRate ? Number(load.financials.customerRate) : undefined,
    carrierPayout: load.financials.carrierPayout ? Number(load.financials.carrierPayout) : undefined,
    companyMargin: load.financials.companyMargin ? Number(load.financials.companyMargin) : undefined,
    isTeamDriver: load.assignment.isTeamDriver,
  };

  const handleSubmit = (values: AssignmentFormValues) => {
    dispatch(
      assignLoadRequest({
        loadId: load.id,
        data: {
          carrierId: values.carrierId,
          driverId: values.driverId,
          vehicleId: values.vehicleId,
          // customerRate: values.customerRate ?? undefined,
          // carrierPayout: values.carrierPayout ?? undefined,
          // companyMargin: values.companyMargin ?? undefined,
          // isTeamDriver: values.isTeamDriver,
        },
      }),
    );
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Assignment"
      subtitle={load.loadNumber}
      initialValues={initialValues}
      validationSchema={assignmentSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack
          // spacing={2.5}
          sx={{ p: 3 }}
        >
          <DrawerSection label="Assignment">
            <Grid container spacing={1}>
              <AssignmentFieldGroup formik={formik} />
            </Grid>
            {/* <CheckboxField name="isTeamDriver" label="Team Driver" formik={formik} /> */}
          </DrawerSection>

          {/*  <DrawerSection label="Rate">
            {financialsLocked && (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                Financial fields are locked after dispatch
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="customerRate"
                  label="Customer Rate"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="carrierPayout"
                  label="Carrier Payout"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="companyMargin"
                  label="Company Margin"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="companyNet"
                  label="Company Net"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
            </Grid>
          </DrawerSection> */}
        </Stack>
      )}
    </FormDrawer>
  );
};
