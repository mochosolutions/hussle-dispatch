import React from 'react';
import { Stack } from '@mui/material';
import { BodyMuted } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import {
  CheckboxField,
  CurrencyField,
  PercentField,
  SelectField,
} from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { selectLoadDetailById } from '../../store/selectors/loadSelectors';
import { updateDispatchTermsRequest } from '../../store/reducers/loadPageSlice';
import type { UpdateDispatchTermsInput } from 'utils/api/loads/loadApi';
import {
  dispatchTermsSchema,
  DISPATCHER_COMM_TYPE_OPTIONS,
  DISPATCH_FEE_TYPE_OPTIONS,
  DRIVER_PAY_TYPE_OPTIONS,
  type DispatchTermsFormValues,
} from './dispatchTermsSchema';

interface DispatchTermsEditorProps {
  loadId: string;
  onClose: () => void;
}

const toNumber = (value: string | null | undefined, fallback = 0): number =>
  value === null || value === undefined || value === '' ? fallback : Number(value);

export const DispatchTermsEditor: React.FC<DispatchTermsEditorProps> = ({ loadId, onClose }) => {
  const dispatch = useDispatch();
  const load = useSelector(selectLoadDetailById(loadId));

  if (!load) {
    return null;
  }

  const { financials } = load;

  const initialValues: DispatchTermsFormValues = {
    dispatchFeeType: financials.dispatchFeeType ?? 'PERCENTAGE',
    dispatchFeeAmount: toNumber(financials.dispatchFeeAmount, 0),
    partnerSplitPercent: toNumber(financials.partnerSplitPercent, 50),
    driverPayType: financials.driverPayType ?? null,
    driverPayRate:
      financials.driverPayRate === null || financials.driverPayRate === undefined
        ? null
        : Number(financials.driverPayRate),
    dispatcherCommissionType: financials.dispatcherCommissionType ?? null,
    dispatcherCommissionRate:
      financials.dispatcherCommissionRate === null ||
      financials.dispatcherCommissionRate === undefined
        ? null
        : Number(financials.dispatcherCommissionRate),
    feeIncludesAccessorials: financials.feeIncludesAccessorials ?? true,
    payFromNet: financials.payFromNet ?? false,
  };

  const handleSubmit = (values: DispatchTermsFormValues): void => {
    const payload: UpdateDispatchTermsInput = {
      dispatchFeeType: values.dispatchFeeType,
      dispatchFeeAmount: values.dispatchFeeAmount,
      partnerSplitPercent: values.partnerSplitPercent ?? null,
      driverPayType: values.driverPayType ?? null,
      driverPayRate: values.driverPayRate ?? null,
      dispatcherCommissionType: values.dispatcherCommissionType ?? null,
      dispatcherCommissionRate: values.dispatcherCommissionRate ?? null,
      feeIncludesAccessorials: values.feeIncludesAccessorials,
      payFromNet: values.payFromNet,
    };
    dispatch(updateDispatchTermsRequest({ loadId, data: payload }));
    onClose();
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Dispatch Terms"
      subtitle={load.loadNumber}
      initialValues={initialValues}
      validationSchema={dispatchTermsSchema}
      onSubmit={handleSubmit}
    >
      {(formikProps) => {
        const feeType = formikProps.values.dispatchFeeType;
        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <BodyMuted>
              Per-load dispatch terms. Changes affect this load only and are audited.
            </BodyMuted>

            <SelectField
              name="dispatchFeeType"
              label="Dispatch Fee Type"
              data={DISPATCH_FEE_TYPE_OPTIONS}
              formik={formikProps}
            />

            {feeType === 'PERCENTAGE' ? (
              <PercentField
                name="dispatchFeeAmount"
                label="Dispatch Fee (%)"
                formik={formikProps}
              />
            ) : (
              <CurrencyField
                name="dispatchFeeAmount"
                label="Dispatch Fee ($)"
                formik={formikProps}
              />
            )}

            <PercentField
              name="partnerSplitPercent"
              label="Partner Split (%)"
              formik={formikProps}
            />

            <SelectField
              name="driverPayType"
              label="Driver Pay Type"
              data={DRIVER_PAY_TYPE_OPTIONS}
              formik={formikProps}
            />

            <CurrencyField name="driverPayRate" label="Driver Pay Rate" formik={formikProps} />

            <SelectField
              name="dispatcherCommissionType"
              label="Dispatcher Commission Type"
              data={DISPATCHER_COMM_TYPE_OPTIONS}
              formik={formikProps}
            />

            <CurrencyField
              name="dispatcherCommissionRate"
              label="Dispatcher Commission Rate"
              formik={formikProps}
            />

            <CheckboxField
              name="feeIncludesAccessorials"
              label="Fee includes accessorials"
              formik={formikProps}
            />

            <CheckboxField name="payFromNet" label="Pay from net" formik={formikProps} />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};

export default DispatchTermsEditor;
