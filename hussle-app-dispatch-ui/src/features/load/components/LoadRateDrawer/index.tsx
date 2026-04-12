import React from 'react';
import { Alert, Grid, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField } from '@mocho/ui/components';
import { PercentSharp } from '@mui/icons-material';
import { DrawerSection } from 'components/EditDrawer';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { useDispatch } from 'store';
import { assignLoadRequest } from '../../store/reducers';
import type { LoadDetail, LoadStatus } from '../../types';

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

interface LoadRateDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadRateDrawer: React.FC<LoadRateDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();
  const financialsLocked = FINANCIALS_LOCKED_STATUSES.includes(load.status);

  const initialValues: AssignmentFormValues = {
    // carrierId: load.carrierId ?? undefined,
    // driverId: load.driverId ?? undefined,
    // vehicleId: load.vehicleId ?? undefined,
    customerRate: load.customerRate ? Number(load.customerRate) : undefined,
    carrierPayout: load.carrierPayout ? Number(load.carrierPayout) : undefined,
    companyMargin: load.companyMargin ? Number(load.companyMargin) : undefined,
    isTeamDriver: load.isTeamDriver,
  };

  const handleSubmit = (values: AssignmentFormValues) => {
    console.log('Submitting values:', values);
    // dispatch(
    //   assignLoadRequest({
    //     loadId: load.id,
    //     data: {
    //       customerRate: values.customerRate ?? undefined,
    //       carrierPayout: values.carrierPayout ?? undefined,
    //       companyMargin: values.companyMargin ?? undefined,
    //     },
    //   }),
    // );
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Rates"
      subtitle={load.loadNumber}
      initialValues={initialValues}
      validationSchema={assignmentSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack sx={{ p: 3 }}>
          <DrawerSection label="Rate">
            {financialsLocked && (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                Financial fields are locked after dispatch
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="customerRate"
                  label="Customer Rate"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="carrierPayout"
                  label="Carrier Payout"
                  formik={formik}
                  disabled={financialsLocked}
                  endAdornment={
                    <PercentSharp
                      fontSize="small"
                      // sx={{ color: 'text.secondary', mr: 1 }}
                    />
                  }
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="companyMargin"
                  label="Company Margin"
                  formik={formik}
                  disabled={financialsLocked}
                />
              </Grid>
            </Grid>
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
