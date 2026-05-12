import React from 'react';
import { Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import {
  CheckboxField,
  CurrencyField,
  PercentField,
  SelectField,
} from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { dispatchTermsSchema } from '../../validators/fleetSchema';
import { selectCarrierById } from '../../store/selectors/carrierSelectors';
import { updateCarrierRequest } from '../../store/reducers/carrierNewPageSlice';
import type { DispatchFeeType } from '../../types';
import { FEE_TYPE_OPTIONS } from '../../constants';

interface DispatchTermsDrawerProps {
  carrierId: string;
  onClose: () => void;
}

// export const FEE_TYPE_OPTIONS = [
//   { value: 'PERCENTAGE', label: 'Percentage' },
//   { value: 'FLAT', label: 'Flat' },
// ];

export const DispatchTermsDrawer: React.FC<DispatchTermsDrawerProps> = ({ carrierId, onClose }) => {
  const dispatch = useDispatch();
  const carrier = useSelector(selectCarrierById(carrierId));

  if (!carrier) {
    return null;
  }

  const initialValues = {
    companyMarginPercent: carrier.companyMarginPercent ?? 0,
    dispatchFeeType: (carrier.dispatchFeeType ?? 'PERCENTAGE') as DispatchFeeType,
    dispatchFeeAmount: carrier.dispatchFeeAmount ?? 0,
    feeIncludesAccessorials: carrier.feeIncludesAccessorials ?? true,
    dispatchAgreementOnFile: carrier.dispatchAgreementOnFile ?? false,
    dispatchAgreementSignedAt: null as string | null,
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Dispatch Terms"
      subtitle={carrier.name}
      initialValues={initialValues}
      validationSchema={dispatchTermsSchema}
      onSubmit={(values) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
      }}
    >
      {(formikProps) => {
        const feeType: DispatchFeeType = formikProps.values.dispatchFeeType ?? 'PERCENTAGE';
        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <SelectField
              name="dispatchFeeType"
              label="Dispatch Fee Type"
              data={FEE_TYPE_OPTIONS}
              formik={formikProps}
            />

            {feeType === 'PERCENTAGE' ? (
              <PercentField
                name="companyMarginPercent"
                label="Company Margin"
                formik={formikProps}
              />
            ) : (
              <CurrencyField
                name="dispatchFeeAmount"
                label="Dispatch Fee Amount"
                formik={formikProps}
              />
            )}

            <CheckboxField
              name="feeIncludesAccessorials"
              label="Fee includes accessorials"
              formik={formikProps}
            />

            <CheckboxField
              name="dispatchAgreementOnFile"
              label="Dispatch agreement on file"
              formik={formikProps}
            />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
