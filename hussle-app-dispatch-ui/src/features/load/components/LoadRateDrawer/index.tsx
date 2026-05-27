import React from 'react';
import { Alert, Stack } from '@mui/material';
import * as Yup from 'yup';
import { CurrencyField } from '@mocho/ui/components';
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
          customerRate: values.customerRate ?? undefined,
          carrierPayout: values.carrierPayout ?? undefined,
          companyMargin: values.companyMargin ?? undefined,
        },
      }),
    );
    onClose();
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
            <CurrencyField
              name="customerRate"
              label="Customer Rate"
              formik={formik}
              disabled={financialsLocked}
            />
            <CurrencyField
              name="carrierPayout"
              label="Carrier Payout"
              formik={formik}
              disabled={financialsLocked}
            />
            <CurrencyField
              name="companyMargin"
              label="Company Margin"
              formik={formik}
              disabled={financialsLocked}
            />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
