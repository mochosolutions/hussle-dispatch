import React, { useCallback, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Button, Grid, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField, CheckboxField } from '@mocho/ui/components';
import { PercentSharp } from '@mui/icons-material';
import { DrawerSection } from 'components/EditDrawer';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { useDispatch, useSelector } from 'store';
import { isAdminSelector } from 'features/auth/store/selectors/authSelector';
import { assignLoadRequest } from '../../store/reducers';
import { selectAssignBlockers } from '../../store/selectors/loadSelectors';
import type { AssignLoadInput, LoadDetail, LoadStatus } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';
import { OverrideDispatchDialog } from '../OverrideDispatchDialog';

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
  dispatcherUserId: Yup.string().required('Dispatcher is required'),
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
  const isAdmin = useSelector(isAdminSelector);
  const assignBlockers = useSelector(selectAssignBlockers(load.id));
  const financialsLocked = FINANCIALS_LOCKED_STATUSES.includes(load.status);
  // Preserve the exact last-submitted assign payload so an admin override
  // re-submits the identical request plus the two override fields.
  const lastSubmittedDataRef = useRef<AssignLoadInput | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const initialValues: AssignmentFormValues = {
    carrierId: load.assignment.carrier?.id ?? undefined,
    driverId: load.assignment.driver?.id ?? undefined,
    vehicleId: load.assignment.vehicle?.id ?? undefined,
    dispatcherUserId: load.assignment.dispatcher?.id ?? '',
    customerRate: load.financials.customerRate ? Number(load.financials.customerRate) : undefined,
    carrierPayout: load.financials.carrierPayout ? Number(load.financials.carrierPayout) : undefined,
    companyMargin: load.financials.companyMargin ? Number(load.financials.companyMargin) : undefined,
    isTeamDriver: load.assignment.isTeamDriver,
  };

  const handleSubmit = (values: AssignmentFormValues) => {
    const data: AssignLoadInput = {
      carrierId: values.carrierId,
      driverId: values.driverId,
      vehicleId: values.vehicleId,
      dispatcherUserId: values.dispatcherUserId,
      // customerRate: values.customerRate ?? undefined,
      // carrierPayout: values.carrierPayout ?? undefined,
      // companyMargin: values.companyMargin ?? undefined,
      // isTeamDriver: values.isTeamDriver,
    };
    lastSubmittedDataRef.current = data;
    dispatch(assignLoadRequest({ loadId: load.id, data }));
  };

  const handleOverrideConfirm = useCallback(
    (reason: string) => {
      const original = lastSubmittedDataRef.current;
      if (!original) {
        return;
      }
      setOverrideDialogOpen(false);
      const data: AssignLoadInput = {
        ...original,
        overrideDispatch: true,
        overrideReason: reason,
      };
      lastSubmittedDataRef.current = data;
      dispatch(assignLoadRequest({ loadId: load.id, data }));
    },
    [dispatch, load.id],
  );

  const canOverrideAssign =
    isAdmin && assignBlockers.length > 0 && assignBlockers.every((blocker) => blocker.overridable);

  return (
    <>
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
          {assignBlockers.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Cannot dispatch this load</AlertTitle>
              <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                {assignBlockers.map((blocker) => (
                  <li key={blocker.code}>{blocker.message}</li>
                ))}
              </Box>
              {canOverrideAssign && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ mt: 1.5 }}
                  onClick={() => setOverrideDialogOpen(true)}
                >
                  Override & dispatch anyway
                </Button>
              )}
            </Alert>
          )}
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
      <OverrideDispatchDialog
        open={overrideDialogOpen}
        blockers={assignBlockers}
        onConfirm={handleOverrideConfirm}
        onCancel={() => setOverrideDialogOpen(false)}
      />
    </>
  );
};
